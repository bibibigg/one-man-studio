import { useQuery } from '@tanstack/react-query'
import type { CategoryWithSubs, PromptTemplate } from '@/types/category'

interface CategoriesResponse {
  categories: CategoryWithSubs[]
  templates: PromptTemplate[]
}

async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch('/api/categories')
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function getCategoryTemplate(
  templates: PromptTemplate[] | undefined,
  categoryId: string | null,
  subCategoryId: string | null
): PromptTemplate | undefined {
  if (!templates || !categoryId) return undefined

  return (
    templates.find(
      (t) => t.categoryId === categoryId && t.subCategoryId === subCategoryId
    ) ?? templates.find((t) => t.categoryId === categoryId && !t.subCategoryId)
  )
}
