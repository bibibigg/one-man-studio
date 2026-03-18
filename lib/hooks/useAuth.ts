'use client'

import { useAuthContext } from '@/components/providers/AuthProvider'

export function useAuth() {
  const { user, isLoading } = useAuthContext()

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  }
}
