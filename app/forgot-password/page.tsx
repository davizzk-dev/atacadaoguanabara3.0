'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    console.log('🔥 Enviando email forgot password:')
    console.log('  📧 Email:', email, '(length:', email?.length || 0, ')')
    console.log('  📧 Email trimmed:', email?.trim(), '(length:', email?.trim().length || 0, ')')

    try {
      const requestData = { email: email.trim() }
      console.log('📨 Request data:', requestData)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      console.log('📨 Response status:', response.status)
      const data = await response.json()
      console.log('📨 Response data:', data)

      if (response.ok) {
        setSuccess('Email confirmado! Agora confirme seu número de telefone.')
        setStep('phone')
      } else {
        console.log('❌ Error response:', response.status, data)
        setError(data.error || 'Email não encontrado')
      }
    } catch (error) {
      console.log('❌ Catch error:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Telefone confirmado! Agora defina sua nova senha.')
        setStep('new-password')
      } else {
        setError(data.error || 'Número de telefone não confere')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const requestData = { email, phone, newPassword }
    console.log('🔥 Enviando reset password:')
    console.log('  📧 Email:', email)
    console.log('  📱 Phone:', phone)
    console.log('  🔐 New Password:', newPassword ? `provided (${newPassword.length} chars)` : 'missing')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()
      console.log('📨 Response:', data)

      if (response.ok) {
        setSuccess('Senha alterada com sucesso! Redirecionando para login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        console.log('❌ Error response:', response.status, data)
        setError(data.error || 'Erro ao alterar senha')
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.')
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
              href="/login" 
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao login</span>
            </Link>
            
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 'email' && 'Recuperar Senha'}
              {step === 'phone' && 'Verificar Telefone'}
              {step === 'new-password' && 'Nova Senha'}
            </h1>
            
            <p className="text-gray-600">
              {step === 'email' && 'Digite seu email cadastrado'}
              {step === 'phone' && 'Confirme o seu número de telefone'}
              {step === 'new-password' && 'Defina sua nova senha'}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'email' ? 'bg-orange-500 text-white' : 
                step === 'phone' || step === 'new-password' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${
                step === 'phone' || step === 'new-password' ? 'bg-green-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'phone' ? 'bg-orange-500 text-white' : 
                step === 'new-password' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${
                step === 'new-password' ? 'bg-green-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'new-password' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Confirmar Email'}
              </button>
            </form>
          )}

          {/* Step 2: Phone */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Digite seu número de telefone"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Verificando...' : 'Confirmar Telefone'}
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'new-password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Mínimo 6 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Lembrou sua senha?{' '}
              <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 