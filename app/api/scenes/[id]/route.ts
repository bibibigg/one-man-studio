import { auth } from '@/lib/auth/auth'
import { getServiceSupabase } from '@/lib/api/supabase'
import { LIMITS } from '@/lib/utils/constants'
import type { GenerationMode } from '@/types/scene'

const VALID_MODES: GenerationMode[] = ['text_to_video', 'image_to_video', 'image_text_to_video']

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: sceneId } = await params

  const rawBody = (await req.json()) as unknown
  if (typeof rawBody !== 'object' || rawBody === null) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const body = rawBody as {
    generationMode?: unknown
    durationSeconds?: unknown
    visualPrompt?: unknown
  }

  const updates: Record<string, unknown> = {}

  if (body.generationMode !== undefined) {
    if (!VALID_MODES.includes(body.generationMode as GenerationMode)) {
      return Response.json({ error: 'Invalid generationMode' }, { status: 400 })
    }
    updates.generation_mode = body.generationMode
  }

  if (body.durationSeconds !== undefined) {
    const secs = Number(body.durationSeconds)
    if (
      !Number.isFinite(secs) ||
      secs < LIMITS.SCENE_MIN_DURATION_SECONDS ||
      secs > LIMITS.SCENE_MAX_DURATION_SECONDS
    ) {
      return Response.json(
        {
          error: `durationSeconds는 ${LIMITS.SCENE_MIN_DURATION_SECONDS}~${LIMITS.SCENE_MAX_DURATION_SECONDS}초 사이여야 합니다`,
        },
        { status: 400 }
      )
    }
    updates.duration_frames = Math.round(secs * LIMITS.FPS)
  }

  if (body.visualPrompt !== undefined) {
    if (typeof body.visualPrompt !== 'string' || body.visualPrompt.trim() === '') {
      return Response.json({ error: 'visualPrompt는 비어있을 수 없습니다' }, { status: 400 })
    }
    updates.visual_prompt = body.visualPrompt.trim()
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: '수정할 필드가 없습니다' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  // 소유권 확인: scenes → projects join
  const { data: scene, error: fetchError } = await supabase
    .from('scenes')
    .select('id, status, projects!inner(user_id)')
    .eq('id', sceneId)
    .single()

  if (fetchError || !scene) {
    return Response.json({ error: 'Scene not found' }, { status: 404 })
  }

  const project = Array.isArray(scene.projects) ? scene.projects[0] : scene.projects
  if ((project as { user_id: string }).user_id !== session.user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // pending(idle) 상태인 씬만 수정 허용
  if (scene.status !== 'pending') {
    return Response.json({ error: '생성 중이거나 완료된 씬은 수정할 수 없습니다' }, { status: 409 })
  }

  const { error: updateError } = await supabase.from('scenes').update(updates).eq('id', sceneId)

  if (updateError) {
    console.error('Failed to update scene:', updateError.message)
    return Response.json({ error: '씬 업데이트에 실패했습니다' }, { status: 500 })
  }

  return Response.json({ success: true })
}
