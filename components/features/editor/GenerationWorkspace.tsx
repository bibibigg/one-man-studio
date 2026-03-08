'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import pLimit from 'p-limit'

import { useGenerationStore } from '@/lib/stores/generation'
import { LIMITS } from '@/lib/utils/constants'
import type { SceneGenState } from '@/lib/stores/generation'
import type { EditorScene } from '@/types/editor'

import { SceneGenerationCard } from './SceneGenerationCard'

interface GenerationWorkspaceProps {
  scenes: EditorScene[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MAX_POLL_FAILURES = 5

async function runGenerationPipeline(
  scene: EditorScene,
  uploadedImageUrl: string | undefined,
  setSceneState: (id: string, state: Partial<SceneGenState>) => void,
  signal: AbortSignal
): Promise<void> {
  if (signal.aborted) return

  try {
    let imageUrl = uploadedImageUrl ?? scene.referenceImageUrl ?? undefined

    // Step 1: Generate AI image (image_to_video mode only)
    if (scene.generationMode === 'image_to_video') {
      setSceneState(scene.id, { status: 'generating_image' })
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneId: scene.id, prompt: scene.visualPrompt }),
        signal,
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error ?? '이미지 생성 실패')
      }
      const data = (await res.json()) as { imageUrl: string }
      imageUrl = data.imageUrl
      setSceneState(scene.id, { imageUrl })
    }

    if (signal.aborted) return

    // Step 2: Start video generation
    setSceneState(scene.id, { status: 'generating_video' })
    const videoRes = await fetch('/api/generate/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneId: scene.id,
        mode: scene.generationMode,
        prompt: scene.visualPrompt,
        imageUrl,
      }),
      signal,
    })
    if (!videoRes.ok) {
      const err = (await videoRes.json()) as { error?: string }
      throw new Error(err.error ?? '비디오 생성 시작 실패')
    }
    const { taskId } = (await videoRes.json()) as { taskId: string }
    setSceneState(scene.id, { taskId })

    // Step 3: Poll for completion
    let consecutiveFailures = 0
    while (!signal.aborted) {
      await sleep(5000)
      if (signal.aborted) break

      const params = new URLSearchParams({
        sceneId: scene.id,
        taskId,
        mode: scene.generationMode,
      })
      const statusRes = await fetch(`/api/generate/status?${params}`, { signal })

      if (!statusRes.ok) {
        consecutiveFailures++
        if (consecutiveFailures >= MAX_POLL_FAILURES) {
          throw new Error('상태 확인 중 반복적인 오류가 발생했습니다')
        }
        continue
      }
      consecutiveFailures = 0

      const statusData = (await statusRes.json()) as {
        status: 'processing' | 'completed' | 'failed'
        videoUrl?: string
        error?: string
      }

      if (statusData.status === 'completed') {
        setSceneState(scene.id, { status: 'completed', videoUrl: statusData.videoUrl })
        return
      }
      if (statusData.status === 'failed') {
        setSceneState(scene.id, { status: 'failed', error: statusData.error ?? 'Generation failed' })
        return
      }
    }
  } catch (err) {
    if (signal.aborted) return
    setSceneState(scene.id, {
      status: 'failed',
      error: err instanceof Error ? err.message : '생성에 실패했습니다',
    })
  }
}

export function GenerationWorkspace({ scenes }: GenerationWorkspaceProps) {
  const router = useRouter()
  const { scenes: genScenes, isGenerating, setSceneState, setIsGenerating } = useGenerationStore()
  const [hasStarted, setHasStarted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Initialize scenes to idle (or completed if already generated)
  useEffect(() => {
    scenes.forEach((s) => {
      if (!genScenes[s.id]) {
        setSceneState(s.id, {
          status: s.videoUrl ? 'completed' : 'idle',
          videoUrl: s.videoUrl ?? undefined,
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Abort in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleUpload = useCallback(
    async (sceneId: string, file: File) => {
      setSceneState(sceneId, { status: 'uploading', error: undefined })
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('sceneId', sceneId)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = (await res.json()) as { error?: string }
          throw new Error(err.error ?? '업로드 실패')
        }
        const { url } = (await res.json()) as { url: string }
        setSceneState(sceneId, { status: 'idle', imageUrl: url })
      } catch (err) {
        setSceneState(sceneId, {
          status: 'failed',
          error: err instanceof Error ? err.message : '업로드 실패',
        })
      }
    },
    [setSceneState]
  )

  const startGeneration = useCallback(
    (targetScenes: EditorScene[]) => {
      const controller = new AbortController()
      abortRef.current = controller
      setIsGenerating(true)
      setHasStarted(true)

      const limit = pLimit(LIMITS.CONCURRENT_GENERATION_LIMIT)

      Promise.all(
        targetScenes.map((scene) =>
          limit(() => {
            // Read latest uploaded URL at execution time (not closure capture time)
            const uploadedUrl = useGenerationStore.getState().scenes[scene.id]?.imageUrl
            return runGenerationPipeline(scene, uploadedUrl, setSceneState, controller.signal)
          })
        )
      ).finally(() => setIsGenerating(false))
    },
    [setIsGenerating, setSceneState]
  )

  const handleStartGeneration = useCallback(() => {
    const pending = scenes.filter((s) => genScenes[s.id]?.status !== 'completed')
    startGeneration(pending)
  }, [scenes, genScenes, startGeneration])

  const handleRetry = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId)
      if (!scene || isGenerating) return
      setSceneState(sceneId, { status: 'idle', error: undefined, taskId: undefined })
      startGeneration([scene])
    },
    [scenes, isGenerating, setSceneState, startGeneration]
  )

  const canStart = scenes.every((s) => {
    if (s.generationMode === 'image_text_to_video') {
      return !!(s.referenceImageUrl || genScenes[s.id]?.imageUrl)
    }
    return true
  })

  const allCompleted =
    scenes.length > 0 && scenes.every((s) => genScenes[s.id]?.status === 'completed')

  return (
    <div className="min-h-screen bg-black px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">영상 생성</h1>
          <p className="mt-1 text-sm text-white/40">AI가 각 장면의 영상 클립을 생성합니다</p>
        </div>

        {/* Scene cards */}
        <div className="mb-8 space-y-4">
          {scenes.map((scene, i) => (
            <SceneGenerationCard
              key={scene.id}
              sceneId={scene.id}
              index={i}
              description={scene.description}
              mode={scene.generationMode}
              referenceImageUrl={scene.referenceImageUrl}
              genState={genScenes[scene.id] ?? { status: 'idle' }}
              onUpload={handleUpload}
              onRetry={handleRetry}
              isGenerating={isGenerating}
            />
          ))}
        </div>

        {/* Action buttons */}
        {!hasStarted && (
          <button
            onClick={handleStartGeneration}
            disabled={!canStart || isGenerating}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-30"
          >
            {canStart ? '생성 시작' : '참조 이미지를 먼저 업로드해주세요'}
          </button>
        )}

        {hasStarted && isGenerating && (
          <p className="text-center text-sm text-white/30">생성 중입니다. 잠시만 기다려주세요...</p>
        )}

        {/* Phase 5: router.refresh() re-fetches scenes and switches to Remotion editor */}
        {allCompleted && (
          <button
            onClick={() => router.refresh()}
            className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black"
          >
            에디터로 이동 →
          </button>
        )}
      </div>
    </div>
  )
}
