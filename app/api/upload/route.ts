import { auth } from '@/lib/auth/auth'
import { getServiceSupabase } from '@/lib/api/supabase'
import { ALLOWED_IMAGE_TYPES, LIMITS } from '@/lib/utils/constants'

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const sceneId = formData.get('sceneId') as string | null

    if (!file || !sceneId) {
      return Response.json({ error: 'file과 sceneId는 필수입니다' }, { status: 400 })
    }
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return Response.json(
        { error: '지원하지 않는 파일 형식입니다 (JPEG, PNG, WebP만 허용)' },
        { status: 400 }
      )
    }
    if (file.size > LIMITS.MAX_REFERENCE_IMAGE_SIZE) {
      return Response.json(
        { error: `파일 크기는 최대 ${LIMITS.MAX_REFERENCE_IMAGE_SIZE / 1024 / 1024}MB입니다` },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    // Verify scene belongs to this user
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

    const ext = file.type.split('/')[1] ?? 'jpg'
    const path = `${userId}/${sceneId}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('reference-images')
      .upload(path, buffer, { contentType: file.type, upsert: true })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('reference-images').getPublicUrl(path)

    await supabase
      .from('scenes')
      .update({ reference_image_url: urlData.publicUrl })
      .eq('id', sceneId)

    return Response.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: '이미지 업로드에 실패했습니다' }, { status: 500 })
  }
}
