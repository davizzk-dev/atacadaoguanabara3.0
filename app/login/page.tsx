'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Shield } from 'lucide-react'
import { signIn, getSession } from 'next-auth/react'
import { useSessionWrapper } from '@/hooks/use-session-wrapper'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { useAuthStore } from '@/lib/store'

function LoginContent() {
  // Função para redirecionar após login Google OAuth
  const handleGoogleOAuthRedirect = () => {
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectUrl = isLocalhost
        ? 'http://localhost:3005/'
        : 'https://atacadaoguanabara.com/catalog';
      window.location.href = redirectUrl;
    }
  };
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const callback = searchParams.get('callbackUrl') || searchParams.get('callback') || '/'
  const { login } = useAuthStore()
  const [animateRegister, setAnimateRegister] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const { data: session, status } = useSessionWrapper()

  // Detectar se veio da página inicial (modo admin)
  useEffect(() => {
    const adminParam = searchParams.get('admin')
    if (adminParam === 'true') {
      setIsAdminMode(true)
    }
  }, [searchParams])

    // Não redirecionar automaticamente se já estiver logado.
    // Mantemos a página para permitir trocar de conta com o seletor do Google.
    useEffect(() => {
      if (status === 'authenticated' && session) {
        // A lógica de redirecionamento foi removida
      }
    }, [status, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Verificar credenciais de admin especiais
  if (isAdminMode && email === 'admin' && password === 'atacadaoguanabaraadmin123secreto') {
      // Login admin bem-sucedido
      const success = await login(email, password)
      if (success) {
  router.push(callback)
        return
      }
    }
    
    // Login normal
    const success = await login(email, password)
    
    if (success) {
      router.push(callback)
    } else {
      if (isAdminMode) {
        setError('Credenciais de administrador incorretas. Verifique o usuário e senha.')
    } else {
      setError('Email ou senha incorretos. Tente novamente.')
      }
    }
    
    setIsLoading(false)
  }

  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      if (provider === 'Google') {
        const result = await signIn('google', { 
          callbackUrl: callback,
          redirect: false,
          // Force Google to show the account picker and not auto-login
            prompt: 'consent select_account'
        })
        
        if (result?.error) {
          setError('Erro ao fazer login com Google. Tente novamente.')
        } else if (result?.ok) {
          // Salvar dados do usuário Google no JSON
          try {
            const session = await getSession()
            if (session?.user) {
              const response = await fetch('/api/auth/google-login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image
                })
              })
              
              if (response.ok) {
                console.log('Usuário Google salvo no JSON')
              }
            }
          } catch (error) {
            console.error('Erro ao salvar usuário Google:', error)
          }
          
            // Se o NextAuth retornou uma URL (ex: /register...), seguir ela
            if (result?.url) {
              router.push(result.url)
            } else {
              router.push(callback)
            }
        }
  }
    } catch (error) {
      console.error('Erro no login social:', error)
      setError('Erro ao fazer login social. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-12 pt-20">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Link>
            
            {isAdminMode && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="text-sm font-semibold text-orange-800">Modo Administrador</span>
                </div>
                <p className="text-xs text-orange-700">Acesso restrito para administradores do sistema</p>
              </div>
            )}
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isAdminMode ? 'Login Administrativo' : 'Entrar na sua conta'}
            </h1>
            <p className="text-gray-600">
              {isAdminMode 
                ? 'Acesse o painel administrativo do sistema' 
                : 'Acesse sua conta para gerenciar pedidos e favoritos'
              }
            </p>
          </div>

          {/* Social Login Buttons - apenas se não for modo admin */}
          {!isAdminMode && (
            <>
          <div className="space-y-3 mb-8">
            <button
              onClick={() => handleSocialLogin('Google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{isLoading ? 'Entrando...' : 'Continuar com Google'}</span>
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou entre com email</span>
            </div>
          </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {isAdminMode ? 'Usuário' : 'Email ou usuário'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder={isAdminMode ? 'admin' : 'seu@email.com '}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isAdminMode && (
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-orange-500 hover:text-orange-600 transition-colors">Esqueci a senha?</Link>
            </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : (isAdminMode ? 'Acessar Sistema' : 'Entrar')}
            </button>
          </form>
          
          {/* Botão Criar Conta discreto - apenas se não for modo admin */}
          {!isAdminMode && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setAnimateRegister(true)
                setTimeout(() => {
                  setAnimateRegister(false)
                  router.push('/register')
                }, 700)
              }}
              className={`text-xs text-orange-500 hover:text-orange-600 font-bold px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 mt-2 ${animateRegister ? 'animate-bounce animate-pulse animate-shake scale-105' : ''}`}
            >
              Criar conta
            </button>
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
