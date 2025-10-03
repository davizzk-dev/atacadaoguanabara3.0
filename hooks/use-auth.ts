'use client'

import { useEffect } from 'react'
import { useSessionWrapper } from '@/hooks/use-session-wrapper'
import { useAuthStore } from '@/lib/store'

export function useAuth() {
  const { data: session, status } = useSessionWrapper()

  const { user, setUser, logout: storeLogout } = useAuthStore()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Para usuários Google, buscar dados completos do servidor
      fetchCompleteUserData(session.user.email, setUser, session.user)
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

// Função para buscar dados completos do usuário Google
async function fetchCompleteUserData(email: string, setUser: any, sessionUser: any) {
  try {
    const response = await fetch('/api/users/by-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    })

    if (response.ok) {
      const userData = await response.json()
      
      // Se encontrou dados completos no servidor, usar esses dados
      if (userData && userData.id) {
        console.log('✅ Dados completos carregados para usuário Google:', userData.name)
        setUser({
          id: userData.id,
          name: userData.name || sessionUser.name || '',
          email: userData.email || sessionUser.email || '',
          phone: userData.phone || '',
          role: (userData.role || sessionUser.role || 'user') as 'user' | 'admin',
          address: userData.address || undefined,
          provider: userData.provider || 'google',
        })
        return
      }
    }

    // Fallback: usar dados básicos da sessão se não encontrar no servidor
    console.log('⚠️ Usando dados básicos da sessão para:', sessionUser.email)
    setUser({
      id: sessionUser.id,
      name: sessionUser.name || '',
      email: sessionUser.email || '',
      phone: '',
      role: (sessionUser.role || 'user') as 'user' | 'admin',
      address: undefined,
    })
  } catch (error) {
    console.error('Erro ao buscar dados completos do usuário:', error)
    
    // Em caso de erro, usar dados da sessão
    setUser({
      id: sessionUser.id,
      name: sessionUser.name || '',
      email: sessionUser.email || '',
      phone: '',
      role: (sessionUser.role || 'user') as 'user' | 'admin',
      address: undefined,
    })
  }
} 