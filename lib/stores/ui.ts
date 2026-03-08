import { create } from 'zustand'
import type { ToastType } from '@/components/ui/Toast'

interface ToastData {
  message: string
  type: ToastType
  isVisible: boolean
}

interface UIState {
  toast: ToastData
  showToast: (message: string, type?: ToastType) => void
  hideToast: () => void
}

export const useUIStore = create<UIState>((set) => ({
  toast: { message: '', type: 'info', isVisible: false },
  showToast: (message, type = 'info') =>
    set({ toast: { message, type, isVisible: true } }),
  hideToast: () =>
    set((state) => ({ toast: { ...state.toast, isVisible: false } })),
}))
