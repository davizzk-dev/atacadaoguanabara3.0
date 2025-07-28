'use client'

import { useSession } from 'next-auth/react'

export function useSessionWrapper() {
  // Verificar se estamos no servidor ou se NextAuth não está configurado
  if (typeof window === 'undefined' || !process.env.NEXTAUTH_URL) {
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: () => Promise.resolve(null),
    }
  }

  try {
    const session = useSession()
    return {
      data: session.data || null,
      status: session.status || 'unauthenticated',
      update: session.update || (() => Promise.resolve(null)),
    }
  } catch (error) {
    console.warn('Erro ao usar useSession:', error)
    // Fallback para build estático
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: () => Promise.resolve(null),
    }
  }
} 