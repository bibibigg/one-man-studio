import { getAuthenticatedUserId } from '@/lib/auth/server'
import { analyzeScenario } from '@/lib/api/llm'
import { getServiceSupabase } from '@/lib/api/supabase'
import { LIMITS } from '@/lib/utils/constants'
import type { SceneAnalysisResult } from '@/types/scene'

interface AnalyzeRequestBody {
  scenario: string
  categoryId: string
  subCategoryId?: string
  customPrompt?: string
}

export async function POST(request: Request) {
  try {
    // 1. Parse body first to avoid orphaned DB records on JSON parse failure
    const body = (await request.json()) as AnalyzeRequestBody
    const { scenario, categoryId, subCategoryId, customPrompt } = body

    // 2. Auth check
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Input validation (length limits prevent LLM cost abuse)
    const trimmedScenario = scenario?.trim() ?? ''
    if (!trimmedScenario || !categoryId) {
      return Response.json({ error: 'scenario와 categoryId는 필수입니다' }, { status: 400 })
    }
    if (trimmedScenario.length < LIMITS.MIN_SCENARIO_LENGTH) {
      return Response.json(
        { error: `시나리오는 최소 ${LIMITS.MIN_SCENARIO_LENGTH}자 이상이어야 합니다` },
        { status: 400 }
      )
    }
    if (trimmedScenario.length > LIMITS.MAX_SCENARIO_LENGTH) {
      return Response.json(
        { error: `시나리오는 최대 ${LIMITS.MAX_SCENARIO_LENGTH}자까지 입력할 수 있습니다` },
        { status: 400 }
      )
    }

    // 4. Rate limit check
    const supabase = getServiceSupabase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [dailyResult, totalResult] = await Promise.all([
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString()),
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    if ((dailyResult.count ?? 0) >= LIMITS.MAX_PROJECTS_PER_DAY) {
      return Response.json(
        { error: `일일 최대 ${LIMITS.MAX_PROJECTS_PER_DAY}개 프로젝트까지 생성할 수 있습니다` },
        { status: 429 }
      )
    }
    if ((totalResult.count ?? 0) >= LIMITS.MAX_TOTAL_PROJECTS) {
      return Response.json(
        { error: `최대 ${LIMITS.MAX_TOTAL_PROJECTS}개 프로젝트까지 생성할 수 있습니다` },
        { status: 429 }
      )
    }

    // 5. Create project record
    const projectName = trimmedScenario.slice(0, 50) + (trimmedScenario.length > 50 ? '...' : '')
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: projectName,
        category_id: categoryId,
        sub_category_id: subCategoryId ?? null,
        scenario: trimmedScenario,
        custom_prompt: customPrompt?.trim() ?? null,
        status: 'splitting',
      })
      .select()
      .single()

    if (projectError || !project) throw projectError ?? new Error('Failed to create project')

    // 6. Analyze with LLM
    let sceneResults: SceneAnalysisResult[]
    try {
      sceneResults = await analyzeScenario({
        scenario: trimmedScenario,
        categoryId,
        subCategoryId,
        customPrompt: customPrompt?.trim(),
      })
    } catch (llmError) {
      await supabase.from('projects').update({ status: 'failed' }).eq('id', project.id)
      throw llmError
    }

    // 7. Create scene records
    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .insert(
        sceneResults.map((s) => ({
          project_id: project.id,
          order_index: s.sceneNumber - 1,
          description: s.description,
          visual_prompt: s.visualPrompt,
          generation_mode: 'text_to_video',
          duration_frames: s.duration * LIMITS.FPS,
          transition_type: 'crossfade',
          transition_duration_frames: 15,
          status: 'pending',
        }))
      )
      .select()

    if (scenesError || !scenes) {
      await supabase.from('projects').update({ status: 'failed' }).eq('id', project.id)
      throw scenesError ?? new Error('Failed to create scenes')
    }

    await supabase.from('projects').update({ status: 'draft' }).eq('id', project.id)

    return Response.json({
      projectId: project.id,
      scenes: scenes.map((s) => ({
        id: s.id,
        orderIndex: s.order_index,
        description: s.description,
        visualPrompt: s.visual_prompt,
        generationMode: s.generation_mode,
        durationFrames: s.duration_frames,
      })),
    })
  } catch (error) {
    console.error('Scene analysis error:', error)
    return Response.json({ error: '시나리오 분석에 실패했습니다' }, { status: 500 })
  }
}
