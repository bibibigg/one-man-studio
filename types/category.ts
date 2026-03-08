export interface Category {
  id: string
  name: string
  nameKo: string
  description?: string
  icon?: string
}

export interface SubCategory {
  id: string
  categoryId: string
  name: string
  nameKo: string
}

export interface PromptTemplate {
  id: string
  categoryId: string
  subCategoryId?: string
  name: string
  sceneSplitPrompt: string
  imageStylePrompt: string
  defaultMotionPreset?: Record<string, unknown>
  exampleScenario?: string
  isActive: boolean
}

export interface CategoryWithSubs extends Category {
  subCategories: SubCategory[]
}
