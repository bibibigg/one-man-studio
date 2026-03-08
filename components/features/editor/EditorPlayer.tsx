'use client'

import { useRef, useEffect, type ComponentType } from 'react'
import dynamic from 'next/dynamic'
import type { PlayerRef } from '@remotion/player'
import { useEditorStore } from '@/lib/stores/editor'
import { VideoComposition } from '@/remotion/VideoComposition'
import { VIDEO_CONFIG } from '@/lib/utils/constants'

// Player must be dynamically imported to prevent SSR issues
const Player = dynamic(() => import('@remotion/player').then((m) => m.Player), { ssr: false })

// Double-cast required: VideoCompositionProps is not assignable to Record<string, unknown>
// because TypeScript's function parameter contravariance rejects direct casting.
// `unknown` intermediate makes the intent explicit.
const CompositionComponent = VideoComposition as unknown as ComponentType<Record<string, unknown>>

export function EditorPlayer() {
  const playerRef = useRef<PlayerRef>(null)

  // Subscribe to primitive state slices to avoid new-reference infinite loops
  const sceneOrder = useEditorStore((s) => s.sceneOrder)
  const scenesById = useEditorStore((s) => s.scenesById)
  const compositions = useEditorStore((s) => s.compositions)
  const currentSceneId = useEditorStore((s) => s.currentSceneId)

  const compositionScenes = sceneOrder.map((id) => {
    const scene = scenesById[id]
    const comp = compositions[id]
    return {
      id,
      videoUrl: scene?.videoUrl,
      imageUrl: scene?.generatedImageUrl ?? scene?.referenceImageUrl,
      durationFrames: comp?.durationFrames ?? 150,
      transitionType: comp?.transitionType ?? 'crossfade',
      transitionDurationFrames: comp?.transitionDurationFrames ?? 15,
      motionEffect: comp?.motionEffect ?? 'none',
    }
  })

  const totalFrames =
    sceneOrder.length === 0
      ? 30
      : sceneOrder.reduce((total, id, i) => {
          const comp = compositions[id]
          const isLast = i === sceneOrder.length - 1
          return total + (comp?.durationFrames ?? 150) - (isLast ? 0 : (comp?.transitionDurationFrames ?? 15))
        }, 0)

  // Seek to the start frame of the selected scene
  useEffect(() => {
    if (!currentSceneId || !playerRef.current) return

    let frame = 0
    for (const id of sceneOrder) {
      if (id === currentSceneId) break
      const comp = compositions[id]
      const transitionOut = Math.min(comp?.transitionDurationFrames ?? 15, (comp?.durationFrames ?? 150) - 1)
      frame += (comp?.durationFrames ?? 150) - transitionOut
    }

    playerRef.current.seekTo(frame)
  }, [currentSceneId, sceneOrder, compositions])

  return (
    <div className="w-full overflow-hidden rounded-xl bg-black">
      <Player
        ref={playerRef}
        component={CompositionComponent}
        inputProps={{ scenes: compositionScenes }}
        durationInFrames={Math.max(1, totalFrames)}
        compositionWidth={VIDEO_CONFIG.width}
        compositionHeight={VIDEO_CONFIG.height}
        fps={VIDEO_CONFIG.fps}
        style={{ width: '100%', aspectRatio: '16/9' }}
        controls
        loop
      />
    </div>
  )
}
