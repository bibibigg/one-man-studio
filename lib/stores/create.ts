import { create } from 'zustand'

import type { GenerationMode } from '@/types/scene'

export interface AnalyzedScene {
  id: string
  orderIndex: number
  description: string
  visualPrompt: string
  generationMode: GenerationMode
  durationFrames: number
}

interface CreateState {
  // Step 1 & 2: Category + Scenario
  currentStep: number
  categoryId: string | null
  subCategoryId: string | null
  scenario: string
  customPrompt: string

  // Step 3: Analysis result
  projectId: string | null
  analyzedScenes: AnalyzedScene[]

  // Actions
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setCategory: (categoryId: string, subCategoryId?: string) => void
  setScenario: (text: string) => void
  setCustomPrompt: (text: string) => void
  setAnalysisResult: (projectId: string, scenes: AnalyzedScene[]) => void
  updateSceneVisualPrompt: (sceneId: string, visualPrompt: string) => void
  updateSceneMode: (sceneId: string, mode: GenerationMode) => void
  updateSceneDuration: (sceneId: string, durationFrames: number) => void
  reset: () => void
}

const INITIAL_STATE = {
  currentStep: 0,
  categoryId: null,
  subCategoryId: null,
  scenario: '',
  customPrompt: '',
  projectId: null,
  analyzedScenes: [],
}

export const useCreateStore = create<CreateState>((set) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

  setCategory: (categoryId, subCategoryId) =>
    set({ categoryId, subCategoryId: subCategoryId ?? null }),

  setScenario: (text) => set({ scenario: text }),
  setCustomPrompt: (text) => set({ customPrompt: text }),

  setAnalysisResult: (projectId, scenes) => set({ projectId, analyzedScenes: scenes }),

  updateSceneVisualPrompt: (sceneId, visualPrompt) =>
    set((state) => ({
      analyzedScenes: state.analyzedScenes.map((s) =>
        s.id === sceneId ? { ...s, visualPrompt } : s
      ),
    })),

  updateSceneMode: (sceneId, mode) =>
    set((state) => ({
      analyzedScenes: state.analyzedScenes.map((s) =>
        s.id === sceneId ? { ...s, generationMode: mode } : s
      ),
    })),

  updateSceneDuration: (sceneId, durationFrames) =>
    set((state) => ({
      analyzedScenes: state.analyzedScenes.map((s) =>
        s.id === sceneId ? { ...s, durationFrames } : s
      ),
    })),

  reset: () => set(INITIAL_STATE),
}))
