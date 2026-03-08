import type { TransitionType, MotionEffect } from '@/types/scene'

export interface CompositionScene {
  id: string
  videoUrl: string | null
  imageUrl: string | null
  durationFrames: number
  transitionType: TransitionType
  transitionDurationFrames: number
  motionEffect: MotionEffect
}
