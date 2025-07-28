'use client'

import { useSession } from 'next-auth/react'

export function useSessionWrapper() {
  // Verificar se estamos no servidor
  if (typeof window === 'undefined') {
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
    // Fallback para build estático
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: () => Promise.resolve(null),
    }
  }
} 