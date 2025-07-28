'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, MapPin, Phone, User, AlertCircle, Truck, Calculator } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { useCartStore, useAuthStore, useOrderStore } from '@/lib/store'
import { shippingService } from '@/lib/shipping'
import type { Address, ShippingCalculation } from '@/lib/types'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { addOrder } = useOrderStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [shippingCalculation, setShippingCalculation] = useState<ShippingCalculation | null>(null)
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const router = useRouter()
  const errorRef = useRef<HTMLDivElement>(null)

  // Scroll para mensagens de erro
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, [error])

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length <= 2) return numbers
      if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    return value.slice(0, 15)
  }

  // Formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      if (numbers.length <= 5) return numbers
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`
    }
    return value.slice(0, 9)
  }

  // Calcular frete
  const calculateShipping = async (address: Address) => {
    setIsCalculatingShipping(true)
    try {
      const calculation = await shippingService.calculateShipping(address, getTotal())
      setShippingCalculation(calculation)
      return calculation
    } catch (error) {
      console.error('Erro ao calcular frete:', error)
      setError('Erro ao calcular frete. Tente novamente.')
      return null
    } finally {
      setIsCalculatingShipping(false)
    }
  }

  // Buscar endereço por CEP
  const handleZipCodeBlur = async (zipCode: string) => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    if (cleanZipCode.length === 8) {
      try {
                 const addressData = await (shippingService.constructor as any).getAddressByZipCode(cleanZipCode)
        if (addressData) {
          // Preencher campos automaticamente
          const form = document.querySelector('form') as HTMLFormElement
          if (form) {
            const streetInput = form.querySelector('[name="street"]') as HTMLInputElement
            const neighborhoodInput = form.querySelector('[name="neighborhood"]') as HTMLInputElement
            const cityInput = form.querySelector('[name="city"]') as HTMLInputElement
            const stateInput = form.querySelector('[name="state"]') as HTMLSelectElement

            if (streetInput) streetInput.value = addressData.street || ''
            if (neighborhoodInput) neighborhoodInput.value = addressData.neighborhood || ''
            if (cityInput) cityInput.value = addressData.city || ''
            if (stateInput) stateInput.value = addressData.state || ''
          }
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatPhone(e.target.value)
  }

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCEP(e.target.value)
  }

  const handleTestAuth = () => {
    const info = `
      Usuário logado: ${user ? 'Sim' : 'Não'}
      Nome: ${user?.name || 'N/A'}
      Email: ${user?.email || 'N/A'}
      Telefone: ${user?.phone || 'N/A'}
      ID: ${user?.id || 'N/A'}
      Itens no carrinho: ${items.length}
      Total: R$ ${getTotal().toFixed(2)}
    `
    setDebugInfo(info)
    console.log('Debug Info:', info)
  }

  const handleWhatsAppOrder = async () => {
    // Limpar erro anterior
    setError(null)
    setDebugInfo(null)

    // Verificar se há itens no carrinho
    if (items.length === 0) {
      setError('Adicione produtos ao carrinho antes de finalizar o pedido.')
      return
    }

    setIsLoading(true)

    try {
      console.log('Iniciando processo de pedido...')
      console.log('Usuário:', user)
      console.log('Itens:', items)

      // Obter dados do formulário
      const formData = new FormData(document.querySelector('form') as HTMLFormElement)
      const customerName = formData.get('name') as string || user?.name || ''
      const customerPhone = formData.get('phone') as string || user?.phone || ''
      const customerEmail = formData.get('email') as string || user?.email || ''

      // Obter dados de endereço
      const street = formData.get('street') as string || ''
      const number = formData.get('number') as string || ''
      const complement = formData.get('complement') as string || ''
      const neighborhood = formData.get('neighborhood') as string || ''
      const city = formData.get('city') as string || ''
      const state = formData.get('state') as string || ''
      const zipCode = formData.get('zipCode') as string || ''

      // Validar dados obrigatórios
      if (!customerName.trim()) {
        setError('Nome é obrigatório.')
        return
      }

      if (!customerPhone.trim()) {
        setError('Telefone é obrigatório.')
        return
      }

      if (!customerEmail.trim()) {
        setError('Email é obrigatório.')
        return
      }

      // Validar endereço
      if (!street || !number || !neighborhood || !city || !state || !zipCode) {
        setError('Todos os campos de endereço são obrigatórios.')
        return
      }

      // Criar objeto de endereço
      const address: Address = {
        street,
        number,
        complement: complement || undefined,
        neighborhood,
        city,
        state,
        zipCode,
        reference: formData.get('reference') as string || undefined
      }

      // Calcular frete se ainda não foi calculado
      let shipping = shippingCalculation
      if (!shipping) {
        shipping = await calculateShipping(address)
        if (!shipping) {
          return
        }
      }

      // Verificar se o frete está disponível
      if (!shipping.available) {
        setError('Desculpe, não entregamos neste endereço.')
        return
      }

      const totalWithShipping = getTotal() + shipping.cost

      // Criar pedido
      const order = {
        id: Date.now().toString(),
        items,
        total: totalWithShipping,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address
        },
        status: 'pending' as const,
        createdAt: new Date(),
        estimatedDelivery: new Date(Date.now() + shipping.duration * 60 * 1000),
        shippingCost: shipping.cost,
        shippingDistance: shipping.distance
      }

      // Salvar pedido na API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      })

      if (response.ok) {
        const savedOrder = await response.json()
        console.log('Pedido salvo:', savedOrder)
        
        // Salvar pedido no store local
        addOrder(savedOrder)

        // Enviar para WhatsApp
        const orderItems = items.map(item => 
          `${item.product.name} - Qtd: ${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}`
        ).join('\n')

        const message = `🛒 *PEDIDO - ATACADÃO GUANABARA*

*Cliente:* ${customerName}
*Telefone:* ${customerPhone}
*Email:* ${customerEmail}

*Endereço de entrega:*
${street}, ${number}${complement ? ` - ${complement}` : ''}
${neighborhood}, ${city} - ${state}
CEP: ${zipCode}

*Itens:*
${orderItems}

*Subtotal: R$ ${getTotal().toFixed(2)}*
*Frete: R$ ${shipping.cost.toFixed(2)}*
*Total: R$ ${totalWithShipping.toFixed(2)}*

*Informações de entrega:*
Distância: ${shipping.distance.toFixed(1)} km
Tempo estimado: ${shipping.estimatedDelivery}

Obrigado pela preferência! 🧡`

        console.log('Mensagem WhatsApp:', message)

        const whatsappUrl = `https://wa.me/5585985694642?text=${encodeURIComponent(message)}`
        console.log('URL WhatsApp:', whatsappUrl)

        // Abrir WhatsApp em nova aba
        const whatsappWindow = window.open(whatsappUrl, '_blank')
        
        if (!whatsappWindow) {
          setError('Não foi possível abrir o WhatsApp. Verifique se o popup está bloqueado.')
          return
        }

        // Limpar carrinho
        clearCart()
        
        // Mostrar mensagem de sucesso
        alert('Seu pedido foi enviado! Finalize a conversa no WhatsApp. Obrigado por comprar no Atacadão Guanabara! 🧡')
        router.push('/')
      } else {
        const errorData = await response.json()
        console.error('Erro da API:', errorData)
        setError(`Erro ao processar pedido: ${errorData.error || 'Tente novamente.'}`)
      }
    } catch (error) {
      console.error('Erro completo:', error)
      setError('Erro ao processar pedido. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-orange-50">
      <Header />
      <div className="flex flex-col items-center pt-6">
        {/* Logo Atacadão Guanabara */}
        <div className="w-full flex justify-center mb-6">
          <img
            src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg"
            alt="Logo Atacadão Guanabara"
            className="h-32 w-auto drop-shadow-2xl rounded-2xl border-4 border-white bg-white p-2"
            style={{ maxWidth: 260 }}
          />
        </div>
        <main className="w-full max-w-6xl mx-auto px-2 sm:px-6 py-6 flex-1">
          <div className="bg-white/95 rounded-3xl shadow-2xl p-8 md:p-12 mb-12 border border-blue-100 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Itens do carrinho */}
            <section className="flex flex-col gap-8">
              <h2 className="text-3xl font-extrabold text-[#FF6600] mb-2 text-center tracking-tight drop-shadow">Seu Carrinho</h2>
              {items.length === 0 ? (
                <div className="text-center text-gray-400 py-20">
                  <span className="text-7xl block mb-6">🛒</span>
                  <p className="text-2xl font-semibold">Seu carrinho está vazio</p>
                  <a href="/catalog" className="mt-8 inline-block px-8 py-3 bg-[#FF6600] text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition text-lg">Ver Produtos</a>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl shadow-lg p-6 border border-orange-100 gap-6">
                      <img src={item.product.image} alt={item.product.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-200 shadow-md" />
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="font-bold text-gray-900 text-lg md:text-xl truncate mb-1">{item.product.name}</div>
                        <div className="text-gray-500 text-sm mb-1">Qtd: <span className="font-semibold text-blue-700">{item.quantity}</span></div>
                        <div className="text-[#FF6600] font-bold text-lg">R$ {(item.product.price * item.quantity).toFixed(2)}</div>
                      </div>
                      <button onClick={() => removeItem(item.product.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-3 rounded-full bg-red-50 shadow transition-all border border-red-100">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            {/* Formulário, total e botão - lateral direita em desktop */}
            {items.length > 0 && (
              <aside className="flex flex-col gap-10 w-full max-w-md mx-auto">
                {/* Aviso de entrega */}
                <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-700 font-bold rounded-xl px-4 py-3 mb-2 text-center shadow animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="w-5 h-5" />
                    <span>Calcule o frete para seu endereço</span>
                  </div>
                </div>



              {/* Informações de debug */}
              {debugInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Informações de Debug:</h3>
                  <pre className="text-xs text-blue-700 whitespace-pre-wrap">{debugInfo}</pre>
                </div>
              )}

              {/* Mensagem de erro */}
              {error && (
                <div ref={errorRef} className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              <FormCart user={user} />
              
              {/* Cálculo de Frete */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cálculo de Frete</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      const form = document.querySelector('form') as HTMLFormElement
                      if (form) {
                        const formData = new FormData(form)
                        const address: Address = {
                          street: formData.get('street') as string,
                          number: formData.get('number') as string,
                          complement: formData.get('complement') as string || undefined,
                          neighborhood: formData.get('neighborhood') as string,
                          city: formData.get('city') as string,
                          state: formData.get('state') as string,
                          zipCode: formData.get('zipCode') as string,
                          reference: formData.get('reference') as string || undefined
                        }
                        
                        if (address.street && address.number && address.neighborhood && address.city && address.state && address.zipCode) {
                          await calculateShipping(address)
                        } else {
                          setError('Preencha todos os campos de endereço para calcular o frete')
                        }
                      }
                    }}
                    disabled={isCalculatingShipping}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Calculator className="w-4 h-4" />
                    {isCalculatingShipping ? 'Calculando...' : 'Calcular Frete'}
                  </button>
                </div>
                
                {shippingCalculation && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Distância:</span>
                      <span className="font-semibold">{shippingCalculation.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tempo estimado:</span>
                      <span className="font-semibold">{shippingCalculation.estimatedDelivery}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Custo do frete:</span>
                      <span className={`font-semibold ${shippingCalculation.cost === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {shippingCalculation.cost === 0 ? 'GRÁTIS' : `R$ ${shippingCalculation.cost.toFixed(2)}`}
                      </span>
                    </div>
                    {!shippingCalculation.available && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">Desculpe, não entregamos neste endereço.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Total */}
              <div className="flex flex-col md:flex-row justify-between items-center border-t pt-8 gap-6 md:gap-0">
                <span className="text-2xl font-bold text-blue-900 tracking-wide">Subtotal</span>
                <span className="text-4xl font-extrabold text-[#FF6600] drop-shadow">R$ {getTotal().toFixed(2)}</span>
              </div>
              
              {shippingCalculation && (
                <div className="flex flex-col md:flex-row justify-between items-center border-t pt-4 gap-6 md:gap-0">
                  <span className="text-lg font-semibold text-gray-700">Frete</span>
                  <span className={`text-2xl font-bold ${shippingCalculation.cost === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                    {shippingCalculation.cost === 0 ? 'GRÁTIS' : `R$ ${shippingCalculation.cost.toFixed(2)}`}
                  </span>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row justify-between items-center border-t pt-4 gap-6 md:gap-0">
                <span className="text-2xl font-bold text-blue-900 tracking-wide">Total</span>
                <span className="text-4xl font-extrabold text-[#FF6600] drop-shadow">
                  R$ {(getTotal() + (shippingCalculation?.cost || 0)).toFixed(2)}
                </span>
              </div>
              {/* Botão WhatsApp */}
              <button
                onClick={handleWhatsAppOrder}
                disabled={isLoading}
                className={`w-full py-5 px-10 rounded-2xl font-extrabold transition-colors flex items-center justify-center gap-3 text-2xl shadow-2xl border-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  isLoading
                    ? 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed'
                    : 'bg-[#25D366] text-white hover:bg-[#1ebe57] border-[#25D366]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>Finalizar no WhatsApp</span>
                    <span className="ml-2"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" className="lucide lucide-whatsapp"><circle cx="12" cy="12" r="12" fill="#25D366"/><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.372.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/></svg></span>
                  </>
                )}
              </button>
            </aside>
          )}
        </div>
      </main>
      </div>
      <Footer />
      {/* Animations */}
      <style jsx>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .animate-pulse-slow { animation: pulse-slow 3s infinite; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(.4,0,.2,1) both; }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 0 0 #25D36644; } 50% { box-shadow: 0 0 24px 8px #25D36688; } }
        .animate-glow { animation: glow 2.5s infinite; }
      `}</style>
    </div>
  )
}

// Formulário com máscaras e validação
function FormCart({ user }: { user: any }) {
  const [phone, setPhone] = useState(user?.phone || '')
  const [zipCode, setZipCode] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [name, setName] = useState(user?.name || '')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [reference, setReference] = useState('')
  
  // Máscara telefone
  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }
  
  // Máscara CEP
  function formatZipCode(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }
  
  // Validação email
  function isValidEmail(value: string) {
    return value.includes('@')
  }
  
  // Buscar endereço por CEP
  const handleZipCodeBlur = async () => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    if (cleanZipCode.length === 8) {
      try {
        const response = await fetch(`/api/shipping/zipcode/${cleanZipCode}`)
        if (response.ok) {
          const addressData = await response.json()
          setStreet(addressData.street || '')
          setNeighborhood(addressData.neighborhood || '')
          setCity(addressData.city || '')
          setState(addressData.state || '')
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }
  
  return (
    <form className="flex flex-col gap-5 bg-blue-50 rounded-xl p-6 border border-blue-100 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Nome Completo *</label>
          <input 
            type="text" 
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base" 
            placeholder="Seu nome completo" 
            required 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Telefone *</label>
          <input
            type="tel"
            name="phone"
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="(85) 99999-9999"
            value={phone}
            onChange={e => setPhone(formatPhone(e.target.value))}
            required
            maxLength={15}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-blue-900 text-sm">E-mail (opcional)</label>
          <input
            type="email"
            name="email"
            className={`rounded-lg border px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base ${email && !isValidEmail(email) ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {email && !isValidEmail(email) && (
            <span className="text-xs text-red-500 mt-1">Digite um e-mail válido com @</span>
          )}
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-blue-900 text-sm">CEP *</label>
          <input
            type="text"
            name="zipCode"
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="00000-000"
            value={zipCode}
            onChange={e => setZipCode(formatZipCode(e.target.value))}
            onBlur={handleZipCodeBlur}
            maxLength={9}
            required
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-blue-900 text-sm">Rua/Avenida *</label>
          <input 
            type="text" 
            name="street"
            value={street}
            onChange={e => setStreet(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base" 
            placeholder="Nome da rua" 
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Número *</label>
          <input
            type="text"
            name="number"
            value={number}
            onChange={e => setNumber(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="123"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Complemento</label>
          <input
            type="text"
            name="complement"
            value={complement}
            onChange={e => setComplement(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="Apto, bloco, etc."
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Bairro *</label>
          <input
            type="text"
            name="neighborhood"
            value={neighborhood}
            onChange={e => setNeighborhood(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="Nome do bairro"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Cidade *</label>
          <input
            type="text"
            name="city"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="Fortaleza"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Estado *</label>
          <select
            name="state"
            value={state}
            onChange={e => setState(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            required
          >
            <option value="">Selecione o estado</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-blue-900 text-sm">Ponto de Referência</label>
          <input
            type="text"
            name="reference"
            value={reference}
            onChange={e => setReference(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="Próximo ao mercado, farmácia, etc."
          />
        </div>
      </div>
    </form>
  )
}
