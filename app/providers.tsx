'use client'

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { ForceLightTheme } from './force-light'
import { SessionSync } from "@/components/session-sync"
 
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
        <SessionSync />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
} 