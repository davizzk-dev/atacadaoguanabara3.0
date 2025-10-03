'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Eye, EyeOff, Moon, Sun, User, Save, Lock, Check, MapPin, Phone, Mail, Edit, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGlobalTheme } from '@/hooks/useGlobalTheme'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme } = useGlobalTheme()
  const [step, setStep] = useState<'password' | 'settings'>('password')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'preferences'>('profile')
  const [showBairroDropdown, setShowBairroDropdown] = useState(false)
  
  // Lista de bairros de Fortaleza (mesma do carrinho, mas sem preços para o settings)
  const bairrosFortaleza = [
    'Jardim Guanabara', 'Vila Velha', 'Quintino Cunha', 'Olavo Oliveira', 'Jardim Iracema',
    'Padre Andrade', 'Floresta', 'Antonio Bezerra', 'Barra do Ceara', 'Cristo Redentor',
    'Alvaro Wayne', 'Carlito', 'Pirambu', 'Monte Castelo', 'Elery', 'Alagadiço',
    'Parquelandia', 'Parque Araxá', 'Rodolgo Teofilo', 'Amadeu Furtado', 'Bela Vista',
    'Pici', 'Dom Lustosa', 'Autran Nunes', 'Genibau', 'Tabapuá', 'Iparana', 'Parque Albano',
    'Parque Leblon', 'Jacarecanga', 'Centro', 'Moura brasil', 'Farias Brito', 'Benfica',
    'Damas', 'Jardim America', 'Bom Futuro', 'Montese', 'Pan Americano', 'Couto Fernandes',
    'Democrito Rocha', 'Joquei Clube', 'Henrique Jorge', 'Joao XXIII', 'Conj Ceara',
    'Parangaba', 'Itaoca', 'Parque Soledade'
  ]
  
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    number: '',
    complement: '',
    city: '',
    zipCode: '',
    neighborhood: '',
    reference: ''
  })

  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    emailUpdates: false,
    language: 'pt-BR'
  })

  // Aguardar montagem do componente para evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setStep('password')
      setPassword('')
      setError('')
      setActiveTab('profile')
      setShowBairroDropdown(false)
      // Carregar dados do usuário
      loadUserData()
      loadUserPreferences()
    }
  }, [isOpen, user])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showBairroDropdown && !target.closest('.relative')) {
        setShowBairroDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBairroDropdown])

  const loadUserData = async () => {
    if (user) {
      try {
        // Buscar dados do users.json primeiro
        const response = await fetch('/api/users')
        if (response.ok) {
          const users = await response.json()
          const currentUser = users.find((u: any) => u.email === user.email)
          
          if (currentUser) {
            // Verificar se address é objeto ou string
            if (currentUser.address && typeof currentUser.address === 'object') {
              // Estrutura aninhada (usuário normal)
              setUserData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                address: currentUser.address.street || '',
                number: currentUser.address.number || '',
                complement: currentUser.address.complement || '',
                city: currentUser.address.city || '',
                zipCode: currentUser.address.zipCode || '',
                neighborhood: currentUser.address.neighborhood || '',
                reference: currentUser.address.reference || ''
              })
            } else {
              // Estrutura plana (usuário Google)
              setUserData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '', // string simples
                number: '', // não tem
                complement: '', // não tem
                city: currentUser.city || '',
                zipCode: currentUser.zipCode || '',
                neighborhood: currentUser.neighborhood || '',
                reference: '' // não tem
              })
            }
            return
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do users.json:', error)
      }
      
      // Fallback: tentar carregar dados salvos do localStorage
      try {
        const savedProfile = localStorage.getItem('user-profile')
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile)
          
          // Verificar se os dados salvos são do usuário atual
          if (profileData.userId && profileData.userId === user.id) {
            setUserData({
              name: profileData.name || user.name || '',
              email: profileData.email || user.email || '',
              phone: profileData.phone || user.phone || '',
              address: profileData.address || (typeof user.address === 'string' ? user.address : ''),
              number: profileData.number || '',
              complement: profileData.complement || '',
              city: profileData.city || user.city || '',
              zipCode: profileData.zipCode || user.zipCode || '',
              neighborhood: profileData.neighborhood || user.neighborhood || '',
              reference: profileData.reference || ''
            })
            return
          } else {
            // Se os dados são de outro usuário, remover do localStorage
            localStorage.removeItem('user-profile')
            console.log('🧹 Dados de outro usuário removidos do localStorage')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar perfil salvo:', error)
      }
      
      // Último fallback: usar dados do usuário atual
      setUserData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: typeof user.address === 'string' ? user.address : '',
        number: '',
        complement: '',
        city: user.city || '',
        zipCode: user.zipCode || '',
        neighborhood: user.neighborhood || '',
        reference: ''
      })
    }
  }

  const loadUserPreferences = async () => {
    try {
      const storedPrefs = localStorage.getItem('user-preferences')
      if (storedPrefs && user) {
        const prefs = JSON.parse(storedPrefs)
        
        // Verificar se as preferências são do usuário atual
        if (prefs.userId && prefs.userId === user.id) {
          setPreferences(prefs)
        } else {
          // Se as preferências são de outro usuário, remover e usar padrão
          localStorage.removeItem('user-preferences')
          console.log('🧹 Preferências de outro usuário removidas do localStorage')
          setPreferences({
            theme: theme || 'light',
            notifications: true,
            emailUpdates: false,
            language: 'pt-BR'
          })
        }
      } else {
        setPreferences({
          theme: theme || 'light',
          notifications: true,
          emailUpdates: false,
          language: 'pt-BR'
        })
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
    }
  }

  const handlePasswordVerification = async () => {
    if (!password.trim()) {
      setError('Digite sua senha')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      // Verificar se é admin
      if (user?.email === 'admin' && password === 'atacadaoguanabaraadmin123secreto') {
        setStep('settings')
        return
      }

      // Usar sempre a API de verificação (que tem suporte a hash)
      const authResponse = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user?.email, 
          password 
        })
      })

      if (authResponse.ok) {
        const result = await authResponse.json()
        if (result.success) {
          setStep('settings')
        } else {
          setError('Senha incorreta')
        }
      } else {
        setError('Erro ao verificar senha')
      }
    } catch (error) {
      console.error('Erro na verificação:', error)
      setError('Erro ao verificar senha')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSaveAll = async () => {
    try {
      setIsSaving(true)
      
      // Tentar salvar no users.json se o usuário existir lá
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const users = await response.json()
          const currentUserIndex = users.findIndex((u: any) => u.email === user?.email)
          
          if (currentUserIndex !== -1) {
            const originalUser = users[currentUserIndex]
            
            // Atualizar dados do usuário no users.json
            let updatedUser = {
              ...originalUser,
              name: userData.name,
              phone: userData.phone,
              // SEMPRE usar estrutura de address como objeto (formato correto)
              address: {
                street: userData.address,
                number: userData.number,
                complement: userData.complement,
                neighborhood: userData.neighborhood,
                city: userData.city,
                state: 'CE',
                zipCode: userData.zipCode,
                reference: userData.reference
              }
            }
            
            // Salvar via API PUT
            const updateResponse = await fetch(`/api/users/${updatedUser.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedUser)
            })
            
            if (!updateResponse.ok) {
              console.error('Erro ao atualizar no users.json')
            }
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar users.json:', error)
      }
      
      // Salvar perfil no localStorage também (com ID do usuário para verificação)
      localStorage.setItem('user-profile', JSON.stringify({
        ...userData,
        userId: user?.id
      }))
      
      // Salvar preferências no localStorage
      localStorage.setItem('user-preferences', JSON.stringify({
        ...preferences,
        userId: user?.id
      }))
      
      // Atualizar o store com os novos dados do perfil (SEMPRE formato correto)
      if (user?.id) {
        setUser({ 
          ...user, 
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          address: {
            street: userData.address,
            number: userData.number,
            complement: userData.complement,
            neighborhood: userData.neighborhood,
            city: userData.city,
            state: 'CE',
            zipCode: userData.zipCode,
            reference: userData.reference
          }
        })
      }
      
      // Aplicar tema imediatamente e de forma robusta
      if (mounted) {
        // Salvar tema no localStorage para next-themes
        localStorage.setItem('theme', preferences.theme)
        
        // Aplicar tema via next-themes
        setTheme(preferences.theme)
        
        // Forçar aplicação no documento (backup)
        const root = document.documentElement
        const body = document.body
        
        if (preferences.theme === 'dark') {
          root.classList.add('dark')
          body.classList.add('dark')
          root.style.colorScheme = 'dark'
        } else {
          root.classList.remove('dark')
          body.classList.remove('dark')
          root.style.colorScheme = 'light'
        }
        
        // Força re-render para aplicar mudanças
        setTimeout(() => {
          const event = new Event('storage')
          window.dispatchEvent(event)
        }, 100)
      }
      
      showSuccessMessage('Todas as configurações foram salvas com sucesso!')
      onClose()
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      setError('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const showSuccessMessage = (message: string) => {
    const successMsg = document.createElement('div')
    successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[99999] flex items-center space-x-2 animate-in slide-in-from-right-4'
    successMsg.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    `
    document.body.appendChild(successMsg)
    
    setTimeout(() => {
      if (document.body.contains(successMsg)) {
        document.body.removeChild(successMsg)
      }
    }, 3000)
  }

  const handleThemeChange = (newTheme: string) => {
    setPreferences(prev => ({ ...prev, theme: newTheme }))
  }

  if (!isOpen || !mounted) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Configurações</h2>
              <p className="text-blue-100 text-sm">{user?.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'password' && (
          <div className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Verificação de Segurança</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Digite sua senha para acessar as configurações
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerification()}
                    placeholder="Digite sua senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <Button 
                onClick={handlePasswordVerification}
                disabled={isVerifying || !password.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isVerifying ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'settings' && (
          <div className="flex flex-col h-[calc(90vh-120px)]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('address')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'address'
                    ? 'border-b-2 border-blue-500 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4 mx-auto mb-1" />
                Endereço
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'preferences'
                    ? 'border-b-2 border-blue-500 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Settings className="w-4 h-4 mx-auto mb-1" />
                Preferências
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informações Pessoais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={userData.name}
                        onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={userData.phone}
                        onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Todas as Configurações'}
                  </Button>
                </div>
              )}

              {activeTab === 'address' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Endereço</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        value={userData.address}
                        onChange={(e) => setUserData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        value={userData.number}
                        onChange={(e) => setUserData(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="123"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        value={userData.complement}
                        onChange={(e) => setUserData(prev => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto 101, Bloco A (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowBairroDropdown(!showBairroDropdown)}
                          className="w-full flex justify-between items-center rounded-md border border-gray-300 px-3 py-2 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <span>{userData.neighborhood || 'Selecione o bairro'}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${showBairroDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showBairroDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {bairrosFortaleza.map((bairro) => (
                              <button
                                key={bairro}
                                type="button"
                                onClick={() => {
                                  setUserData(prev => ({ ...prev, neighborhood: bairro }))
                                  setShowBairroDropdown(false)
                                }}
                                className={`w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm ${
                                  userData.neighborhood === bairro ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                {bairro}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={userData.city}
                        onChange={(e) => setUserData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Nome da cidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        value={userData.zipCode}
                        onChange={(e) => setUserData(prev => ({ ...prev, zipCode: e.target.value }))}
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="reference">Ponto de Referência</Label>
                      <Input
                        id="reference"
                        value={userData.reference}
                        onChange={(e) => setUserData(prev => ({ ...prev, reference: e.target.value }))}
                        placeholder="Próximo ao supermercado X (opcional)"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Todas as Configurações'}
                  </Button>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferências</h3>
                  
                  {/* Tema */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Aparência</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleThemeChange('light')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          preferences.theme === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Sun className="w-6 h-6 text-yellow-500" />
                          <div className="text-left">
                            <span className="font-medium text-gray-900 dark:text-white block">Claro</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Tema padrão</span>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleThemeChange('dark')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          preferences.theme === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Moon className="w-6 h-6 text-blue-500" />
                          <div className="text-left">
                            <span className="font-medium text-gray-900 dark:text-white block">Escuro</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Tema noturno</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Notificações */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Notificações</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <Label className="font-medium">Notificações Push</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Receber notificações sobre pedidos
                          </p>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({ ...prev, notifications: !prev.notifications }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <Label className="font-medium">Atualizações por Email</Label>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Receber novidades e promoções
                          </p>
                        </div>
                        <button
                          onClick={() => setPreferences(prev => ({ ...prev, emailUpdates: !prev.emailUpdates }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences.emailUpdates ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferences.emailUpdates ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Todas as Configurações'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
