'use client'
import { useAuthStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface AdminApiHook {
  token: string | null
  isAdmin: boolean
  apiCall: (url: string, options?: RequestInit) => Promise<Response>
  loading: boolean
}

export function useAdminApi(): AdminApiHook {
  const { data: session } = useSession()
  const storeUser = useAuthStore(s => s.user)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar se é admin
  const nextAuthEmail = session?.user?.email || null
  const isNextAuthAdmin = nextAuthEmail === 'davikalebe20020602@gmail.com'
  const isStoreAdmin = !!(storeUser && (storeUser.role === 'admin' || storeUser.email === 'admin' || storeUser.email === 'davikalebe20020602@gmail.com'))
  const isAdmin = isNextAuthAdmin || isStoreAdmin

  // Obter token quando for admin
  useEffect(() => {
    if (isAdmin && !token) {
      // Se tem usuário do store (login normal), gerar token
      if (storeUser) {
        generateToken(storeUser.email, storeUser.password || '')
      } else if (session?.user?.email) {
        // Se só tem sessão do NextAuth, usar email dele
        generateToken(session.user.email, '')
      }
    }
    setLoading(false)
  }, [isAdmin, storeUser, session, token])

  const generateToken = async (email: string, password: string) => {
    try {
      // Se não tem password, tentar buscar o usuário admin conhecido
      if (!password && email === 'davikalebe20020602@gmail.com') {
        // Usar credenciais do admin conhecido
        email = 'admin'
        password = 'atacadaoguanabaraadmin123secreto'
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token && data.data?.role === 'admin') {
          setToken(data.token)
        }
      }
    } catch (error) {
      console.error('Erro ao gerar token:', error)
    }
  }

  const apiCall = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Headers padrão
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Adicionar token se disponível e for admin
    if (isAdmin && token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Fazer a requisição
    return fetch(url, {
      ...options,
      headers
    })
  }

  return {
    token,
    isAdmin,
    apiCall,
    loading
  }
}
