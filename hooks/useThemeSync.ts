'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

export function useThemeSync() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Carregar preferências salvas
    const loadThemePreference = () => {
      try {
        const storedPrefs = localStorage.getItem('user-preferences')
        if (storedPrefs) {
          const prefs = JSON.parse(storedPrefs)
          if (prefs.theme && prefs.theme !== theme) {
            setTheme(prefs.theme)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de tema:', error)
      }
    }

    // Aguardar um tick para garantir que o localStorage está disponível
    const timeoutId = setTimeout(loadThemePreference, 100)
    
    return () => clearTimeout(timeoutId)
  }, [setTheme, theme])

  useEffect(() => {
    // Aplicar o tema ao documento
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])
}
