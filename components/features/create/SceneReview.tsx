'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { useCreateStore } from '@/lib/stores/create'
import type { AnalyzedScene } from '@/lib/stores/create'

import { SceneCard } from './SceneCard'

interface SceneReviewProps {
  scenes: AnalyzedScene[]
  projectId: string
  onReanalyze: () => void
  isReanalyzing: boolean
}

export function SceneReview({ scenes, projectId, onReanalyze, isReanalyzing }: SceneReviewProps) {
  const router = useRouter()
  const { reset } = useCreateStore()

  const handleProceed = () => {
    reset()
    router.push(`/editor/${projectId}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">장면 분석 결과</h1>
          <p className="mt-1 text-white/50">
            {scenes.length}개의 장면으로 분석되었습니다. 프롬프트를 클릭하면 편집할 수 있어요.
          </p>
        </div>
        <Button variant="ghost" onClick={onReanalyze} disabled={isReanalyzing}>
          {isReanalyzing ? '분석 중...' : '다시 분석'}
        </Button>
      </div>

      <div className="space-y-3">
        {scenes.map((scene, index) => (
          <SceneCard key={scene.id} scene={scene} index={index} />
        ))}
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleProceed}>생성 시작 →</Button>
      </div>
    </div>
  )
}
