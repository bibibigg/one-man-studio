import { getAuthenticatedUserId } from '@/lib/auth/server'
import { createTextToVideoJob, createImageToVideoJob } from '@/lib/api/video-gen'
import { getServiceSupabase } from '@/lib/api/supabase'
import { buildVideoGenerationPrompt } from '@/lib/prompts/templates'
import type { GenerationMode } from '@/types/scene'

interface VideoGenBody {
  sceneId: string
  mode: GenerationMode
  prompt: string
  imageUrl?: string
}

export async function POST(request: Request): Promise<Response> {
  let sceneId: string | undefined
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as VideoGenBody
    sceneId = body.sceneId
    const { mode, prompt, imageUrl } = body

    if (!sceneId || !mode || !prompt) {
      return Response.json({ error: 'sceneId, mode, prompt은 필수입니다' }, { status: 400 })
    }
    // Validate imageUrl before any DB writes to prevent state pollution
    if (mode !== 'text_to_video' && !imageUrl) {
      return Response.json({ error: 'imageUrl은 이 생성 모드에서 필수입니다' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Verify ownership and get scene data
    const { data: scene } = await supabase
      .from('scenes')
      .select('id, project_id, duration_frames, generation_attempts')
      .eq('id', sceneId)
      .single()
    if (!scene) return Response.json({ error: 'Scene not found' }, { status: 404 })

    const { data: project } = await supabase
      .from('projects')
      .select('user_id, category_id, sub_category_id')
      .eq('id', scene.project_id)
      .single()
    if (!project || project.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await supabase
      .from('scenes')
      .update({
        status: 'generating_video',
        generation_attempts: (scene.generation_attempts ?? 0) + 1,
      })
      .eq('id', sceneId)

    // Apply category style prefix to prompt
    const styledPrompt = buildVideoGenerationPrompt(
      prompt,
      project.category_id,
      project.sub_category_id ?? undefined
    )

    // Start generation job based on mode
    let taskId: string
    if (mode === 'text_to_video') {
      taskId = await createTextToVideoJob(styledPrompt, scene.duration_frames)
    } else {
      taskId = await createImageToVideoJob(imageUrl!, styledPrompt, scene.duration_frames)
    }

    await supabase.from('scenes').update({ kling_task_id: taskId }).eq('id', sceneId)

    return Response.json({ taskId })
  } catch (error) {
    console.error('Video generation error:', error)
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
    return Response.json({ error: '비디오 생성 시작에 실패했습니다' }, { status: 500 })
  }
}
