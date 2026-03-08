'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { SceneReview } from '@/components/features/create/SceneReview'
import { useAnalyzeScenario } from '@/lib/query/scenes'
import { useCreateStore } from '@/lib/stores/create'

export default function AnalyzePage() {
  const router = useRouter()
  const { categoryId, subCategoryId, scenario, customPrompt, projectId, analyzedScenes, setAnalysisResult } =
    useCreateStore()

  const { mutate: analyze, isPending, error } = useAnalyzeScenario()

  const runAnalysis = () => {
    if (!categoryId || !scenario) return
    analyze(
      { scenario, categoryId, subCategoryId: subCategoryId ?? undefined, customPrompt: customPrompt || undefined },
      {
        onSuccess: (data) => {
          setAnalysisResult(data.projectId, data.scenes)
        },
      }
    )
  }

  useEffect(() => {
    // Redirect if missing required data
    if (!categoryId || !scenario) {
      router.replace('/create')
      return
    }

    // Only auto-analyze if no result yet
    if (!projectId && analyzedScenes.length === 0) {
      runAnalysis()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Intentional empty deps: run once on mount. categoryId/scenario are read via
  // Zustand selectors which always return the latest value, so no stale closure risk.
  }, [])

  // Show spinner while analyzing or before any result has arrived
  const isAnalyzing = isPending || (!projectId && analyzedScenes.length === 0 && !error)

  if (isAnalyzing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <div className="text-center">
          <p className="text-white">시나리오를 분석하고 있습니다...</p>
          <p className="mt-1 text-sm text-white/40">Gemini AI가 장면을 구성 중이에요</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <p className="text-center text-red-400">{error.message}</p>
        <button
          onClick={runAnalysis}
          className="rounded-xl border border-white/20 px-6 py-3 text-sm text-white transition-all hover:bg-white/5"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!projectId || analyzedScenes.length === 0) return null

  return (
    <SceneReview
      scenes={analyzedScenes}
      projectId={projectId}
      onReanalyze={runAnalysis}
      isReanalyzing={isPending}
    />
  )
}
