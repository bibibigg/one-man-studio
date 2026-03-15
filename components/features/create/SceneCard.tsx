'use client'

import { useEffect, useState } from 'react'

import { useCreateStore } from '@/lib/stores/create'
import type { AnalyzedScene } from '@/lib/stores/create'
import { LIMITS } from '@/lib/utils/constants'

import { GenerationModeSelector } from './GenerationModeSelector'

interface SceneCardProps {
  scene: AnalyzedScene
  index: number
}

export function SceneCard({ scene, index }: SceneCardProps) {
  const { updateSceneVisualPrompt, updateSceneMode, updateSceneDuration } = useCreateStore()
  const [isEditing, setIsEditing] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState(scene.visualPrompt)

  // Sync draft when parent updates (e.g. after re-analyze)
  useEffect(() => {
    if (!isEditing) setDraftPrompt(scene.visualPrompt)
  }, [scene.visualPrompt, isEditing])

  const durationSeconds = Math.round(scene.durationFrames / LIMITS.FPS)

  const handleDurationChange = (delta: number) => {
    const next = Math.min(
      LIMITS.SCENE_MAX_DURATION_SECONDS,
      Math.max(LIMITS.SCENE_MIN_DURATION_SECONDS, durationSeconds + delta)
    )
    updateSceneDuration(scene.id, next * LIMITS.FPS)
  }

  const handleSavePrompt = () => {
    if (draftPrompt.trim()) {
      updateSceneVisualPrompt(scene.id, draftPrompt.trim())
    } else {
      setDraftPrompt(scene.visualPrompt)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDraftPrompt(scene.visualPrompt)
      setIsEditing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-white/60">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-white">{scene.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => handleDurationChange(-1)}
            disabled={durationSeconds <= LIMITS.SCENE_MIN_DURATION_SECONDS}
            className="flex h-5 w-5 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/10 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-20"
            aria-label="영상 길이 줄이기"
          >
            −
          </button>
          <span className="w-8 text-center text-xs text-white/50">{durationSeconds}s</span>
          <button
            onClick={() => handleDurationChange(1)}
            disabled={durationSeconds >= LIMITS.SCENE_MAX_DURATION_SECONDS}
            className="flex h-5 w-5 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/10 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-20"
            aria-label="영상 길이 늘리기"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-lg border border-white/20 bg-white/5 p-3 text-xs text-white/80 outline-none focus:border-white/40"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSavePrompt}
                className="rounded-md bg-white px-3 py-1 text-xs font-medium text-black"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setDraftPrompt(scene.visualPrompt)
                  setIsEditing(false)
                }}
                className="rounded-md border border-white/20 px-3 py-1 text-xs text-white/60"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-left text-xs text-white/50 transition-all hover:border-white/20 hover:text-white/70"
          >
            {scene.visualPrompt}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/30">생성 방식</span>
        <GenerationModeSelector
          value={scene.generationMode}
          onChange={(mode) => updateSceneMode(scene.id, mode)}
        />
      </div>
    </div>
  )
}
