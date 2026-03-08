import { auth } from '@/lib/auth/auth'
import { getVideoJobStatus } from '@/lib/api/video-gen'
import { getServiceSupabase } from '@/lib/api/supabase'
import type { GenerationMode } from '@/types/scene'

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const sceneId = searchParams.get('sceneId')
    const taskId = searchParams.get('taskId')
    const mode = searchParams.get('mode') as GenerationMode | null

    if (!sceneId || !taskId || !mode) {
      return Response.json({ error: 'sceneId, taskId, mode은 필수입니다' }, { status: 400 })
    }

    const supabase = getServiceSupabase()

    // Verify ownership and validate taskId integrity
    const { data: scene } = await supabase
      .from('scenes')
      .select('id, project_id, kling_task_id')
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

    // Reject if taskId doesn't match DB — prevents probing other users' generation jobs
    if (scene.kling_task_id !== taskId) {
      return Response.json({ error: 'Invalid taskId' }, { status: 400 })
    }

    // Map GenerationMode → VideoJobMode (text_to_video vs image modes)
    const jobMode = mode === 'text_to_video' ? 'text_to_video' : 'image_to_video'
    const jobStatus = await getVideoJobStatus(taskId, jobMode)

    if (jobStatus.status === 'completed' && jobStatus.videoUrl) {
      // Save Kling CDN URL directly (re-uploading would risk serverless timeout)
      const durationFrames = jobStatus.durationSeconds
        ? Math.round(jobStatus.durationSeconds * 30)
        : undefined
      await supabase
        .from('scenes')
        .update({
          status: 'completed',
          video_url: jobStatus.videoUrl,
          error_message: null,
          ...(durationFrames !== undefined && { duration_frames: durationFrames }),
        })
        .eq('id', sceneId)
      return Response.json({
        status: 'completed',
        videoUrl: jobStatus.videoUrl,
        durationFrames,
      })
    }

    if (jobStatus.status === 'failed') {
      await supabase
        .from('scenes')
        .update({ status: 'failed', error_message: jobStatus.error ?? 'Generation failed' })
        .eq('id', sceneId)
      return Response.json({ status: 'failed', error: jobStatus.error })
    }

    return Response.json({ status: 'processing' })
  } catch (error) {
    console.error('Status check error:', error)
    return Response.json({ error: '상태 확인에 실패했습니다' }, { status: 500 })
  }
}
