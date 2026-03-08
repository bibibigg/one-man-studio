import { z } from 'zod'

import { LIMITS } from './constants'
import type { SceneAnalysisResult } from '@/types/scene'

const SceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  description: z.string().min(1),
  visualPrompt: z.string().min(1),
  duration: z
    .number()
    .min(LIMITS.SCENE_MIN_DURATION_SECONDS)
    .max(LIMITS.SCENE_MAX_DURATION_SECONDS),
})

const AnalysisResultSchema = z.object({
  scenes: z.array(SceneSchema).min(1).max(LIMITS.MAX_SCENES_PER_PROJECT),
})

function extractJson(text: string): string {
  // Handle markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch?.[1]) return codeBlockMatch[1]

  // Fall back to raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch?.[0]) return jsonMatch[0]

  return text.trim()
}

export function parseSceneAnalysis(llmResponse: string): SceneAnalysisResult[] {
  try {
    const jsonStr = extractJson(llmResponse)
    const parsed: unknown = JSON.parse(jsonStr)
    const validated = AnalysisResultSchema.parse(parsed)

    return validated.scenes.map((scene) => ({
      sceneNumber: scene.sceneNumber,
      description: scene.description,
      visualPrompt: scene.visualPrompt,
      duration: Math.max(
        LIMITS.SCENE_MIN_DURATION_SECONDS,
        Math.min(LIMITS.SCENE_MAX_DURATION_SECONDS, scene.duration)
      ),
    }))
  } catch {
    throw new Error('LLM 응답을 파싱하는 데 실패했습니다. 다시 시도해 주세요.')
  }
}
