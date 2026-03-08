import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

import type { CompositionScene } from './types'

interface SceneLayerProps {
  scene: CompositionScene
  fadeInFrames: number
  fadeOutFrames: number
}

export function SceneLayer({ scene, fadeInFrames, fadeOutFrames }: SceneLayerProps) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  // Opacity for crossfade transitions
  const opacity =
    scene.transitionType === 'crossfade' || scene.transitionType === 'fade-black'
      ? interpolate(
          frame,
          [0, Math.max(1, fadeInFrames), durationInFrames - Math.max(1, fadeOutFrames), durationInFrames],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
      : 1

  // Slide transitions — horizontal offset
  const slideOffset = (() => {
    if (scene.transitionType === 'slide-left') {
      return interpolate(frame, [0, Math.max(1, fadeInFrames)], [100, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    }
    if (scene.transitionType === 'slide-right') {
      return interpolate(frame, [0, Math.max(1, fadeInFrames)], [-100, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    }
    return 0
  })()

  // Motion effect transform for image scenes
  const imageTransform = getMotionTransform(scene.motionEffect, frame, durationInFrames)

  const containerStyle: React.CSSProperties = {
    opacity,
    transform: slideOffset !== 0 ? `translateX(${slideOffset}%)` : undefined,
    overflow: 'hidden',
  }

  return (
    <AbsoluteFill style={containerStyle}>
      {scene.videoUrl ? (
        <OffthreadVideo
          src={scene.videoUrl}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : scene.imageUrl ? (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={scene.imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: imageTransform,
              transformOrigin: 'center center',
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ backgroundColor: '#111' }} />
      )}
    </AbsoluteFill>
  )
}

function getMotionTransform(
  effect: CompositionScene['motionEffect'],
  frame: number,
  total: number
): string {
  const progress = total > 1 ? frame / (total - 1) : 0

  switch (effect) {
    case 'zoom-in': {
      const scale = interpolate(progress, [0, 1], [1, 1.2])
      return `scale(${scale})`
    }
    case 'zoom-out': {
      const scale = interpolate(progress, [0, 1], [1.2, 1])
      return `scale(${scale})`
    }
    case 'pan-left': {
      const tx = interpolate(progress, [0, 1], [0, -8])
      return `scale(1.1) translateX(${tx}%)`
    }
    case 'pan-right': {
      const tx = interpolate(progress, [0, 1], [0, 8])
      return `scale(1.1) translateX(${tx}%)`
    }
    case 'ken-burns': {
      const scale = interpolate(progress, [0, 1], [1, 1.15])
      const tx = interpolate(progress, [0, 1], [-3, 3])
      const ty = interpolate(progress, [0, 1], [-2, 2])
      return `scale(${scale}) translate(${tx}%, ${ty}%)`
    }
    default:
      return 'none'
  }
}
