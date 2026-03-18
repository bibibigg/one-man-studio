import { getAuthenticatedUserId } from '@/lib/auth/server'
import { generateImage } from '@/lib/api/image-gen'
import { getServiceSupabase } from '@/lib/api/supabase'

export async function POST(request: Request): Promise<Response> {
  let sceneId: string | undefined
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { sceneId: string; prompt: string }
    sceneId = body.sceneId
    const { prompt } = body

    if (!sceneId || !prompt) {
      return Response.json({ error: 'sceneId와 prompt는 필수입니다' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Verify ownership
    const { data: scene } = await supabase
      .from('scenes')
      .select('id, project_id')
      .eq('id', sceneId)
      .single()
    if (!scene) return Response.json({ error: 'Scene not found' }, { status: 404 })

    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', scene.project_id)
      .single()
    if (!project || project.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await supabase.from('scenes').update({ status: 'generating_image' }).eq('id', sceneId)

    // Generate image
    const { base64, mimeType } = await generateImage(prompt)

    // Upload to Supabase Storage
    const ext = mimeType.split('/')[1] ?? 'png'
    const path = `${userId}/${sceneId}.${ext}`
    const buffer = Buffer.from(base64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(path, buffer, { contentType: mimeType, upsert: true })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('generated-images').getPublicUrl(path)

    await supabase
      .from('scenes')
      .update({ generated_image_url: urlData.publicUrl })
      .eq('id', sceneId)

    return Response.json({ imageUrl: urlData.publicUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    if (sceneId) {
      try {
        const supabase = getServiceSupabase()
        await supabase
          .from('scenes')
          .update({ status: 'failed', error_message: String(error) })
          .eq('id', sceneId)
      } catch {
        // best-effort status update
      }
    }
    return Response.json({ error: '이미지 생성에 실패했습니다' }, { status: 500 })
  }
}
