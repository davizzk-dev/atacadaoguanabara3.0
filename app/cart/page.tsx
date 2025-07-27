'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, MapPin, Phone, User, AlertCircle } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { useCartStore, useAuthStore, useOrderStore } from '@/lib/store'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { addOrder } = useOrderStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
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
      const customerAddress = formData.get('address') as string || 'Jardim Guanabara'

      // Validar dados obrigatórios
      if (!customerName.trim()) {
        setError('Por favor, preencha seu nome completo.')
        setIsLoading(false)
        return
      }

      if (!customerPhone.trim()) {
        setError('Por favor, preencha seu número de telefone.')
        setIsLoading(false)
        return
      }

      // Validar formato do telefone (pelo menos 10 dígitos)
      const phoneNumbers = customerPhone.replace(/\D/g, '')
      if (phoneNumbers.length < 10) {
        setError('Por favor, preencha um telefone válido com pelo menos 10 dígitos.')
        setIsLoading(false)
        return
      }

      // Validar que ambos os campos estão preenchidos
      if (!customerName.trim() || !customerPhone.trim()) {
        setError('Por favor, preencha seu nome completo e número de telefone.')
        setIsLoading(false)
        return
      }

      // Salvar pedido no sistema
      const orderData = {
        id: Date.now().toString(),
        userId: user?.id || `guest_${customerEmail || customerPhone.replace(/\D/g, '')}`,
        userName: customerName,
        userEmail: customerEmail,
        userPhone: customerPhone,
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        total: getTotal(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress
        }
      }

      console.log('Dados do pedido:', orderData)

      // Salvar pedido via API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      console.log('Resposta da API:', response.status)

      if (response.ok) {
        const savedOrder = await response.json()
        console.log('Pedido salvo:', savedOrder)
        
        // Salvar pedido no store local
        addOrder(savedOrder)

        // Enviar para WhatsApp
        const orderItems = items.map(item => 
          `${item.product.name} - Qtd: ${item.quantity} - R$ ${(item.product.price * item.quantity).toFixed(2)}`
        ).join('\n')

        const total = getTotal()
        const message = `🛒 *PEDIDO - ATACADÃO GUANABARA*

*Cliente:* ${customerName}
*Telefone:* ${customerPhone}

*Itens:*
${orderItems}

*Total: R$ ${total.toFixed(2)}*

Entregamos somente no Jardim Guanabara.

*Endereço de entrega:*
${customerAddress}

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
                  Entregamos somente no bairro Jardim Guanabara.
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
              {/* Total */}
              <div className="flex flex-col md:flex-row justify-between items-center border-t pt-8 gap-6 md:gap-0">
                <span className="text-2xl font-bold text-blue-900 tracking-wide">Total</span>
                <span className="text-4xl font-extrabold text-[#FF6600] drop-shadow">R$ {getTotal().toFixed(2)}</span>
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
  const [cep, setCep] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [name, setName] = useState(user?.name || '')
  
  // Máscara telefone
  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }
  // Máscara CEP
  function formatCep(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }
  // Validação email
  function isValidEmail(value: string) {
    return value.includes('@')
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
          <label className="font-semibold text-blue-900 text-sm">Endereço</label>
          <input 
            type="text" 
            name="address"
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base" 
            placeholder="Rua, número" 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">CEP</label>
          <input
            type="text"
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="60347-255"
            value={cep}
            onChange={e => setCep(formatCep(e.target.value))}
            maxLength={9}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Bairro</label>
          <input
            type="text"
            className="rounded-lg border border-gray-300 px-4 py-3 bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0 focus:border-gray-300 transition text-base"
            value="Jardim Guanabara"
            readOnly
          />
        </div>
      </div>
    </form>
  )
}
