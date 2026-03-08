import { create } from 'zustand'

import type { TransitionType, MotionEffect } from '@/types/scene'
import type { CompositionScene } from '@/remotion/types'
import type { EditorScene } from '@/types/editor'

export interface SceneCompositionState {
  durationFrames: number
  transitionType: TransitionType
  transitionDurationFrames: number
  motionEffect: MotionEffect
}

const DEFAULT_COMPOSITION: SceneCompositionState = {
  durationFrames: 150,
  transitionType: 'crossfade',
  transitionDurationFrames: 15,
  motionEffect: 'none',
}

interface EditorStore {
  projectName: string
  /** Ordered scene IDs (user can reorder via timeline) */
  sceneOrder: string[]
  /** Scene composition settings keyed by scene ID */
  compositions: Record<string, SceneCompositionState>
  /** Full scene data from DB, keyed by ID */
  scenesById: Record<string, EditorScene>
  currentSceneId: string | null
  isSaving: boolean
  isExporting: boolean
  exportProgress: number

  initEditor: (
    projectName: string,
    scenes: EditorScene[],
    savedCompositions?: Record<string, Partial<SceneCompositionState>>
  ) => void
  reorderScenes: (oldIndex: number, newIndex: number) => void
  setCurrentScene: (id: string | null) => void
  updateComposition: (sceneId: string, updates: Partial<SceneCompositionState>) => void
  setIsSaving: (saving: boolean) => void
  setIsExporting: (exporting: boolean) => void
  setExportProgress: (progress: number) => void

  /** Derive ordered CompositionScene array for Remotion */
  getCompositionScenes: () => CompositionScene[]
  /** Total frames for Remotion Player durationInFrames */
  getTotalFrames: () => number
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  projectName: '',
  sceneOrder: [],
  compositions: {},
  scenesById: {},
  currentSceneId: null,
  isSaving: false,
  isExporting: false,
  exportProgress: 0,

  initEditor: (projectName, scenes, savedCompositions = {}) => {
    const sceneOrder = scenes.map((s) => s.id)
    const scenesById: Record<string, EditorScene> = {}
    const compositions: Record<string, SceneCompositionState> = {}

    for (const scene of scenes) {
      scenesById[scene.id] = scene
      compositions[scene.id] = {
        ...DEFAULT_COMPOSITION,
        durationFrames: scene.durationFrames,
        ...savedCompositions[scene.id],
      }
    }

    set({
      projectName,
      sceneOrder,
      scenesById,
      compositions,
      currentSceneId: scenes[0]?.id ?? null,
    })
  },

  reorderScenes: (oldIndex, newIndex) => {
    set((state) => {
      const next = [...state.sceneOrder]
      const [moved] = next.splice(oldIndex, 1)
      next.splice(newIndex, 0, moved)
      return { sceneOrder: next }
    })
  },

  setCurrentScene: (id) => set({ currentSceneId: id }),

  updateComposition: (sceneId, updates) => {
    set((state) => ({
      compositions: {
        ...state.compositions,
        [sceneId]: { ...state.compositions[sceneId], ...updates },
      },
    }))
  },

  setIsSaving: (saving) => set({ isSaving: saving }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),

  getCompositionScenes: () => {
    const { sceneOrder, scenesById, compositions } = get()
    return sceneOrder.map((id) => {
      const scene = scenesById[id]
      const comp = compositions[id]
      return {
        id,
        videoUrl: scene.videoUrl,
        // image_to_video: AI-generated image; image_text_to_video: user upload
        imageUrl: scene.generatedImageUrl ?? scene.referenceImageUrl,
        durationFrames: comp.durationFrames,
        transitionType: comp.transitionType,
        transitionDurationFrames: comp.transitionDurationFrames,
        motionEffect: comp.motionEffect,
      } satisfies CompositionScene
    })
  },

  getTotalFrames: () => {
    const { sceneOrder, compositions } = get()
    if (sceneOrder.length === 0) return 30
    return sceneOrder.reduce((total, id, i) => {
      const comp = compositions[id]
      const isLast = i === sceneOrder.length - 1
      const overlap =
        isLast || comp.transitionType === 'none' ? 0 : comp.transitionDurationFrames
      return total + comp.durationFrames - overlap
    }, 0)
  },
}))
