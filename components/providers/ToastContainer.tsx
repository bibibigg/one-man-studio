'use client'

import { Toast } from '@/components/ui/Toast'
import { useUIStore } from '@/lib/stores/ui'

export function ToastContainer() {
  const { toast, hideToast } = useUIStore()

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
  )
}
