import { getServiceSupabase } from '@/lib/api/supabase'
import type { CategoryWithSubs, PromptTemplate } from '@/types/category'

export async function GET() {
  try {
    const supabase = getServiceSupabase()

    const [categoriesResult, subCategoriesResult, templatesResult] = await Promise.all([
      supabase.from('categories').select('*').order('id'),
      supabase.from('sub_categories').select('*').order('category_id, id'),
      supabase.from('prompt_templates').select('*').eq('is_active', true),
    ])

    if (categoriesResult.error) throw categoriesResult.error
    if (subCategoriesResult.error) throw subCategoriesResult.error
    if (templatesResult.error) throw templatesResult.error

    const categoriesWithSubs: CategoryWithSubs[] = (categoriesResult.data ?? []).map(
      (cat) => ({
        id: cat.id,
        name: cat.name,
        nameKo: cat.name_ko,
        description: cat.description ?? undefined,
        icon: cat.icon ?? undefined,
        subCategories: (subCategoriesResult.data ?? [])
          .filter((sub) => sub.category_id === cat.id)
          .map((sub) => ({
            id: sub.id,
            categoryId: sub.category_id,
            name: sub.name,
            nameKo: sub.name_ko,
          })),
      })
    )

    const templates: PromptTemplate[] = (templatesResult.data ?? []).map((t) => ({
      id: t.id,
      categoryId: t.category_id,
      subCategoryId: t.sub_category_id ?? undefined,
      name: t.name,
      sceneSplitPrompt: t.scene_split_prompt,
      imageStylePrompt: t.image_style_prompt,
      defaultMotionPreset: (t.default_motion_preset as Record<string, unknown>) ?? undefined,
      exampleScenario: t.example_scenario ?? undefined,
      isActive: t.is_active,
    }))

    return Response.json({ categories: categoriesWithSubs, templates })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return Response.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
