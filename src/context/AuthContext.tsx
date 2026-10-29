import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, jsonRequest } from '../lib/api'
import type { User } from '../lib/types'

interface AuthValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await api<{ user: User | null }>('/api/auth/me')
      setUser(result.user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let active = true
    api<{ user: User | null }>('/api/auth/me')
      .then((result) => {
        if (active) setUser(result.user)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await api<{ user: User }>('/api/auth/login', jsonRequest('POST', { email, password }))
    setUser(result.user)
    return result.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refresh, setUser }),
    [user, loading, signIn, signOut, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
