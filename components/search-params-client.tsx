'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

interface SearchParamsClientProps {
  onSearchParams: (search: string | null, type: string | null) => void
}

export function SearchParamsClient({ onSearchParams }: SearchParamsClientProps) {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const searchFromUrl = searchParams?.get('search') || null
    const typeFromUrl = searchParams?.get('type') || null
    onSearchParams(searchFromUrl, typeFromUrl)
  }, [searchParams, onSearchParams])
  
  return null
}
