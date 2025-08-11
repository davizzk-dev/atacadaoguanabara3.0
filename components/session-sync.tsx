"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/lib/store'

export function SessionSync() {
  const { data: session, status } = useSession()
  const { setUser } = useAuthStore()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        role: (session.user.role as 'user' | 'admin') || 'user',
      })
    }
    if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [session, status, setUser])

  return null
}
