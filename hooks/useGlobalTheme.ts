'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

export function useGlobalTheme() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (theme && typeof window !== 'undefined') {
      const root = document.documentElement
      const body = document.body
      
      // Limpar classes existentes
      root.classList.remove('light', 'dark')
      body.classList.remove('light', 'dark')
      
      // Adicionar nova classe
      root.classList.add(theme)
      body.classList.add(theme)
      root.style.colorScheme = theme
      
      // Força refresh da página para aplicar os novos estilos
      if (theme === 'dark') {
        document.body.style.background = '#0f172a'
        document.body.style.color = '#f1f5f9'
      } else {
        document.body.style.background = ''
        document.body.style.color = ''
      }
    }
  }, [theme])

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Aplicação imediata
    setTimeout(() => {
      const root = document.documentElement
      const body = document.body
      
      root.classList.remove('light', 'dark')
      body.classList.remove('light', 'dark')
      root.classList.add(newTheme)
      body.classList.add(newTheme)
      root.style.colorScheme = newTheme
      
      window.location.reload()
    }, 100)
  }

  return {
    theme,
    setTheme: changeTheme
  }
}
