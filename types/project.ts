export type ProjectStatus =
  | 'draft'
  | 'splitting'
  | 'generating'
  | 'editing'
  | 'exporting'
  | 'completed'
  | 'failed'

export interface Project {
  id: string
  userId: string
  name: string
  categoryId: string
  subCategoryId?: string
  promptTemplateId?: string
  scenario: string
  customPrompt?: string
  status: ProjectStatus
  compositionState?: Record<string, unknown>
  finalVideoUrl?: string
  thumbnailUrl?: string
  shareToken?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface CreateProjectData {
  name: string
  categoryId: string
  subCategoryId?: string
  promptTemplateId?: string
  scenario: string
  customPrompt?: string
}

export interface UpdateProjectData {
  name?: string
  status?: ProjectStatus
  compositionState?: Record<string, unknown>
  finalVideoUrl?: string
  thumbnailUrl?: string
  errorMessage?: string
}

/** Supabase DB row shape for dashboard list queries */
export interface ProjectRow {
  id: string
  name: string
  status: ProjectStatus
  thumbnail_url: string | null
  final_video_url: string | null
  updated_at: string
}
