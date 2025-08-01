'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/lib/store'

export function useAuth() {
  let session: any = null
  let status: any = 'unauthenticated'
  
  try {
    const sessionData = useSession()
    session = sessionData?.data || null
    status = sessionData?.status || 'unauthenticated'
  } catch (error) {
    // Fallback para build estático
    session = null
    status = 'unauthenticated'
  }

  const { user, setUser, logout: storeLogout } = useAuthStore()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Converter dados do NextAuth para o formato do store
      const userData = {
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '', // O Google não fornece telefone
        role: session.user.role as 'user' | 'admin',
        address: undefined, // O Google não fornece endereço
      }
      setUser(userData)
    } else if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status, setUser])

  const logout = () => {
    storeLogout()
  }

  return {
    user,
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    logout,
  }
} 