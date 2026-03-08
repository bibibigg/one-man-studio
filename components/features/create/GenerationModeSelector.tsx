'use client'

import type { GenerationMode } from '@/types/scene'

const MODES: { value: GenerationMode; label: string; description: string }[] = [
  { value: 'text_to_video', label: 'T→V', description: '프롬프트로 영상 생성' },
  { value: 'image_to_video', label: 'I→V', description: 'AI 이미지 생성 후 영상' },
  { value: 'image_text_to_video', label: 'I+T→V', description: '참조 이미지 + 프롬프트' },
]

interface GenerationModeSelectorProps {
  value: GenerationMode
  onChange: (mode: GenerationMode) => void
}

export function GenerationModeSelector({ value, onChange }: GenerationModeSelectorProps) {
  return (
    <div className="flex gap-2">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          title={mode.description}
          className={`
            rounded-lg border px-3 py-1.5 text-xs font-medium transition-all
            ${
              value === mode.value
                ? 'border-white bg-white text-black'
                : 'border-white/20 text-white/50 hover:border-white/40 hover:text-white/80'
            }
          `}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
