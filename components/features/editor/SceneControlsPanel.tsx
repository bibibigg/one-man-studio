'use client'

import { useEditorStore } from '@/lib/stores/editor'
import { TRANSITION_TYPES, MOTION_EFFECTS, VIDEO_CONFIG, LIMITS } from '@/lib/utils/constants'
import type { TransitionType, MotionEffect } from '@/types/scene'

const TRANSITION_OPTIONS: { value: TransitionType; label: string }[] = [
  { value: 'crossfade', label: '크로스페이드' },
  { value: 'fade-black', label: '암전' },
  { value: 'slide-left', label: '슬라이드 왼쪽' },
  { value: 'slide-right', label: '슬라이드 오른쪽' },
  { value: 'none', label: '없음' },
]

const MOTION_OPTIONS: { value: MotionEffect; label: string }[] = [
  { value: 'none', label: '없음' },
  { value: 'ken-burns', label: '켄번즈' },
  { value: 'zoom-in', label: '줌인' },
  { value: 'zoom-out', label: '줌아웃' },
  { value: 'pan-left', label: '패닝 왼쪽' },
  { value: 'pan-right', label: '패닝 오른쪽' },
]

const FPS = VIDEO_CONFIG.fps
const MIN_FRAMES = LIMITS.SCENE_MIN_DURATION_SECONDS * FPS
const MAX_FRAMES = LIMITS.SCENE_MAX_DURATION_SECONDS * FPS

export function SceneControlsPanel() {
  const { currentSceneId, scenesById, compositions, updateComposition } = useEditorStore()

  if (!currentSceneId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-white/30">타임라인에서 장면을 선택하세요</p>
      </div>
    )
  }

  const scene = scenesById[currentSceneId]
  const comp = compositions[currentSceneId]

  if (!scene || !comp) return null

  const durationSeconds = (comp.durationFrames / FPS).toFixed(1)

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      {/* Scene info */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">현재 장면</p>
        <p className="mt-1 text-sm text-white/80">{scene.description}</p>
      </div>

      {/* Duration */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-white/60">재생 시간</label>
          <span className="text-xs text-white/40">{durationSeconds}초</span>
        </div>
        <input
          type="range"
          min={MIN_FRAMES}
          max={MAX_FRAMES}
          step={15}
          value={comp.durationFrames}
          onChange={(e) =>
            updateComposition(currentSceneId, { durationFrames: Number(e.target.value) })
          }
          className="w-full accent-white"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/30">
          <span>{LIMITS.SCENE_MIN_DURATION_SECONDS}초</span>
          <span>{LIMITS.SCENE_MAX_DURATION_SECONDS}초</span>
        </div>
      </div>

      {/* Transition */}
      <div>
        <label className="mb-2 block text-xs font-medium text-white/60">다음 장면 전환</label>
        <select
          value={comp.transitionType}
          onChange={(e) => {
            const value = e.target.value
            if ((TRANSITION_TYPES as readonly string[]).includes(value)) {
              updateComposition(currentSceneId, { transitionType: value as TransitionType })
            }
          }}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
        >
          {TRANSITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Motion effect (image scenes only) */}
      {!scene.videoUrl && (
        <div>
          <label className="mb-2 block text-xs font-medium text-white/60">모션 효과</label>
          <select
            value={comp.motionEffect}
            onChange={(e) => {
              const value = e.target.value
              if ((MOTION_EFFECTS as readonly string[]).includes(value)) {
                updateComposition(currentSceneId, { motionEffect: value as MotionEffect })
              }
            }}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none"
          >
            {MOTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-zinc-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Transition duration */}
      {comp.transitionType !== 'none' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-white/60">전환 길이</label>
            <span className="text-xs text-white/40">
              {(comp.transitionDurationFrames / FPS).toFixed(1)}초
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={comp.transitionDurationFrames}
            onChange={(e) =>
              updateComposition(currentSceneId, {
                transitionDurationFrames: Number(e.target.value),
              })
            }
            className="w-full accent-white"
          />
        </div>
      )}
    </div>
  )
}
