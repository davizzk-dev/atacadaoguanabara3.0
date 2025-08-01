'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSessionWrapper } from '@/hooks/use-session-wrapper'

interface AuthContextType {
  user: any
  status: 'loading' | 'authenticated' | 'unauthenticated'
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  status: 'unauthenticated',
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSessionWrapper()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser(session.user)
    } else if (status === 'unauthenticated') {
      setUser(null)
    }
    
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [session, status])

  return (
    <AuthContext.Provider value={{ user, status, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
} 