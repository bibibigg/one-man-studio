import { useMutation } from '@tanstack/react-query'

import type { AnalyzedScene } from '@/lib/stores/create'

interface AnalyzeRequest {
  scenario: string
  categoryId: string
  subCategoryId?: string
  customPrompt?: string
}

interface AnalyzeResponse {
  projectId: string
  scenes: AnalyzedScene[]
}

async function postAnalyze(data: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch('/api/scenes/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const body = (await res.json()) as { error?: string }
    throw new Error(body.error ?? '시나리오 분석에 실패했습니다')
  }

  return res.json()
}

export function useAnalyzeScenario() {
  return useMutation({
    mutationFn: postAnalyze,
  })
}
