'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, MapPin, Phone, User, AlertCircle, Truck, Calculator, Heart, Star, CreditCard, Banknote, QrCode } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { useCartStore, useAuthStore, useOrderStore } from '@/lib/store'
import { shippingService } from '@/lib/shipping'
import { calculateDynamicPrice } from '@/lib/utils'
import type { Address, ShippingCalculation } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { addOrder } = useOrderStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [shippingCalculation, setShippingCalculation] = useState<ShippingCalculation | null>(null)
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [showThankYouDialog, setShowThankYouDialog] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'debit' | 'credit' | 'cash'>('pix')
  const [wantsChange, setWantsChange] = useState(false)
  const [changeFor, setChangeFor] = useState<string>('')
  const [changeError, setChangeError] = useState<string | null>(null)
  
  // Entrega vs Retirada
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  
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

  // Utilitário: atualizar dados no localStorage cartFormData
  const updateCartFormData = (partial: Record<string, any>) => {
    try {
      const saved = localStorage.getItem('cartFormData')
      const current = saved ? JSON.parse(saved) : {}
      const merged = { ...current, ...partial }
      localStorage.setItem('cartFormData', JSON.stringify(merged))
    } catch (e) {
      console.warn('Não foi possível salvar payment no localStorage')
    }
  }

  // Carregar pagamento e tipo de entrega salvos
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cartFormData')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.paymentMethod) setPaymentMethod(data.paymentMethod)
        if (typeof data.wantsChange !== 'undefined') setWantsChange(!!data.wantsChange)
        if (typeof data.changeFor !== 'undefined') setChangeFor(String(data.changeFor))
        if (data.deliveryType) setDeliveryType(data.deliveryType)
      }
    } catch {}
  }, [])

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

  // Validar troco em tempo real
  useEffect(() => {
    if (paymentMethod === 'cash' && wantsChange) {
      const totalWithShipping = getTotal() + (shippingCalculation?.cost || 0)
      const val = Number(changeFor || 0)
      if (!val || isNaN(val)) setChangeError('Informe um valor válido para troco')
      else if (val <= totalWithShipping) setChangeError(`O troco deve ser maior que o total (R$ ${totalWithShipping.toFixed(2)})`)
      else setChangeError(null)
    } else {
      setChangeError(null)
    }
  }, [paymentMethod, wantsChange, changeFor, shippingCalculation, getTotal])

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

    // Verificar valor mínimo de R$ 100
    const subtotal = getTotal()
    if (subtotal < 100) {
      setError(`Valor mínimo para pedido é R$ 100,00. Seu carrinho tem R$ ${subtotal.toFixed(2)}.`)
      return
    }

    setIsLoading(true)

    try {
      console.log('Iniciando processo de pedido...')
      console.log('Usuário:', user)
      console.log('Itens:', items)

      // Obter dados do localStorage (dados salvos automaticamente)
      let formData
      try {
        const savedData = localStorage.getItem('cartFormData')
        formData = savedData ? JSON.parse(savedData) : {}
      } catch (error) {
        console.error('Erro ao carregar dados do formulário:', error)
        formData = {}
      }

      const customerName = formData.name || user?.name || ''
      const customerPhone = formData.phone || user?.phone || ''
      const customerEmail = formData.email || user?.email || ''
      const street = formData.street || ''
      const number = formData.number || ''
      const complement = formData.complement || ''
      const neighborhood = formData.neighborhood || ''
      const city = formData.city || ''
      const state = formData.state || ''
      const zipCode = formData.zipCode || ''

      // Debug: mostrar valores obtidos
      console.log('Dados do formulário:', {
        customerName,
        customerPhone,
        customerEmail,
        street,
        number,
        neighborhood,
        city,
        state,
        zipCode
      })

      // Debug: mostrar dados carregados
      console.log('Dados carregados do localStorage:', formData)

      // Validar dados obrigatórios
      if (!customerName.trim()) {
        setError('Nome é obrigatório.')
        setDebugInfo(`Nome obtido: "${customerName}"`)
        return
      }

      if (!customerPhone.trim()) {
        setError('Telefone é obrigatório.')
        setDebugInfo(`Telefone obtido: "${customerPhone}"`)
        return
      }

      // Email é opcional - não validar formato

      // Validar endereço - verificar se os campos estão preenchidos
      const addressFields = { street, number, neighborhood, city, state, zipCode }
      const emptyFields = Object.entries(addressFields)
        .filter(([key, value]) => !value || !value.trim())
        .map(([key]) => key)

      if (emptyFields.length > 0) {
        const fieldNames = {
          street: 'Rua',
          number: 'Número',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'Estado',
          zipCode: 'CEP'
        }
        const missingFields = emptyFields.map(field => fieldNames[field as keyof typeof fieldNames]).join(', ')
        setError(`Preencha os campos obrigatórios: ${missingFields}`)
        setDebugInfo(`Campos vazios: ${emptyFields.join(', ')}`)
        return
      }

      // Obter referência do localStorage
      const reference = formData.reference || ''

      // Criar objeto de endereço
      const address: Address = {
        street,
        number,
        complement: complement || undefined,
        neighborhood,
        city,
        state,
        zipCode,
        reference: reference || undefined
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

      // Ler pagamento salvo
      const paymentMethod = (formData.paymentMethod as 'pix'|'debit'|'credit'|'cash') || 'pix'
      const wantsChange = formData.wantsChange === true || formData.wantsChange === 'true'
      const changeForValue = Number(formData.changeFor || 0)

      // Validações de pagamento (troco)
      if (paymentMethod === 'cash' && wantsChange) {
        if (!changeForValue || isNaN(changeForValue)) {
          setError('Informe o valor para troco.')
          return
        }
        if (changeForValue <= totalWithShipping) {
          setError(`O valor para troco deve ser maior que o total (R$ ${totalWithShipping.toFixed(2)}).`)
          return
        }
      }

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

      // Adicionar pagamento ao pedido
      ;(order as any).payment = {
        method: paymentMethod,
        wantsChange,
        changeFor: paymentMethod === 'cash' && wantsChange ? changeForValue : undefined
      }

      // Salvar pedido na API
      console.log('📤 Enviando pedido para API:', JSON.stringify(order, null, 2))
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      })

      console.log('📥 Resposta da API:', response.status, response.statusText)
      
      if (response.ok) {
        const responseText = await response.text()
        console.log('📄 Resposta completa:', responseText)
        
        let savedOrder
        try {
          savedOrder = JSON.parse(responseText)
          console.log('✅ Pedido salvo:', savedOrder)
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta:', parseError)
          setError('Erro ao processar resposta do servidor')
          return
        }
        
        // Salvar pedido no store local
        addOrder(savedOrder.order || savedOrder)
        
        // Armazenar ID do pedido para redirecionamento e acesso no menu
        setOrderId(savedOrder.order?.id || savedOrder.id)
        try {
          localStorage.setItem('lastOrderId', String(savedOrder.order?.id || savedOrder.id))
        } catch {}

        // Enviar para WhatsApp
        const orderItems = items.map(item => 
          `• ${item.product.name}  x${item.quantity} — R$ ${(calculateDynamicPrice(item.product, item.quantity) * item.quantity).toFixed(2)}`
        ).join('\n')

        const payLabel = paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'debit' ? 'Cartão de Débito' : paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Dinheiro'
        const changeLine = paymentMethod === 'cash' && wantsChange ? `\nTroco para: R$ ${changeForValue.toFixed(2)}` : ''

        const message = [
          '🧾 *PEDIDO — ATACADÃO GUANABARA*',
          '',
          `👤 Cliente: ${customerName}`,
          `📞 Telefone: ${customerPhone}`,
          customerEmail ? `📧 Email: ${customerEmail}` : null,
          '',
          '*📍 Endereço de entrega*',
          `${street}, ${number}${complement ? ` - ${complement}` : ''}`,
          `${neighborhood}, ${city} - ${state}`,
          `CEP: ${zipCode}`,
          '',
          '*🛍️ Itens do pedido*',
          orderItems,
          '',
          `Subtotal: R$ ${getTotal().toFixed(2)}`,
          `Frete: R$ ${shipping.cost.toFixed(2)}`,
          `Total: R$ ${totalWithShipping.toFixed(2)}`,
          '',
          '*💳 Pagamento*',
          `Forma: ${payLabel}${changeLine}`,
          '',
          '*🚚 Entrega*',
          `Distância: ${shipping.distance.toFixed(1)} km`,
          `Tempo estimado: ${shipping.estimatedDelivery}`,
          '',
          'Agradeço desde já! Atacadão Guanabara 🙏✨'
        ].filter(Boolean).join('\n')

        console.log('Mensagem WhatsApp:', message)

        // Buscar número do WhatsApp em settings
        let phone = '5585985147067'
        try {
          const s = await fetch('/api/settings', { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
          if (s?.whatsapp_number) phone = String(s.whatsapp_number)
        } catch {}
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        console.log('URL WhatsApp:', whatsappUrl)

        // Abrir WhatsApp em nova aba
        const whatsappWindow = window.open(whatsappUrl, '_blank')
        
        if (!whatsappWindow) {
          setError('Não foi possível abrir o WhatsApp. Verifique se o popup está bloqueado.')
          return
        }

        // Limpar carrinho
        clearCart()
        
        // Mostrar popup de agradecimento
        setShowThankYouDialog(true)
      } else {
        const errorText = await response.text()
        console.error('❌ Erro na API:', response.status, errorText)
        setError(`Erro ao salvar pedido: ${response.status} - ${errorText}`)
        return
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
                    <div key={item.product.id} className="flex items-center bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl shadow-xl p-8 border border-orange-100 gap-8 min-h-[140px]">
                      <img src={item.product.image} alt={item.product.name} className="w-32 h-32 rounded-2xl object-cover border-2 border-blue-200 shadow-md flex-shrink-0" />
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <div className="font-bold text-gray-900 text-xl md:text-2xl leading-tight mb-2">{item.product.name}</div>
                        <div className="text-gray-600 text-base mb-2">
                          Quantidade: <span className="font-semibold text-blue-700 text-lg">{item.quantity} unidade(s)</span>
                        </div>
                        <div className="text-[#FF6600] font-extrabold text-xl md:text-2xl">
                          R$ {((calculateDynamicPrice(item.product, item.quantity)) * (Number(item.quantity) || 0)).toFixed(2)}
                        </div>
                        <div className="text-gray-500 text-sm">
                          Preço unitário: R$ {calculateDynamicPrice(item.product, item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-center">
                        <button 
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))} 
                          className="text-blue-600 hover:text-white hover:bg-blue-600 p-2 rounded-full bg-blue-50 shadow transition-all border border-blue-200"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-lg px-3 py-1 bg-gray-100 rounded-lg">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)} 
                          className="text-green-600 hover:text-white hover:bg-green-600 p-2 rounded-full bg-green-50 shadow transition-all border border-green-200"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button onClick={() => removeItem(item.product.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-3 rounded-full bg-red-50 shadow transition-all border border-red-100 mt-2">
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
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

                {/* Aviso de valor mínimo */}
                <div className={`border-l-4 rounded-xl px-4 py-3 mb-2 text-center shadow ${
                  getTotal() >= 100 
                    ? 'bg-green-50 border-green-400 text-green-700' 
                    : 'bg-red-50 border-red-400 text-red-700 animate-pulse'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold">
                      {getTotal() >= 100 
                        ? '✅ Valor mínimo atingido!' 
                        : `Valor mínimo: R$ 100,00 (Faltam R$ ${(100 - getTotal()).toFixed(2)})`
                      }
                    </span>
                  </div>
                </div>

                {/* Informações sobre frete */}
                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-xl px-4 py-3 mb-2 text-center shadow">
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="w-5 h-5" />
                    <span className="font-bold">
                      Frete: R$ 3,00 por km | Grátis em pedidos acima de R$ 150,00
                    </span>
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

              {/* Seleção de Entrega ou Retirada */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-orange-500" />
                  Como você quer receber?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('delivery')
                      updateCartFormData({ deliveryType: 'delivery' })
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      deliveryType === 'delivery'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center flex-col">
                      <Truck className="w-8 h-8 mb-2" />
                      <span className="font-semibold">Entrega em Casa</span>
                      <span className="text-sm text-gray-600">Receba no seu endereço</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('pickup')
                      updateCartFormData({ deliveryType: 'pickup' })
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center flex-col">
                      <MapPin className="w-8 h-8 mb-2" />
                      <span className="font-semibold">Retirar na Loja</span>
                      <span className="text-sm text-gray-600">Busque pessoalmente</span>
                    </div>
                  </button>
                </div>
              </div>

              <FormCart user={user} deliveryType={deliveryType} />
              
              {/* Cálculo de Frete - apenas para entrega */}
              {deliveryType === 'delivery' && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cálculo de Frete</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      // Obter dados do localStorage
                      let formData
                      try {
                        const savedData = localStorage.getItem('cartFormData')
                        formData = savedData ? JSON.parse(savedData) : {}
                      } catch (error) {
                        console.error('Erro ao carregar dados do formulário:', error)
                        formData = {}
                      }

                      const address: Address = {
                        street: formData.street || '',
                        number: formData.number || '',
                        complement: formData.complement || undefined,
                        neighborhood: formData.neighborhood || '',
                        city: formData.city || '',
                        state: formData.state || '',
                        zipCode: formData.zipCode || '',
                        reference: formData.reference || undefined
                      }
                      
                      if (address.street && address.number && address.neighborhood && address.city && address.state && address.zipCode) {
                        await calculateShipping(address)
                      } else {
                        setError('Preencha todos os campos de endereço para calcular o frete')
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
              )}
              
              {/* Total */}
              <div className="flex flex-col md:flex-row justify-between items-center border-t pt-8 gap-6 md:gap-0">
                <span className="text-2xl font-bold text-blue-900 tracking-wide">Subtotal</span>
                <span className="text-4xl font-extrabold text-[#FF6600] drop-shadow">R$ {getTotal().toFixed(2)}</span>
              </div>

              {/* Forma de Pagamento */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Forma de Pagamento</h3>
                
                {/* Aviso sobre orçamento */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">💡 Informação Importante sobre Pagamento</p>
                      <p>
                        O pagamento é realizado <strong>somente na presença da nota fiscal</strong>. 
                        O valor apresentado é um <strong>orçamento</strong> que pode ser alterado conforme 
                        disponibilidade e condições do produto no momento da {deliveryType === 'pickup' ? 'retirada' : 'entrega'}.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod==='pix'?'border-green-500 bg-green-50':'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pix"
                      checked={paymentMethod==='pix'}
                      onChange={() => { setPaymentMethod('pix'); updateCartFormData({ paymentMethod: 'pix', wantsChange: false, changeFor: '' }) }}
                    />
                    <QrCode className="w-4 h-4 text-green-600" />
                    <span className="font-medium">PIX</span>
                    <span className="ml-auto text-xs text-gray-500">Mais rápido</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod==='debit'?'border-blue-500 bg-blue-50':'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="debit"
                      checked={paymentMethod==='debit'}
                      onChange={() => { setPaymentMethod('debit'); updateCartFormData({ paymentMethod: 'debit', wantsChange: false, changeFor: '' }) }}
                    />
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Cartão de Débito</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod==='credit'?'border-purple-500 bg-purple-50':'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit"
                      checked={paymentMethod==='credit'}
                      onChange={() => { setPaymentMethod('credit'); updateCartFormData({ paymentMethod: 'credit', wantsChange: false, changeFor: '' }) }}
                    />
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Cartão de Crédito</span>
                    <span className="ml-auto text-xs text-gray-500">Parcelas no local</span>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${paymentMethod==='cash'?'border-orange-500 bg-orange-50':'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod==='cash'}
                      onChange={() => { setPaymentMethod('cash'); updateCartFormData({ paymentMethod: 'cash' }) }}
                    />
                    <Banknote className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Dinheiro</span>
                    <span className="ml-auto text-xs text-gray-500">Troco disponível</span>
                  </label>
                </div>

                {/* Troco quando dinheiro */}
                {paymentMethod === 'cash' && (
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={wantsChange}
                        onChange={(e) => { setWantsChange(e.target.checked); updateCartFormData({ wantsChange: e.target.checked }) }}
                      />
                      <span className="text-sm font-medium text-gray-700">Precisa de troco?</span>
                    </label>
                    {wantsChange && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Troco para R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={changeFor}
                            onChange={(e) => { setChangeFor(e.target.value); updateCartFormData({ changeFor: e.target.value }) }}
                            className={`w-44 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${changeError ? 'border-red-300 focus:ring-red-300' : 'border-gray-300 focus:ring-orange-400'}`}
                            placeholder={(getTotal() + (shippingCalculation?.cost||0)).toFixed(2)}
                          />
                        </div>
                        {changeError && (
                          <div className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {changeError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                disabled={isLoading || getTotal() < 100 || (paymentMethod==='cash' && wantsChange && !!changeError)}
                className={`w-full py-5 px-10 rounded-2xl font-extrabold transition-colors flex items-center justify-center gap-3 text-2xl shadow-2xl border-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  isLoading || getTotal() < 100 || (paymentMethod==='cash' && wantsChange && !!changeError)
                    ? 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed'
                    : 'bg-[#25D366] text-white hover:bg-[#1ebe57] border-[#25D366]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    <span>Processando...</span>
                  </>
                ) : getTotal() < 100 ? (
                  <>
                    <span>Valor mínimo: R$ 100,00</span>
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

      {/* Popup de Agradecimento */}
      <Dialog open={showThankYouDialog} onOpenChange={setShowThankYouDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-600 mb-4">
              🎉 Pedido Enviado com Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-6xl mb-4">🧡</div>
            <p className="text-gray-700 text-lg">
              Obrigado por comprar no <strong>Atacadão Guanabara</strong>!
            </p>
            <p className="text-gray-600">
              Seu pedido foi enviado para o WhatsApp. Finalize a conversa por lá para confirmar sua compra.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              {orderId && (
                <Button 
                  onClick={() => {
                    setShowThankYouDialog(false)
                    router.push(`/order-status/${orderId}`)
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  📱 Acompanhar Pedido
                </Button>
              )}
              <Button 
                onClick={() => {
                  setShowThankYouDialog(false)
                  setShowRatingDialog(true)
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Star className="w-4 h-4 mr-2" />
                Avaliar Experiência
              </Button>
              <Button 
                onClick={() => {
                  setShowThankYouDialog(false)
                  router.push('/')
                }}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Continuar Comprando
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popup de Avaliação */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-600 mb-4">
              ⭐ Avalie Sua Experiência
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-4xl mb-4">🌟</div>
            <p className="text-gray-700">
              Sua opinião é muito importante para nós! 
              Ajude-nos a melhorar nossos serviços.
            </p>
            <div className="flex justify-center space-x-2 text-3xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    // Aqui você pode adicionar lógica para salvar a avaliação
                    setShowRatingDialog(false)
                    router.push('/feedback')
                  }}
                  className="hover:scale-110 transition-transform"
                >
                  ⭐
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Clique em uma estrela para avaliar
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => {
                  setShowRatingDialog(false)
                  router.push('/feedback')
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Heart className="w-4 h-4 mr-2" />
                Deixar Feedback Detalhado
              </Button>
              <Button 
                onClick={() => {
                  setShowRatingDialog(false)
                  router.push('/')
                }}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Pular Avaliação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
function FormCart({ user, deliveryType }: { user: any, deliveryType: 'delivery' | 'pickup' }) {
  const [phone, setPhone] = useState(user?.phone || '')
  const [zipCode, setZipCode] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [name, setName] = useState(user?.name || '')
  
  // Campos específicos para retirada
  const [pickupFirstName, setPickupFirstName] = useState('')
  const [pickupLastName, setPickupLastName] = useState('')
  const [pickupPhone, setPickupPhone] = useState('')
  const [pickupEmail, setPickupEmail] = useState('')
  
  // Campos de entrega
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('Ceará')
  const [reference, setReference] = useState('')

  // Salvar dados no localStorage quando mudar
  useEffect(() => {
    const formData = {
      name,
      phone,
      email,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      reference,
      pickupFirstName,
      pickupLastName,
      pickupPhone,
      pickupEmail
    }
    localStorage.setItem('cartFormData', JSON.stringify(formData))
  }, [name, phone, email, street, number, complement, neighborhood, city, state, zipCode, reference, pickupFirstName, pickupLastName, pickupPhone, pickupEmail])

  // Carregar dados do localStorage ao montar
  useEffect(() => {
    const savedData = localStorage.getItem('cartFormData')
    if (savedData) {
      try {
        const formData = JSON.parse(savedData)
        setName(formData.name || user?.name || '')
        setPhone(formData.phone || user?.phone || '')
        setEmail(formData.email || user?.email || '')
        setStreet(formData.street || '')
        setNumber(formData.number || '')
        setComplement(formData.complement || '')
        setNeighborhood(formData.neighborhood || '')
        setCity(formData.city || '')
        setState(formData.state || '')
        setZipCode(formData.zipCode || '')
        setReference(formData.reference || '')
        setPickupFirstName(formData.pickupFirstName || '')
        setPickupLastName(formData.pickupLastName || '')
        setPickupPhone(formData.pickupPhone || '')
        setPickupEmail(formData.pickupEmail || '')
      } catch (error) {
        console.error('Erro ao carregar dados do formulário:', error)
      }
    }
  }, [user])
  
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
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        {deliveryType === 'delivery' ? 'Dados para Entrega' : 'Dados para Retirada na Loja'}
      </h3>
      
      {deliveryType === 'pickup' ? (
        /* Formulário para Retirada */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-blue-900 text-sm">Nome *</label>
            <input 
              type="text" 
              name="pickupFirstName"
              value={pickupFirstName}
              onChange={(e) => setPickupFirstName(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition text-base" 
              placeholder="Seu nome" 
              required 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-blue-900 text-sm">Sobrenome *</label>
            <input 
              type="text" 
              name="pickupLastName"
              value={pickupLastName}
              onChange={(e) => setPickupLastName(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition text-base" 
              placeholder="Seu sobrenome" 
              required 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-blue-900 text-sm">Telefone *</label>
            <input
              type="tel"
              name="pickupPhone"
              className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition text-base"
              placeholder="(85) 99999-9999"
              value={pickupPhone}
              onChange={e => setPickupPhone(formatPhone(e.target.value))}
              required
              maxLength={15}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-blue-900 text-sm">E-mail (opcional)</label>
            <input
              type="email"
              name="pickupEmail"
              className={`rounded-lg border px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition text-base ${pickupEmail && !isValidEmail(pickupEmail) ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="seu@email.com"
              value={pickupEmail}
              onChange={e => setPickupEmail(e.target.value)}
            />
            {pickupEmail && !isValidEmail(pickupEmail) && (
              <span className="text-xs text-red-500 mt-1">Digite um e-mail válido com @</span>
            )}
          </div>
          
          {/* Informações da loja */}
          <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Informações para Retirada
            </h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Endereço:</strong> R. Exemplo, 123 - Centro, Fortaleza - CE</p>
              <p><strong>Horário:</strong> Segunda a Sexta: 8h às 18h | Sábado: 8h às 12h</p>
              <p><strong>Telefone:</strong> (85) 3333-4444</p>
              <p className="text-xs mt-2 text-green-600">
                💡 Leve um documento com foto para retirar o pedido
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Formulário para Entrega */
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

        <div className="flex flex-col gap-2 md:col-span-2">
          <label htmlFor="state" className="font-semibold text-blue-900 text-sm">
            Estado
          </label>
          <input
            type="text"
            name="state"
            value="Ceará"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-100"
            readOnly
          />
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
      )}
    </form>
  )
}
