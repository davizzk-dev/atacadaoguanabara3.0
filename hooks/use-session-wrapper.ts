'use client'

import { useSession } from 'next-auth/react'

export function useSessionWrapper() {
  // Verificar se estamos no servidor ou se NextAuth não está configurado
  // Evitar uso no servidor
  if (typeof window === 'undefined') {
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: () => Promise.resolve(null),
    }
  }

  try {
    const session = useSession()

    if (!session) {
      return {
        data: null,
        status: 'unauthenticated' as const,
        update: () => Promise.resolve(null),
      }
    }

    return {
      data: session.data || null,
      status: session.status || 'unauthenticated',
      update: session.update || (() => Promise.resolve(null)),
    }
  } catch (error) {
    console.warn('Erro ao usar useSession:', error)
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: () => Promise.resolve(null),
    }
  }
}
