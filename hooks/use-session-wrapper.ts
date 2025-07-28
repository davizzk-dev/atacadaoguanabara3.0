'use client'

import { useSession } from 'next-auth/react'

export function useSessionWrapper() {
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