'use client'

import { useEffect, useRef, useState } from 'react'

import { useUIStore } from '@/lib/stores/ui'
import { LIMITS } from '@/lib/utils/constants'
import type { SceneGenState, SceneGenStatus } from '@/lib/stores/generation'
import type { GenerationMode, SceneUpdate } from '@/types/scene'

const MODE_LABEL: Record<GenerationMode, string> = {
  text_to_video: 'T→V',
  image_to_video: 'I→V',
  image_text_to_video: 'I+T→V',
}

const MODE_DESC: Record<GenerationMode, string> = {
  text_to_video: '프롬프트만으로 영상 생성',
  image_to_video: 'AI 이미지 → 영상 변환',
  image_text_to_video: '참조 이미지 + 프롬프트',
}

const STATUS_LABEL: Record<SceneGenStatus, string> = {
  idle: '대기 중',
  uploading: '이미지 업로드 중...',
  generating_image: 'AI 이미지 생성 중...',
  generating_video: 'AI 영상 생성 중...',
  completed: '완료',
  failed: '실패',
}

const ALL_MODES: GenerationMode[] = ['text_to_video', 'image_to_video', 'image_text_to_video']

interface SceneGenerationCardProps {
  sceneId: string
  index: number
  description: string
  mode: GenerationMode
  visualPrompt: string
  durationFrames: number
  referenceImageUrl: string | null
  genState: SceneGenState
  onUpload: (sceneId: string, file: File) => void
  onRetry: (sceneId: string) => void
  onUpdate: (sceneId: string, data: SceneUpdate) => Promise<void>
  isGenerating: boolean
}

export function SceneGenerationCard({
  sceneId,
  index,
  description,
  mode,
  visualPrompt,
  durationFrames,
  referenceImageUrl,
  genState,
  onUpload,
  onRetry,
  onUpdate,
  isGenerating,
}: SceneGenerationCardProps) {
  const { showToast } = useUIStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [localPrompt, setLocalPrompt] = useState(visualPrompt)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setLocalPrompt(visualPrompt)
  }, [visualPrompt])

  const hasReferenceImage = !!(referenceImageUrl || genState.imageUrl)
  const needsUpload = mode === 'image_text_to_video' && !hasReferenceImage

  const isActive =
    genState.status === 'uploading' ||
    genState.status === 'generating_image' ||
    genState.status === 'generating_video'

  const isIdle = genState.status === 'idle' && !isGenerating
  const durationSeconds = Math.round(durationFrames / LIMITS.FPS)

  const statusColor =
    genState.status === 'completed'
      ? 'text-green-400'
      : genState.status === 'failed'
        ? 'text-red-400'
        : isActive
          ? 'text-white/70'
          : 'text-white/30'

  const handleModeChange = async (newMode: GenerationMode) => {
    if (!isIdle || newMode === mode) return
    setIsSaving(true)
    try {
      await onUpdate(sceneId, { generationMode: newMode })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '모드 변경에 실패했습니다', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDurationChange = async (delta: number) => {
    if (!isIdle) return
    const next = Math.max(
      LIMITS.SCENE_MIN_DURATION_SECONDS,
      Math.min(LIMITS.SCENE_MAX_DURATION_SECONDS, durationSeconds + delta)
    )
    if (next === durationSeconds) return
    setIsSaving(true)
    try {
      await onUpdate(sceneId, { durationSeconds: next })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '시간 변경에 실패했습니다', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePromptBlur = async () => {
    if (!isIdle || isSaving) return
    const trimmed = localPrompt.trim()
    if (trimmed === '') {
      setLocalPrompt(visualPrompt)
      return
    }
    if (trimmed === visualPrompt) return
    setIsSaving(true)
    try {
      await onUpdate(sceneId, { visualPrompt: trimmed })
    } catch (err) {
      showToast(err instanceof Error ? err.message : '프롬프트 저장에 실패했습니다', 'error')
      setLocalPrompt(visualPrompt)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        genState.status === 'completed'
          ? 'border-green-400/20 bg-green-400/5'
          : genState.status === 'failed'
            ? 'border-red-400/20 bg-red-400/5'
            : isActive
              ? 'border-white/20 bg-white/5'
              : 'border-white/10 bg-white/5'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-white/60">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-white">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isSaving && <span className="text-xs text-white/30">저장 중...</span>}
          <span className="rounded-md border border-white/20 px-2 py-0.5 text-xs text-white/40">
            {MODE_LABEL[mode]}
          </span>
          {isIdle && (
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="rounded-md border border-white/20 px-2 py-0.5 text-xs text-white/40 transition-all hover:border-white/40 hover:text-white/70"
            >
              {isExpanded ? '접기' : '설정'}
            </button>
          )}
        </div>
      </div>

      {/* Edit panel — only when idle */}
      {isIdle && isExpanded && (
        <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-4">
          {/* Generation mode */}
          <div>
            <p className="mb-2 text-xs text-white/40">생성 모드</p>
            <div className="flex gap-2">
              {ALL_MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  disabled={isSaving}
                  title={MODE_DESC[m]}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-all disabled:opacity-50 ${
                    mode === m
                      ? 'border-white/60 bg-white/10 text-white'
                      : 'border-white/15 text-white/40 hover:border-white/30 hover:text-white/60'
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-white/25">{MODE_DESC[mode]}</p>
          </div>

          {/* Duration */}
          <div>
            <p className="mb-2 text-xs text-white/40">영상 길이</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDurationChange(-1)}
                disabled={isSaving || durationSeconds <= LIMITS.SCENE_MIN_DURATION_SECONDS}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 text-sm text-white/60 transition-all hover:border-white/40 hover:text-white disabled:opacity-30"
              >
                −
              </button>
              <span className="w-16 text-center text-sm font-medium text-white">
                {durationSeconds}초
              </span>
              <button
                onClick={() => handleDurationChange(1)}
                disabled={isSaving || durationSeconds >= LIMITS.SCENE_MAX_DURATION_SECONDS}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 text-sm text-white/60 transition-all hover:border-white/40 hover:text-white disabled:opacity-30"
              >
                +
              </button>
              <span className="text-xs text-white/25">
                ({LIMITS.SCENE_MIN_DURATION_SECONDS}~{LIMITS.SCENE_MAX_DURATION_SECONDS}초)
              </span>
            </div>
          </div>

          {/* Visual prompt */}
          <div>
            <p className="mb-2 text-xs text-white/40">비주얼 프롬프트</p>
            <textarea
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              onBlur={handlePromptBlur}
              disabled={isSaving}
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80 placeholder-white/20 outline-none transition-all focus:border-white/30 disabled:opacity-50 resize-none"
              placeholder="AI 영상 생성에 사용할 시각적 묘사를 입력하세요"
            />
            <p className="mt-1 text-xs text-white/20">
              포커스 해제 시 자동 저장 · {localPrompt.length}/2000
            </p>
          </div>
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between px-5 pb-3">
        <span className={`text-xs ${statusColor}`}>{STATUS_LABEL[genState.status]}</span>
        {genState.status === 'failed' && !isGenerating && (
          <button
            onClick={() => onRetry(sceneId)}
            className="rounded-md border border-white/20 px-2 py-0.5 text-xs text-white/60 transition-all hover:border-white/40 hover:text-white"
          >
            재시도
          </button>
        )}
      </div>

      {/* Active progress bar */}
      {isActive && (
        <div className="mx-5 mb-4 h-0.5 w-auto overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-pulse rounded-full bg-white/50" />
        </div>
      )}

      {/* Error message */}
      {genState.status === 'failed' && genState.error && (
        <p className="px-5 pb-4 text-xs text-red-400/70">{genState.error}</p>
      )}

      {/* Reference image upload (image_text_to_video mode) */}
      {needsUpload && !isGenerating && (
        <div className="px-5 pb-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(sceneId, file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-white/20 py-2.5 text-xs text-white/40 transition-all hover:border-white/40 hover:text-white/60"
          >
            참조 이미지 업로드 (필수)
          </button>
        </div>
      )}

      {/* Reference image ready indicator */}
      {mode === 'image_text_to_video' && hasReferenceImage && (
        <p className="px-5 pb-4 text-xs text-white/30">참조 이미지 준비됨</p>
      )}
    </div>
  )
}
