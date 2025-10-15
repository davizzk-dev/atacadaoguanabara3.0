"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/lib/store'

export function SessionSync() {
  const { data: session, status } = useSession()
  const { setUser, refreshUserData } = useAuthStore()

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Para usuários Google, buscar dados completos do servidor
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/users/by-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: session.user.email })
          })

          if (response.ok) {
            const userData = await response.json()
            if (userData && userData.id) {
              console.log('✅ Dados completos carregados via SessionSync:', userData.name)
              setUser({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                role: userData.role || 'user',
                address: userData.address,
                provider: userData.provider,
              })
              return
            }
          }

          // Fallback para dados básicos da sessão
          setUser({
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
            phone: '',
            role: (session.user.role as 'user' | 'atendente' | 'gerente' | 'admin' | 'programador') || 'user',
          })
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error)
          setUser({
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
            phone: '',
            role: (session.user.role as 'user' | 'atendente' | 'gerente' | 'admin' | 'programador') || 'user',
          })
        }
      }

      fetchUserData()
    }
    
    if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status, setUser, refreshUserData])

  return null
}
