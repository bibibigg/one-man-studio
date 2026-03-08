import { buildSceneSplitPrompt } from './templates'

export function getSceneSplitterSystemPrompt(
  categoryId: string,
  subCategoryId?: string,
  customPrompt?: string
): string {
  return buildSceneSplitPrompt(categoryId, subCategoryId, customPrompt)
}

export const SCENE_SPLITTER_USER_PROMPT_TEMPLATE = (scenario: string): string =>
  `Here is the scenario to analyze:\n\n${scenario}`
