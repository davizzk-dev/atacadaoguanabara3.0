'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function ForceLogoutPage() {
  useEffect(() => {
    const forceCompleteLogout = async () => {
      console.log('🧹 Forçando logout completo...')
      
      // 1. Limpar TUDO do localStorage
      localStorage.clear()
      sessionStorage.clear()
      
      // 2. Limpar todos os cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // 3. Fazer logout do NextAuth
      await signOut({ 
        callbackUrl: '/',
        redirect: false 
      })
      
      // 4. Recarregar página após 1 segundo
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    }
    
    forceCompleteLogout()
  }, [])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Fazendo logout completo...</h1>
        <p className="text-gray-600">Limpando todos os dados e redirecionando...</p>
      </div>
    </div>
  )
}
