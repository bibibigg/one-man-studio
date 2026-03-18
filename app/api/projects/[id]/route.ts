import { getAuthenticatedUserId } from '@/lib/auth/server'
import { getServiceSupabase } from '@/lib/api/supabase'
import type { SceneCompositionState } from '@/lib/stores/editor'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()

  const { data: project, error } = await supabase
    .from('projects')
    .select(
      'id, name, status, thumbnail_url, final_video_url, share_token, scenario, created_at, updated_at'
    )
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  // PGRST116 = "no rows returned" — legitimate 404, not a DB error
  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch project:', error.message)
    return Response.json({ error: '프로젝트를 불러오지 못했습니다' }, { status: 500 })
  }

  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  return Response.json(project)
}

export async function DELETE(_req: Request, { params }: Props) {
  const { id } = await params

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()

  // Verify ownership before deleting
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  const { error } = await supabase.from('projects').delete().eq('id', id)

  if (error) {
    console.error('Failed to delete project:', error.message)
    return Response.json({ error: '삭제에 실패했습니다' }, { status: 500 })
  }

  return Response.json({ success: true })
}

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params

  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = (await req.json()) as unknown
  if (typeof rawBody !== 'object' || rawBody === null) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const body = rawBody as {
    compositionState?: Record<string, Partial<SceneCompositionState>>
    sceneOrder?: string[]
  }

  const supabase = getServiceSupabase()

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 })
  }

  const compositionPayload = {
    compositions: body.compositionState ?? {},
    sceneOrder: body.sceneOrder ?? [],
  }

  const { error } = await supabase
    .from('projects')
    .update({
      composition_state: compositionPayload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Failed to save composition state:', error.message)
    return Response.json({ error: '저장에 실패했습니다' }, { status: 500 })
  }

  return Response.json({ success: true })
}
