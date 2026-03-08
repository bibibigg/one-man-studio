export const LIMITS = {
  MAX_SCENARIO_LENGTH: 5000,
  MIN_SCENARIO_LENGTH: 100,
  MAX_SCENES_PER_PROJECT: 3,
  MAX_PROJECTS_PER_DAY: 3,
  MAX_TOTAL_PROJECTS: 20,
  MAX_REFERENCE_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  SCENE_MIN_DURATION_SECONDS: 3,
  SCENE_MAX_DURATION_SECONDS: 10,
  SCENE_DEFAULT_DURATION_SECONDS: 5,
  FPS: 30,
  CONCURRENT_GENERATION_LIMIT: 2,
} as const

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const TRANSITION_TYPES = [
  'crossfade',
  'fade-black',
  'slide-left',
  'slide-right',
  'none',
] as const

export const MOTION_EFFECTS = [
  'ken-burns',
  'zoom-in',
  'zoom-out',
  'pan-left',
  'pan-right',
  'none',
] as const

export const VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  fps: LIMITS.FPS,
  defaultDurationFrames: LIMITS.SCENE_DEFAULT_DURATION_SECONDS * LIMITS.FPS,
  defaultTransitionDurationFrames: 15,
} as const
