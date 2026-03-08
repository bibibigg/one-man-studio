import { GoogleGenerativeAI } from '@google/generative-ai'

import { getSceneSplitterSystemPrompt, SCENE_SPLITTER_USER_PROMPT_TEMPLATE } from '@/lib/prompts/scene-splitter'
import { parseSceneAnalysis } from '@/lib/utils/scene-parser'
import type { SceneAnalysisResult } from '@/types/scene'

interface AnalyzeParams {
  scenario: string
  categoryId: string
  subCategoryId?: string
  customPrompt?: string
}

export async function analyzeScenario(params: AnalyzeParams): Promise<SceneAnalysisResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not configured')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: getSceneSplitterSystemPrompt(
      params.categoryId,
      params.subCategoryId,
      params.customPrompt
    ),
  })

  const result = await model.generateContent(
    SCENE_SPLITTER_USER_PROMPT_TEMPLATE(params.scenario)
  )

  const text = result.response.text()
  return parseSceneAnalysis(text)
}
