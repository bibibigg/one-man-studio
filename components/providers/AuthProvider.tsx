'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/auth/client'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    // onAuthStateChange가 구독 직후 INITIAL_SESSION을 발화하므로 별도 getUser() 불필요
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  return useContext(AuthContext)
}
