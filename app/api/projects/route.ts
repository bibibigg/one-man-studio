import { getAuthenticatedUserId } from '@/lib/auth/server'
import { getServiceSupabase } from '@/lib/api/supabase'
import { checkProjectRateLimit } from '@/lib/utils/rate-limit'

export async function GET() {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      'id, name, status, thumbnail_url, final_video_url, share_token, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch projects:', error.message)
    return Response.json({ error: '프로젝트 목록을 불러오지 못했습니다' }, { status: 500 })
  }

  return Response.json(projects ?? [])
}

export async function POST(req: Request) {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawBody = (await req.json()) as unknown
  if (typeof rawBody !== 'object' || rawBody === null) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const body = rawBody as {
    name?: string
    categoryId?: string
    subCategoryId?: string
    scenario?: string
    customPrompt?: string
  }

  if (
    typeof body.name !== 'string' ||
    body.name.trim() === '' ||
    typeof body.scenario !== 'string' ||
    body.scenario.trim() === ''
  ) {
    return Response.json({ error: 'name and scenario are required' }, { status: 400 })
  }

  const rateLimit = await checkProjectRateLimit(userId)
  if (!rateLimit.allowed) {
    return Response.json({ error: rateLimit.message }, { status: 429 })
  }

  const supabase = getServiceSupabase()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: body.name,
      category_id: body.categoryId ?? 'movie',
      sub_category_id: body.subCategoryId ?? null,
      scenario: body.scenario,
      custom_prompt: body.customPrompt ?? null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create project:', error.message)
    return Response.json({ error: '프로젝트 생성에 실패했습니다' }, { status: 500 })
  }

  return Response.json({ id: project.id }, { status: 201 })
}
