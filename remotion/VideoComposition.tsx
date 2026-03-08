import { AbsoluteFill, Sequence } from 'remotion'

import { SceneLayer } from './SceneLayer'
import type { CompositionScene } from './types'

export interface VideoCompositionProps {
  scenes: CompositionScene[]
}

/** Calculate start frame for each scene, accounting for transition overlaps */
function positionScenes(
  scenes: CompositionScene[]
): Array<CompositionScene & { from: number; fadeInFrames: number; fadeOutFrames: number }> {
  let currentFrame = 0
  return scenes.map((scene, i) => {
    const from = currentFrame
    const isLast = i === scenes.length - 1
    // Clamp: transition must be shorter than the scene itself to prevent frame reversal
    const transitionOut =
      isLast || scene.transitionType === 'none'
        ? 0
        : Math.min(scene.transitionDurationFrames, Math.max(0, scene.durationFrames - 1))
    const transitionIn =
      i === 0 || scenes[i - 1].transitionType === 'none'
        ? 0
        : scenes[i - 1].transitionDurationFrames
    currentFrame += scene.durationFrames - transitionOut
    return { ...scene, from, fadeInFrames: transitionIn, fadeOutFrames: transitionOut }
  })
}

export function VideoComposition({ scenes }: VideoCompositionProps) {
  if (scenes.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: '#000' }} />
  }

  const positioned = positionScenes(scenes)

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {positioned.map((scene) => (
        <Sequence key={scene.id} from={scene.from} durationInFrames={scene.durationFrames}>
          <SceneLayer
            scene={scene}
            fadeInFrames={scene.fadeInFrames}
            fadeOutFrames={scene.fadeOutFrames}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
