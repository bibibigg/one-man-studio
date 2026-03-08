'use client'

import { useRef } from 'react'

import type { SceneGenState, SceneGenStatus } from '@/lib/stores/generation'
import type { GenerationMode } from '@/types/scene'

const MODE_LABEL: Record<GenerationMode, string> = {
  text_to_video: 'T→V',
  image_to_video: 'I→V',
  image_text_to_video: 'I+T→V',
}

const STATUS_LABEL: Record<SceneGenStatus, string> = {
  idle: '대기 중',
  uploading: '이미지 업로드 중...',
  generating_image: 'AI 이미지 생성 중...',
  generating_video: 'AI 영상 생성 중...',
  completed: '완료',
  failed: '실패',
}

interface SceneGenerationCardProps {
  sceneId: string
  index: number
  description: string
  mode: GenerationMode
  referenceImageUrl: string | null
  genState: SceneGenState
  onUpload: (sceneId: string, file: File) => void
  onRetry: (sceneId: string) => void
  isGenerating: boolean
}

export function SceneGenerationCard({
  sceneId,
  index,
  description,
  mode,
  referenceImageUrl,
  genState,
  onUpload,
  onRetry,
  isGenerating,
}: SceneGenerationCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasReferenceImage = !!(referenceImageUrl || genState.imageUrl)
  const needsUpload = mode === 'image_text_to_video' && !hasReferenceImage

  const isActive =
    genState.status === 'uploading' ||
    genState.status === 'generating_image' ||
    genState.status === 'generating_video'

  const statusColor =
    genState.status === 'completed'
      ? 'text-green-400'
      : genState.status === 'failed'
        ? 'text-red-400'
        : isActive
          ? 'text-white/70'
          : 'text-white/30'

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
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
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-white/60">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-white">{description}</p>
        </div>
        <span className="shrink-0 rounded-md border border-white/20 px-2 py-0.5 text-xs text-white/40">
          {MODE_LABEL[mode]}
        </span>
      </div>

      {/* Status row */}
      <div className="mb-2 flex items-center justify-between">
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
        <div className="mb-3 h-0.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full animate-pulse rounded-full bg-white/50" />
        </div>
      )}

      {/* Error message */}
      {genState.status === 'failed' && genState.error && (
        <p className="mt-1 text-xs text-red-400/70">{genState.error}</p>
      )}

      {/* Reference image upload (image_text_to_video mode, upload not done yet) */}
      {needsUpload && !isGenerating && (
        <div className="mt-3">
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
        <p className="mt-1 text-xs text-white/30">참조 이미지 준비됨</p>
      )}
    </div>
  )
}
