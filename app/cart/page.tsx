'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Minus, Plus, MapPin, Phone, User, AlertCircle, Truck, Calculator, Heart, Star, CreditCard, Banknote, QrCode, ChevronDown } from 'lucide-react'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { useCartStore, useAuthStore, useOrderStore } from '@/lib/store'
import { shippingService } from '@/lib/shipping'
import { calculateDynamicPrice } from '@/lib/utils'
import type { Address, ShippingCalculation } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Helper para tratar endereço do usuário de forma segura
const getUserAddress = (user: any): Address => {
  if (!user) return {} as Address;
  
  // Se tem estrutura de endereço aninhada
  if (user.address && typeof user.address === 'object') {
    return user.address as Address;
  }
  
  // Se tem estrutura plana (usuários Google)
  return {
    street: user.address || user.street || '',
    number: user.number || '',
    complement: user.complement || '',
    neighborhood: user.neighborhood || '',
    city: user.city || '',
    state: user.state || 'Ceará',
    zipCode: user.zipCode || '',
    reference: user.reference || ''
  } as Address;
}

export default function CartPage() {
  const [showPaymentWarning, setShowPaymentWarning] = useState(false)
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const { addOrder } = useOrderStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shippingCalculation, setShippingCalculation] = useState<ShippingCalculation | null>(null)
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [showThankYouDialog, setShowThankYouDialog] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  // Função para detectar dispositivo móvel
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Função para redirecionamento do WhatsApp
  const redirectToWhatsApp = (message: string, phone: string = '5585985147067') => {
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    console.log('URL WhatsApp:', whatsappUrl);

    // Redirecionamento condicional baseado no dispositivo
    if (isMobileDevice()) {
      // Em dispositivos móveis, usar location.href para evitar bloqueio de pop-up
      window.location.href = whatsappUrl;
    } else {
      // Em desktop, tentar abrir em nova aba primeiro
      const newWindow = window.open(whatsappUrl, '_blank');
      // Fallback: se não conseguir abrir nova aba (pop-up bloqueado), redirecionar na mesma aba
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        window.location.href = whatsappUrl;
      }
    }
  }

  // Função para verificar se está dentro do horário de pedidos
  const isWithinOrderHours = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour < 16; // Aceita pedidos até 16:00 (4:00 PM)
  }

  // Função para obter mensagem de horário
  const getOrderTimeMessage = () => {
    if (isWithinOrderHours()) {
      return '📞 Pedidos aceitos até às 16h';
    }
    return '⏰ Pedidos encerrados - Horário: 8h às 16h';
  }
  
  // Estados para formulário
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'Ceará',
    zipCode: '',
    reference: '',
    pickupFirstName: '',
    pickupLastName: '',
    pickupPhone: '',
    pickupEmail: '',
    selectedBairro: '',
    paymentMethod: 'pix',
    wantsChange: false,
    changeFor: '',
    deliveryType: 'delivery'
  })
  
  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'debit' | 'credit' | 'cash'>('pix')
  const [wantsChange, setWantsChange] = useState(false)
  const [changeFor, setChangeFor] = useState<string>('')
  const [changeError, setChangeError] = useState<string | null>(null)
  
  // Entrega vs Retirada
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [deliveryEnabled, setDeliveryEnabled] = useState(true)
  
  const router = useRouter()
  const errorRef = useRef<HTMLDivElement>(null)

  // Bairros de Fortaleza
  const bairrosFortaleza = [
    { nome: 'Jardim Guanabara', preco: 5 },
    { nome: 'Vila Velha', preco: 5 },
    { nome: 'Quintino Cunha', preco: 7 },
    { nome: 'Olavo Oliveira', preco: 7 },
    { nome: 'Jardim Iracema', preco: 7 },
    { nome: 'Padre Andrade', preco: 10 },
    { nome: 'Floresta', preco: 10 },
    { nome: 'Presidente Kennedy', preco: 10 },
    { nome: 'Antonio Bezerra', preco: 10 },
    { nome: 'Barra do Ceara', preco: 10 },
    { nome: 'Cristo Redentor', preco: 15 },
    { nome: 'Alvaro Wayne', preco: 15 },
    { nome: 'Carlito', preco: 15 },
    { nome: 'Pirambu', preco: 15 },
    { nome: 'Monte Castelo', preco: 15 },
    { nome: 'Elery', preco: 15 },
    { nome: 'Alagadiço', preco: 15 },
    { nome: 'Parquelandia', preco: 15 },
    { nome: 'Parque Araxá', preco: 15 },
    { nome: 'Rodolgo Teofilo', preco: 15 },
    { nome: 'Amadeu Furtado', preco: 15 },
    { nome: 'Bela Vista', preco: 15 },
    { nome: 'Pici', preco: 15 },
    { nome: 'Dom Lustosa', preco: 15 },
    { nome: 'Autran Nunes', preco: 15 },
    { nome: 'Genibau', preco: 15 },
    { nome: 'Tabapuá', preco: 15 },
    { nome: 'Iparana', preco: 15 },
    { nome: 'Parque Albano', preco: 15 },
    { nome: 'Parque Leblon', preco: 15 },
    { nome: 'Jacarecanga', preco: 20 },
    { nome: 'Centro', preco: 20 },
    { nome: 'Moura brasil', preco: 20 },
    { nome: 'Farias Brito', preco: 20 },
    { nome: 'Benfica', preco: 20 },
    { nome: 'Damas', preco: 20 },
    { nome: 'Jardim America', preco: 20 },
    { nome: 'Bom Futuro', preco: 20 },
    { nome: 'Montese', preco: 20 },
    { nome: 'Pan Americano', preco: 20 },
    { nome: 'Couto Fernandes', preco: 20 },
    { nome: 'Democrito Rocha', preco: 20 },
    { nome: 'Joquei Clube', preco: 20 },
    { nome: 'Henrique Jorge', preco: 20 },
    { nome: 'Joao XXIII', preco: 20 },
    { nome: 'Conj Ceara', preco: 20 },
    { nome: 'Parangaba', preco: 20 },
    { nome: 'Itaoca', preco: 20 },
    { nome: 'Parque Soledade', preco: 25 } // Adicionado para Caucaia
  ];
  
  const [selectedBairro, setSelectedBairro] = useState(bairrosFortaleza[0].nome);
  const [bairroFrete, setBairroFrete] = useState(bairrosFortaleza[0].preco);
  const [showBairroDropdown, setShowBairroDropdown] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const lastUserId = useRef<string | null>(null);

  // Carregar configurações de entrega
  useEffect(() => {
    const loadDeliverySettings = async () => {
      try {
        const response = await fetch('/api/admin/delivery-config')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setDeliveryEnabled(data.data.deliveryEnabled)
            // Se a entrega está desabilitada, forçar modo retirada
            if (!data.data.deliveryEnabled) {
              setDeliveryType('pickup')
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de entrega:', error)
        // Em caso de erro, assumir que a entrega está habilitada
        setDeliveryEnabled(true)
      }
    }
    
    loadDeliverySettings()
  }, [])

  // Carregar dados do usuário ao montar o componente
  useEffect(() => {
    // Evitar reprocessamento se o usuário não mudou
    if (lastUserId.current === (user?.id || null)) {
      return;
    }
    
    setIsLoadingUserData(true);

    
    // Preencher com dados do usuário se estiver autenticado
    if (user) {
      
      // Usar apenas os dados do usuário do banco (users.json), não do localStorage
      const userData = user;
        
        // Tratar diferentes estruturas de endereço
        let addressData: {
          street: string;
          number: string;
          complement: string;
          neighborhood: string;
          city: string;
          state: string;
          zipCode: string;
          reference: string;
        } = {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: 'Ceará',
          zipCode: '',
          reference: ''
        };
        
        if (userData.address && typeof userData.address === 'object') {
          // Estrutura aninhada (padrão)
          addressData = {
            street: userData.address.street || '',
            number: userData.address.number || '',
            complement: userData.address.complement || '',
            neighborhood: userData.address.neighborhood || '',
            city: userData.address.city || '',
            state: userData.address.state || 'Ceará',
            zipCode: userData.address.zipCode || '',
            reference: userData.address.reference || ''
          };
        } else {
          // Estrutura plana (usuários Google do users.json)
          addressData = {
            street: (userData as any).address || (userData as any).street || '',
            number: (userData as any).number || '',
            complement: (userData as any).complement || '',
            neighborhood: (userData as any).neighborhood || '',
            city: (userData as any).city || '',
            state: 'Ceará',
            zipCode: (userData as any).zipCode || '',
            reference: (userData as any).reference || ''
          };
        }

        // Se o usuário tem bairro, usar o preço correspondente
        const neighborhoodName = addressData.neighborhood;
        
        if (neighborhoodName) {
          const bairroObj = bairrosFortaleza.find(b => b.nome === neighborhoodName);
          
          if (bairroObj) {
            setSelectedBairro(bairroObj.nome);
            setBairroFrete(bairroObj.preco);
            console.log('✅ Bairro definido automaticamente:', bairroObj.nome, 'R$', bairroObj.preco);
            // Atualizar também o formData para garantir consistência
            setFormData(prev => ({
              ...prev,
              name: userData.name || '',
              phone: userData.phone || '',
              email: userData.email || '',
              ...addressData,
              selectedBairro: bairroObj.nome
            }));
          } else {
            // Se o bairro não está na lista, usar o primeiro como padrão
            setSelectedBairro(bairrosFortaleza[0].nome);
            setBairroFrete(bairrosFortaleza[0].preco);
            setFormData(prev => ({
              ...prev,
              name: userData.name || '',
              phone: userData.phone || '',
              email: userData.email || '',
              ...addressData,
              selectedBairro: bairrosFortaleza[0].nome
            }));
          }
        } else {
          // Se não tem bairro definido, usar o primeiro como padrão
          setSelectedBairro(bairrosFortaleza[0].nome);
          setBairroFrete(bairrosFortaleza[0].preco);
          setFormData(prev => ({
            ...prev,
            name: userData.name || '',
            phone: userData.phone || '',
            email: userData.email || '',
            ...addressData,
            selectedBairro: bairrosFortaleza[0].nome
          }));
        }


    } else {
      // Se não há usuário logado, usar dados padrão
      setSelectedBairro(bairrosFortaleza[0].nome);
      setBairroFrete(bairrosFortaleza[0].preco);
    }
    
    // Carregar apenas configurações de pedido do localStorage (não dados pessoais)
    try {
      const savedData = localStorage.getItem('cartFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Carregar apenas configurações, não dados pessoais
        if (parsedData.paymentMethod) setPaymentMethod(parsedData.paymentMethod);
        if (typeof parsedData.wantsChange !== 'undefined') setWantsChange(!!parsedData.wantsChange);
        if (typeof parsedData.changeFor !== 'undefined') setChangeFor(String(parsedData.changeFor));
        if (parsedData.deliveryType) setDeliveryType(parsedData.deliveryType);
        
        // Só usar o bairro do localStorage se o usuário não está logado
        if (!user && parsedData.selectedBairro) {
          setSelectedBairro(parsedData.selectedBairro);
          const bairroObj = bairrosFortaleza.find(b => b.nome === parsedData.selectedBairro);
          setBairroFrete(bairroObj ? bairroObj.preco : bairrosFortaleza[0].preco);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do localStorage:', error);
    }
    
    // Atualizar referência do usuário
    lastUserId.current = user?.id || null;
    setIsLoadingUserData(false);
  }, [user?.id]);

  // Calcular frete automaticamente quando dados são carregados ou bairro é alterado
  useEffect(() => {
    if (deliveryType === 'delivery' && selectedBairro && formData.neighborhood) {
      const address: Address = {
        street: formData.street,
        number: formData.number,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        reference: formData.reference || undefined
      };
      
      // Delay para evitar múltiplas chamadas simultâneas
      const timer = setTimeout(() => {
        calculateShipping(address);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedBairro, formData.neighborhood, deliveryType]);

  // Salvar dados no localStorage quando mudar (apenas se não estiver carregando dados do usuário)
  useEffect(() => {
    if (!isLoadingUserData && !user) {
      // Só salvar no localStorage se não há usuário logado
      const saveData = {
        paymentMethod,
        wantsChange,
        changeFor,
        deliveryType,
        selectedBairro
      }
      localStorage.setItem('cartFormData', JSON.stringify(saveData))
    }
  }, [formData, paymentMethod, wantsChange, changeFor, deliveryType, selectedBairro, isLoadingUserData, user])

  // Atualizar dados do formulário
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => {
      // Só atualizar se o valor realmente mudou
      if ((prev as any)[field] === value) {
        return prev
      }
      return { ...prev, [field]: value }
    })
  }

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

  // Função para calcular tempo de entrega baseado no valor do frete
  const getDeliveryTime = (freightCost: number) => {
    if (freightCost >= 10) {
      return '3 a 5 horas'
    } else {
      return '2 a 3 horas'
    }
  }

  // Calcular frete
  const calculateShipping = async (address: Address) => {
    setIsCalculatingShipping(true)
    try {
      if (deliveryType === 'pickup') {
        // Retirada: não calcula frete, retorna custo zero
        const result = {
          distance: 0,
          duration: 0,
          cost: 0,
          estimatedDelivery: 'Retirada na loja',
          available: true
        }
        setShippingCalculation(result)
        return result
      } else {
        // Para entrega, sempre usar o bairro selecionado ou o bairro do endereço
        let bairroParaCalculo = selectedBairro
        
        // Se não tem bairro selecionado, tenta usar o bairro do endereço/formulário
        if (!bairroParaCalculo && (address.neighborhood || formData.neighborhood)) {
          const neighborhoodFromForm = address.neighborhood || formData.neighborhood
          const bairroObj = bairrosFortaleza.find(b => b.nome === neighborhoodFromForm)
          if (bairroObj) {
            bairroParaCalculo = bairroObj.nome
            setSelectedBairro(bairroObj.nome)
            setBairroFrete(bairroObj.preco)
          }
        }
        
        // Se ainda não tem bairro, usa o primeiro da lista como padrão
        if (!bairroParaCalculo) {
          bairroParaCalculo = bairrosFortaleza[0].nome
          setSelectedBairro(bairrosFortaleza[0].nome)
          setBairroFrete(bairrosFortaleza[0].preco)
        }
        
        // Calcular o frete baseado no bairro selecionado
        const bairroObj = bairrosFortaleza.find(b => b.nome === bairroParaCalculo)
        const custo = bairroObj ? bairroObj.preco : bairrosFortaleza[0].preco
        
        const result = {
          distance: 0,
          duration: 0,
          cost: custo,
          estimatedDelivery: getDeliveryTime(custo),
          available: true
        }
        
        setShippingCalculation(result)
        return result
      }
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

  const handleWhatsAppOrder = async () => {
    // Limpar erro anterior
    setError(null);

    // Verificar horário de pedidos
    if (!isWithinOrderHours()) {
      setError('Pedidos aceitos apenas até às 16h. Volte amanhã a partir das 8h!');
      return;
    }

    // Verificar se há itens no carrinho
    if (items.length === 0) {
      setError('Adicione produtos ao carrinho antes de finalizar o pedido.');
      return;
    }

    // Verificar valor mínimo de R$ 100
    const subtotal = getTotal();
    if (subtotal < 100) {
      setError(`Valor mínimo para pedido é R$ 100,00. Seu carrinho tem R$ ${subtotal.toFixed(2)}.`);
      return;
    }

    // Validação para retirada ou entrega
    if (deliveryType === 'delivery') {
      // Corrigido: verificar se o nome está preenchido independente de autenticação
      if (!formData.name.trim() && !user?.name) {
        setError('Nome é obrigatório para entrega.');
        return;
      }
      if (!formData.phone.trim() && !user?.phone) {
        setError('Telefone é obrigatório para entrega.');
        return;
      }
      // Validar endereço apenas para entrega
      const userAddr = getUserAddress(user);
      const addressFields = { 
        street: formData.street || userAddr.street || '',
        number: formData.number || userAddr.number || '',
        neighborhood: formData.neighborhood || userAddr.neighborhood || '',
        city: formData.city || userAddr.city || '',
        state: formData.state || userAddr.state || 'Ceará',
        zipCode: formData.zipCode || userAddr.zipCode || ''
      };
      const emptyFields = Object.entries(addressFields)
        .filter(([key, value]) => !value || !value.trim())
        .map(([key]) => key);
      if (emptyFields.length > 0) {
        const fieldNames = {
          street: 'Rua',
          number: 'Número',
          neighborhood: 'Bairro',
          city: 'Cidade',
          state: 'Estado',
          zipCode: 'CEP'
        };
        const missingFields = emptyFields.map(field => fieldNames[field as keyof typeof fieldNames]).join(', ');
        setError(`Preencha os campos obrigatórios: ${missingFields}`);
        return;
      }
    } else if (deliveryType === 'pickup') {
      // Corrigido: verificar se o nome está preenchido independente de autenticação
      if (!formData.pickupFirstName.trim() && !user?.name) {
        setError('Nome é obrigatório para retirada.');
        return;
      }
      if (!formData.pickupPhone.trim() && !user?.phone) {
        setError('Telefone é obrigatório para retirada.');
        return;
      }
    }

    setShowPaymentWarning(true);
  };

  const handlePaymentConfirmation = async () => {
    setIsLoading(true);
    setShowPaymentWarning(false);

    try {
      // Criar objeto de endereço
      const address: Address = {
        street: formData.street,
        number: formData.number,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        reference: formData.reference || undefined
      };

      // Calcular frete se ainda não foi calculado
      let shipping = shippingCalculation;
      if (!shipping && deliveryType === 'delivery') {
        shipping = await calculateShipping(address);
        if (!shipping) {
          setError('Erro ao calcular frete. Tente novamente.');
          setIsLoading(false);
          return;
        }
      } else if (deliveryType === 'pickup') {
        shipping = { distance: 0, duration: 0, cost: 0, estimatedDelivery: 'Retirada na loja', available: true }
      }

      const totalWithShipping = getTotal() + (shipping?.cost || 0);

      // Validações de pagamento (troco)
      if (paymentMethod === 'cash' && wantsChange) {
        const val = Number(changeFor || 0);
        if (!val || isNaN(val)) {
          setError('Informe o valor para troco.');
          setIsLoading(false);
          return;
        }
        if (val <= totalWithShipping) {
          setError(`O valor para troco deve ser maior que o total (R$ ${totalWithShipping.toFixed(2)}).`);
          setIsLoading(false);
          return;
        }
      }

      // Criar pedido
      let orderCustomerInfo;
      if (deliveryType === 'pickup') {
        orderCustomerInfo = {
          name: `${formData.pickupFirstName || user?.name || ''} ${formData.pickupLastName || ''}`.trim(),
          email: formData.pickupEmail || user?.email || '',
          phone: formData.pickupPhone || user?.phone || '',
          address: user?.address || {}
        };
      } else {
        const userAddr = getUserAddress(user);
        orderCustomerInfo = {
          name: formData.name || user?.name || '',
          email: formData.email || user?.email || '',
          phone: formData.phone || user?.phone || '',
          address: {
            street: formData.street || userAddr.street || '',
            number: formData.number || userAddr.number || '',
            complement: formData.complement || userAddr.complement || '',
            neighborhood: formData.neighborhood || userAddr.neighborhood || '',
            city: formData.city || userAddr.city || '',
            state: formData.state || userAddr.state || 'Ceará',
            zipCode: formData.zipCode || userAddr.zipCode || '',
            reference: formData.reference || userAddr.reference || ''
          }
        };
      }
      
      const order = {
        id: Date.now().toString(),
        items,
        total: totalWithShipping,
        customerInfo: orderCustomerInfo,
        status: 'pending' as const,
        createdAt: new Date(),
        estimatedDelivery: new Date(Date.now() + (shipping?.duration || 0) * 60 * 1000),
        shippingCost: shipping?.cost || 0,
        shippingDistance: shipping?.distance || 0
      };
      
      // Adicionar dados de retirada ao pedido se for pickup
      if (deliveryType === 'pickup') {
        (order as any).pickupInfo = {
          firstName: formData.pickupFirstName,
          lastName: formData.pickupLastName,
          phone: formData.pickupPhone,
          email: formData.pickupEmail
        };
      }

      // Adicionar pagamento ao pedido
      (order as any).payment = {
        method: paymentMethod,
        wantsChange,
        changeFor: paymentMethod === 'cash' && wantsChange ? Number(changeFor) : undefined
      };

      // Salvar pedido na API


      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });



      if (response.ok) {
        const responseText = await response.text();
        console.log('📄 Resposta completa:', responseText);

        let savedOrder;
        try {
          savedOrder = JSON.parse(responseText);
          console.log('✅ Pedido salvo:', savedOrder);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta:', parseError);
          setError('Erro ao processar resposta do servidor');
          setIsLoading(false);
          return;
        }

        // Salvar pedido no store local
        addOrder(savedOrder.order || savedOrder);

        // Armazenar ID do pedido para redirecionamento e acesso no menu
        setOrderId(savedOrder.order?.id || savedOrder.id);
        try {
          localStorage.setItem('lastOrderId', String(savedOrder.order?.id || savedOrder.id));
        } catch {}

        // Enviar para WhatsApp
        console.log('📝 Dados para WhatsApp:', {
          formData,
          user,
          selectedBairro,
          deliveryType
        });
        
        const orderItems = items.map(item => 
          `• ${item.product.name}  x${item.quantity} — R$ ${(calculateDynamicPrice(item.product, item.quantity) * item.quantity).toFixed(2)}`
        ).join('\n');

        let message = '';
        if (deliveryType === 'pickup') {
          // Garantir que os dados sejam puxados corretamente para retirada
          const pickupFirstName = formData.pickupFirstName || user?.name?.split(' ')[0] || '';
          const pickupLastName = formData.pickupLastName || user?.name?.split(' ').slice(1).join(' ') || '';
          const pickupPhone = formData.pickupPhone || user?.phone || '';
          const pickupEmail = formData.pickupEmail || user?.email || '';
          
          message = [
            '🧾 *PEDIDO PARA RETIRADA NA LOJA*',
            '',
            `👤 Cliente: ${pickupFirstName} ${pickupLastName}`,
            `📞 Telefone: ${pickupPhone}`,
            pickupEmail ? `📧 Email: ${pickupEmail}` : null,
            '',
            '*🛍️ Itens do pedido:*',
            orderItems,
            '',
            `*Subtotal:* R$ ${getTotal().toFixed(2)}`,
            '',
            '*💳 Forma de pagamento:*',
            `Método: ${paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'debit' ? 'Cartão de Débito' : paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Dinheiro'}`,
            paymentMethod === 'cash' && wantsChange ? `Troco para: R$ ${Number(changeFor).toFixed(2)}` : '',
            '',
            '*🏬 Retirada na Loja*',
            'Endereço: R. Antônio Arruda, 1170 - Vila Velha, Fortaleza - CE',
            'Horário de funcionamento: Segunda a Sábado: 8h às 19h | Domingo: 8h às 12h | Delivery: 8h às 16h',
            'Telefone da loja: (85) 98514-7067',
            '',
            'Por favor, aguarde a confirmação do pedido antes de ir à loja.',
            '',
            'Obrigado por escolher o Atacadão Guanabara! 🙏✨'
          ].filter(Boolean).join('\n');
        } else {
          const payLabel = paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'debit' ? 'Cartão de Débito' : paymentMethod === 'credit' ? 'Cartão de Crédito' : 'Dinheiro';
          const changeLine = paymentMethod === 'cash' && wantsChange ? `\nTroco para: R$ ${Number(changeFor).toFixed(2)}` : '';
          
          // Garantir que os dados sejam puxados corretamente
          const customerName = formData.name || user?.name || '';
          const customerPhone = formData.phone || user?.phone || '';
          const customerEmail = formData.email || user?.email || '';
          
          // Construir endereço completo considerando diferentes formatos
          const userAddr = getUserAddress(user);
          const deliveryStreet = formData.street || userAddr.street || (typeof user?.address === 'string' ? user.address : '') || '';
          const deliveryNumber = formData.number || userAddr.number || '';
          const deliveryComplement = formData.complement || userAddr.complement || '';
          const deliveryNeighborhood = formData.neighborhood || userAddr.neighborhood || user?.neighborhood || selectedBairro || '';
          const deliveryCity = formData.city || userAddr.city || user?.city || 'Fortaleza';
          const deliveryState = formData.state || userAddr.state || 'CE';
          const deliveryZipCode = formData.zipCode || userAddr.zipCode || user?.zipCode || '';
          const deliveryReference = formData.reference || userAddr.reference || '';
          
          console.log('📍 Endereço montado:', {
            deliveryStreet,
            deliveryNumber,
            deliveryComplement,
            deliveryNeighborhood,
            deliveryCity,
            deliveryState,
            deliveryZipCode,
            deliveryReference
          });
          
          message = [
            '🧾 *PEDIDO PARA ENTREGA EM DOMICÍLIO*',
            '',
            `👤 Cliente: ${customerName}`,
            `📞 Telefone: ${customerPhone}`,
            customerEmail ? `📧 Email: ${customerEmail}` : null,
            '',
            '*📍 Endereço de entrega:*',
            `${deliveryStreet}${deliveryNumber ? `, ${deliveryNumber}` : ''}${deliveryComplement ? ` - ${deliveryComplement}` : ''}`,
            `${deliveryNeighborhood}, ${deliveryCity} - ${deliveryState}`,
            deliveryZipCode ? `CEP: ${deliveryZipCode}` : null,
            deliveryReference ? `Referência: ${deliveryReference}` : null,
            '',
            '*🛍️ Itens do pedido:*',
            orderItems,
            '',
            `*Subtotal:* R$ ${getTotal().toFixed(2)}`,
            `*Frete (${selectedBairro}):* R$ ${shipping?.cost.toFixed(2) || '0.00'}`,
            `*Total:* R$ ${totalWithShipping.toFixed(2)}`,
            '',
            '*💳 Forma de pagamento:*',
            `Método: ${payLabel}${changeLine}`,
            '',
            '*🚚 Informações da entrega:*',
            `Tempo estimado: ${shipping?.estimatedDelivery || 'A combinar'}`,
            '',
            'Por favor, aguarde a confirmação do pedido e o contato do entregador.',
            '',
            'Obrigado por comprar no Atacadão Guanabara! 🙏✨'
          ].filter(Boolean).join('\n');
        }

        // Salvar mensagem no localStorage para botão de fallback
        try {
          localStorage.setItem('lastWhatsAppMessage', message);
        } catch {}

        // Usar função centralizada de redirecionamento com número fixo
        redirectToWhatsApp(message, '5585985147067');

        // Limpar carrinho
        clearCart();

        // Mostrar popup de agradecimento
        setShowThankYouDialog(true);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro na API:', response.status, errorText);
        setError(`Erro ao salvar pedido: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Erro completo:', error);
      setError('Erro ao processar pedido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Validação de nome: não pode ter números
  function isValidName(value: string) {
    return /^[A-Za-zÀ-ú\s]+$/.test(value.trim())
  }

  // Validação de telefone: só números e tamanho 10 ou 11
  function isValidPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    return numbers.length >= 10 && numbers.length <= 11
  }

  // Validação email
  function isValidEmail(value: string) {
    return value.includes('@') || value === ''
  }

  // Componente para seleção de bairro com dropdown estilizado
  const BairroDropdown = () => {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowBairroDropdown(!showBairroDropdown)}
          className="w-full flex justify-between items-center rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
        >
          <span>{selectedBairro} (R$ {bairroFrete.toFixed(2)})</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${showBairroDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showBairroDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {bairrosFortaleza.map((bairro) => (
              <button
                key={bairro.nome}
                type="button"
                onClick={() => {
                  setSelectedBairro(bairro.nome);
                  setBairroFrete(bairro.preco);
                  setShowBairroDropdown(false);
                  updateFormData('neighborhood', bairro.nome);
                  updateFormData('selectedBairro', bairro.nome);
                  
                  // Recalcular frete automaticamente
                  if (deliveryType === 'delivery') {
                    const address: Address = {
                      street: formData.street,
                      number: formData.number,
                      complement: formData.complement || undefined,
                      neighborhood: bairro.nome,
                      city: formData.city,
                      state: formData.state,
                      zipCode: formData.zipCode,
                      reference: formData.reference || undefined
                    };
                    calculateShipping(address);
                  }
                }}
                className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors ${
                  selectedBairro === bairro.nome ? 'bg-orange-100 text-orange-700 font-medium' : ''
                }`}
              >
                {bairro.nome} (R$ {bairro.preco.toFixed(2)})
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={showPaymentWarning} onOpenChange={setShowPaymentWarning}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 mb-4">
              Atenção!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-700 font-semibold">
              Não pague antecipadamente!<br />
              Realize o pagamento <strong>apenas após receber o cupom</strong> e a confirmação do pedido.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <div className="w-full mb-4">
                <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  Não pague antecipadamente! Aguarde o cupom e confirmação do pedido.
                </div>
              </div>
              <Button 
                onClick={handlePaymentConfirmation}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                OK, Entendi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
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
                
                {/* Aviso de horário de pedidos */}
                <div className={`rounded-lg p-3 text-center text-sm border ${
                  isWithinOrderHours() 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}>
                  {getOrderTimeMessage()}
                </div>

                {items.length === 0 ? (
                  <div className="text-center text-gray-400 py-20">
                    <span className="text-7xl block mb-6">🛒</span>
                    <p className="text-2xl font-semibold">Seu carrinho está vazio</p>
                    <a href="/catalog" className="mt-8 inline-block px-8 py-3 bg-[#FF6600] text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition text-lg">Ver Produtos</a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {items.map(item => (
                      <div key={item.product.id} className="bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl shadow-xl p-4 border border-orange-100">
                        {/* Layout para mobile - empilhado */}
                        <div className="flex flex-col sm:flex-row gap-4">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-40 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-blue-200 shadow-md flex-shrink-0" />
                          
                          <div className="flex-1 flex flex-col gap-2 min-w-0">
                            <div className="font-bold text-gray-900 text-base md:text-xl leading-tight mb-2">{item.product.name}</div>
                            <div className="text-gray-600 text-sm md:text-base mb-2">
                              {(item.product as any).isWeightProduct || (item.product as any).weightInGrams ? (
                                <span>
                                  Peso: <span className="font-semibold text-blue-700 text-base md:text-lg">
                                    {(item.product as any).unit || 
                                     ((item.product as any).weightInGrams >= 1000 
                                       ? `${((item.product as any).weightInGrams / 1000).toFixed((item.product as any).weightInGrams % 1000 === 0 ? 0 : 1)}kg`
                                       : `${(item.product as any).weightInGrams}g`
                                     )
                                    }
                                  </span>
                                </span>
                              ) : (
                                <span>
                                  Quantidade: <span className="font-semibold text-blue-700 text-base md:text-lg">{item.quantity} unidade(s)</span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center mb-2">
                              <span className="text-[#FF6600] font-extrabold text-lg md:text-2xl">
                                R$ {((calculateDynamicPrice(item.product, item.quantity)) * (Number(item.quantity) || 0)).toFixed(2)}
                              </span>
                              <div className="flex gap-2 text-xs">
                                <span className="text-blue-600 font-semibold">
                                  Preço 1: R$ {item.product.price?.toFixed(2)}
                                </span>
                                <span className="text-green-600 font-semibold">
                                  Preço 2: R$ {
                                    item.product.prices?.price2 && item.product.prices.price2 > 0
                                      ? item.product.prices.price2.toFixed(2)
                                      : item.product.varejoFacilData?.precos?.precoVenda2 && item.product.varejoFacilData.precos.precoVenda2 > 0
                                        ? item.product.varejoFacilData.precos.precoVenda2.toFixed(2)
                                        : item.product.price?.toFixed(2)
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-500 text-xs md:text-sm mb-3">
                              Preço unitário: R$ {calculateDynamicPrice(item.product, item.quantity).toFixed(2)}
                            </div>
                            
                            {/* Controles de quantidade/peso - diferenciados para produtos de peso */}
                            <div className="flex flex-row justify-between items-center">
                              {(item.product as any).isWeightProduct || (item.product as any).weightInGrams ? (
                                <div className="flex flex-col gap-2">
                                  <div className="text-xs text-gray-500">Produto de peso (não alterável no carrinho)</div>
                                  <div className="flex flex-row gap-2 items-center">
                                    <span className="font-bold text-base px-3 py-2 bg-orange-100 rounded-lg min-w-[80px] text-center text-orange-600">
                                      {(item.product as any).unit || 
                                       ((item.product as any).weightInGrams >= 1000 
                                         ? `${((item.product as any).weightInGrams / 1000).toFixed((item.product as any).weightInGrams % 1000 === 0 ? 0 : 1)}kg`
                                         : `${(item.product as any).weightInGrams}g`
                                       )
                                      }
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Para alterar o peso, remova este item e adicione novamente com o peso desejado
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-row gap-2 items-center">
                                  <button 
                                    onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))} 
                                    className="text-blue-600 hover:text-white hover:bg-blue-600 p-2 rounded-full bg-blue-50 shadow-lg transition-all border border-blue-200 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="font-bold text-base px-3 py-2 bg-gray-100 rounded-lg min-w-[50px] text-center">
                                    {item.quantity}
                                  </span>
                                  <button 
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)} 
                                    className="text-green-600 hover:text-white hover:bg-green-600 p-2 rounded-full bg-green-50 shadow-lg transition-all border border-green-200 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                              
                              {/* Botão remover */}
                              <button 
                                onClick={() => removeItem(item.product.id)} 
                                className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-full bg-red-50 shadow-lg transition-all border border-red-200 active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
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
                          : `Valor mínimo: R$ 100,00. Seu carrinho tem R$ ${getTotal().toFixed(2)}.`
                        }
                      </span>
                    </div>
                  </div>



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
                        if (deliveryEnabled) {
                          setDeliveryType('delivery')
                        }
                      }}
                      disabled={!deliveryEnabled}
                      className={`p-4 rounded-lg border-2 transition-all relative ${
                        !deliveryEnabled
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : deliveryType === 'delivery'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center flex-col">
                        <div className="relative">
                          <Truck className="w-8 h-8 mb-2" />
                          {!deliveryEnabled && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                <span className="text-xs font-bold">✕</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="font-semibold">Entrega em Casa</span>
                        <span className="text-sm">
                          {deliveryEnabled ? 'Receba no seu endereço' : 'Temporariamente indisponível'}
                        </span>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryType('pickup')
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

                {/* Formulário de dados do cliente */}
                <FormCart 
                  user={user} 
                  deliveryType={deliveryType} 
                  selectedBairro={selectedBairro}
                  setSelectedBairro={setSelectedBairro}
                  bairroFrete={bairroFrete}
                  setBairroFrete={setBairroFrete}
                  bairrosFortaleza={bairrosFortaleza}
                  BairroDropdown={BairroDropdown}
                  updateFormData={updateFormData}
                />
              
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
                        neighborhood: selectedBairro || formData.neighborhood || '',
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
                      <span className="text-gray-600">Tempo estimado:</span>
                      <span className="font-semibold">{shippingCalculation.estimatedDelivery}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      {deliveryType === 'delivery' && (
                        <>
                          <span className="text-gray-600">Custo do frete:</span>
                          <span className={`font-semibold ${shippingCalculation.cost === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {shippingCalculation.cost === 0 ? 'GRÁTIS' : `R$ ${shippingCalculation.cost.toFixed(2)}`}
                          </span>
                        </>
                      )}
                    </div>
                    {!shippingCalculation.available && (
                      deliveryType === 'delivery' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-700 text-sm">Desculpe, não entregamos neste endereço.</p>
                        </div>
                      )
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
                      onChange={() => { setPaymentMethod('pix'); updateFormData('paymentMethod', 'pix'); updateFormData('wantsChange', false); updateFormData('changeFor', '') }}
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
                      onChange={() => { setPaymentMethod('debit'); updateFormData('paymentMethod', 'debit'); updateFormData('wantsChange', false); updateFormData('changeFor', '') }}
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
                      onChange={() => { setPaymentMethod('credit'); updateFormData('paymentMethod', 'credit'); updateFormData('wantsChange', false); updateFormData('changeFor', '') }}
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
                      onChange={() => { setPaymentMethod('cash'); updateFormData('paymentMethod', 'cash') }}
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
                        onChange={(e) => { setWantsChange(e.target.checked); updateFormData('wantsChange', e.target.checked) }}
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
                            onChange={(e) => { setChangeFor(e.target.value); updateFormData('changeFor', e.target.value) }}
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
                disabled={isLoading || getTotal() < 100 || (paymentMethod==='cash' && wantsChange && !!changeError) || !isWithinOrderHours()}
                className={`w-full py-5 px-10 rounded-2xl font-extrabold transition-colors flex items-center justify-center gap-3 text-2xl shadow-2xl border-2 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  isLoading || getTotal() < 100 || (paymentMethod==='cash' && wantsChange && !!changeError) || !isWithinOrderHours()
                    ? 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed'
                    : 'bg-[#25D366] text-white hover:bg-[#1ebe57] border-[#25D366]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    <span>Processando...</span>
                  </>
                ) : !isWithinOrderHours() ? (
                  <>
                    <span>Horário de pedidos encerrado</span>
                  </>
                ) : getTotal() < 100 ? (
                  <>
                    <span>Valor mínimo: R$ 100,00</span>
                  </>
                ) : (
                  <>
                    <span>Finalizar no WhatsApp</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-2">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.372.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488z"/>
                    </svg>
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
            
            {/* Botão de fallback para WhatsApp */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-700 mb-2">
                Não foi redirecionado automaticamente? Clique no botão abaixo:
              </p>
              <Button 
                onClick={() => {
                  // Usar a função centralizada de redirecionamento
                  const lastMessage = localStorage.getItem('lastWhatsAppMessage') || 'Olá! Gostaria de finalizar meu pedido.';
                  redirectToWhatsApp(lastMessage, '5585985147067');
                }}
                className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="currentColor"/>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.372.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/>
                </svg>
                Abrir WhatsApp
              </Button>
            </div>
            
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
    </>
  )
}

// Formulário com máscaras e validação
function FormCart({ 
  user, 
  deliveryType, 
  selectedBairro, 
  setSelectedBairro, 
  bairroFrete, 
  setBairroFrete, 
  bairrosFortaleza, 
  BairroDropdown, 
  updateFormData
}: { 
  user: any, 
  deliveryType: 'delivery' | 'pickup',
  selectedBairro: string,
  setSelectedBairro: (bairro: string) => void,
  bairroFrete: number,
  setBairroFrete: (frete: number) => void,
  bairrosFortaleza: any[],
  BairroDropdown: any,
  updateFormData: (field: string, value: any) => void
}) {
  // Validação de nome: não pode ter números
  function isValidName(value: string) {
    return /^[A-Za-zÀ-ú\s]+$/.test(value.trim())
  }

  // Validação de telefone: só números e tamanho 10 ou 11
  function isValidPhone(value: string) {
    const numbers = value.replace(/\D/g, '')
    return numbers.length >= 10 && numbers.length <= 11
  }
  const [phone, setPhone] = useState(user?.phone || '')
  const [zipCode, setZipCode] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [isSearchingCep, setIsSearchingCep] = useState(false)
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
  const [isLoadingFormData, setIsLoadingFormData] = useState(false)
  const lastLoadedUserId = useRef<string | null>(null)

  // Carregar dados apenas quando o usuário muda (evitar loops com formData)
  useEffect(() => {
    const currentUserId = user?.id || null
    
    // Só reprocessar se o usuário mudou
    if (currentUserId === lastLoadedUserId.current) {
      return
    }
    

    setIsLoadingFormData(true);
    // Carregar apenas do localStorage se não há usuário, senão usar dados do usuário
    let savedData: any = {};
    
    if (!user) {
      const localStorageData = localStorage.getItem('cartFormData');
      if (localStorageData) {
        try {
          savedData = JSON.parse(localStorageData);
        } catch (error) {
          console.error('Erro ao carregar dados do formulário:', error);
        }
      }
    }
    
    // Prioridade: dados do usuário > localStorage (apenas se não há usuário)
    const userAddr = getUserAddress(user);
    setName(user?.name || savedData.name || '');
    setPhone(user?.phone || savedData.phone || '');
    setEmail(user?.email || savedData.email || '');
    setStreet(userAddr.street || savedData.street || '');
    setNumber(userAddr.number || savedData.number || '');
    setComplement(userAddr.complement || savedData.complement || '');
    setNeighborhood(userAddr.neighborhood || savedData.neighborhood || bairrosFortaleza[0].nome);
    setCity(userAddr.city || savedData.city || '');
    setState(userAddr.state || savedData.state || 'Ceará');
    setZipCode(userAddr.zipCode || savedData.zipCode || '');
    setReference(userAddr.reference || savedData.reference || '');
    
    // Para campos de retirada, pré-preencher com dados do usuário se não houver dados salvos
    if (user?.name && !savedData.pickupFirstName) {
      const nameParts = user.name.split(' ')
      setPickupFirstName(nameParts[0] || '')
      setPickupLastName(nameParts.slice(1).join(' ') || '')
    } else {
      setPickupFirstName(savedData.pickupFirstName || '');
      setPickupLastName(savedData.pickupLastName || '');
    }
    
    setPickupPhone(user?.phone || savedData.pickupPhone || '');
    setPickupEmail(user?.email || savedData.pickupEmail || '');
    
    // Configurar bairro se houver dados do usuário
    if (userAddr.neighborhood) {
      const bairroObj = bairrosFortaleza.find(b => b.nome === userAddr.neighborhood);
      if (bairroObj) {
        setSelectedBairro(bairroObj.nome);
        setBairroFrete(bairroObj.preco);
      }
    }
    
    // Atualizar referência do usuário
    lastLoadedUserId.current = currentUserId;
    setIsLoadingFormData(false);
  }, [user?.id]);
  
  // Salvar dados no localStorage quando mudar (apenas se não estiver carregando e não há usuário logado)
  useEffect(() => {
    if (!isLoadingFormData && !user) {
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
        pickupEmail,
        selectedBairro
      }
      localStorage.setItem('cartFormData', JSON.stringify(formData))
    }
  }, [name, phone, email, street, number, complement, neighborhood, city, state, zipCode, reference, pickupFirstName, pickupLastName, pickupPhone, pickupEmail, selectedBairro, isLoadingFormData, user])
  
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
  
  // Buscar endereço por CEP automaticamente
  const searchAddressByCep = async (cep: string) => {
    const cleanZipCode = cep.replace(/\D/g, '')
    if (cleanZipCode.length === 8) {
      setIsSearchingCep(true)
      try {
        const response = await fetch(`/api/shipping/zipcode/${cleanZipCode}`)
        if (response.ok) {
          const addressData = await response.json()
          
          // Sobrescrever todos os dados (exceto estado que permanece inalterado)
          if (addressData.street) {
            setStreet(addressData.street)
            updateFormData('street', addressData.street)
          }
          if (addressData.neighborhood) {
            setNeighborhood(addressData.neighborhood)
            updateFormData('neighborhood', addressData.neighborhood)
          }
          if (addressData.city) {
            setCity(addressData.city)
            updateFormData('city', addressData.city)
          }
          // Não alterar o estado - mantém o que já está preenchido
          
          // Tentar extrair número da rua se disponível
          if (addressData.street) {
            const streetText = addressData.street
            // Buscar padrões de número na rua (ex: "Rua das Flores, 123" ou "Av. Brasil 456")
            const numberMatch = streetText.match(/,?\s*(\d+)\s*$|(\d+)\s*(?:,|$)/)
            if (numberMatch && (numberMatch[1] || numberMatch[2])) {
              const extractedNumber = numberMatch[1] || numberMatch[2]
              setNumber(extractedNumber)
              updateFormData('number', extractedNumber)
              
              // Remover o número da rua para deixar só o endereço
              const cleanStreet = streetText.replace(/,?\s*\d+\s*$/, '').replace(/\d+\s*,?\s*$/, '').trim()
              setStreet(cleanStreet)
              updateFormData('street', cleanStreet)
              
              console.log('✅ Número extraído da rua:', extractedNumber)
            }
          }
          
          // Se a API retornar número diretamente (caso exista essa propriedade)
          if (addressData.number) {
            setNumber(addressData.number)
            updateFormData('number', addressData.number)
          }
          
          // Função para normalizar strings (remover acentos e caracteres especiais)
          const normalizeString = (str: string) => {
            return str
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '') // Remove acentos
              .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
              .trim()
          }
          
          // Verificar se o bairro retornado está na lista de bairros disponíveis
          if (addressData.neighborhood) {
            const normalizedAPIBairro = normalizeString(addressData.neighborhood)
            
            // Primeira tentativa: match exato normalizado
            let bairroEncontrado = bairrosFortaleza.find(bairro => 
              normalizeString(bairro.nome) === normalizedAPIBairro
            )
            
            // Segunda tentativa: match parcial com palavras-chave
            if (!bairroEncontrado) {
              const palavrasAPI = normalizedAPIBairro.split(' ').filter(p => p.length > 2)
              
              bairroEncontrado = bairrosFortaleza.find(bairro => {
                const normalizedBairro = normalizeString(bairro.nome)
                const palavrasBairro = normalizedBairro.split(' ')
                
                // Verifica se alguma palavra-chave da API está no nome do bairro
                return palavrasAPI.some(palavraAPI => 
                  palavrasBairro.some(palavraBairro => 
                    palavraBairro.includes(palavraAPI) || palavraAPI.includes(palavraBairro)
                  )
                )
              })
            }
            
            if (bairroEncontrado) {
              setSelectedBairro(bairroEncontrado.nome)
              setBairroFrete(bairroEncontrado.preco)
              console.log('✅ Bairro encontrado automaticamente:', bairroEncontrado.nome)
            } else {
              console.log('❌ Bairro não encontrado na lista:', addressData.neighborhood)
            }
          }
          
          console.log('✅ Endereço preenchido automaticamente via CEP')
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setIsSearchingCep(false)
      }
    }
  }

  // Buscar endereço por CEP com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const cleanZipCode = zipCode.replace(/\D/g, '')
      if (cleanZipCode.length === 8) {
        searchAddressByCep(zipCode)
      }
    }, 1000) // 1 segundo de delay para não fazer muitas requisições

    return () => clearTimeout(timer)
  }, [zipCode])

  // Função para busca manual (quando o usuário pressiona Enter ou sai do campo)
  const handleZipCodeBlur = () => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    if (cleanZipCode.length === 8) {
      searchAddressByCep(zipCode)
    }
  }

  // Função para busca quando pressiona Enter
  const handleZipCodeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cleanZipCode = zipCode.replace(/\D/g, '')
      if (cleanZipCode.length === 8) {
        searchAddressByCep(zipCode)
      }
    }
  }
  
  return (
    <form className="flex flex-col gap-5 bg-blue-50 rounded-xl p-6 border border-blue-100 shadow-md">
      {/* Validações globais */}
      {deliveryType === 'delivery' && name && !isValidName(name) && (
        <span className="text-xs text-red-500 mb-2">Digite um nome válido (sem números).</span>
      )}
      {deliveryType === 'delivery' && phone && !isValidPhone(phone) && (
        <span className="text-xs text-red-500 mb-2">Digite um telefone válido.</span>
      )}
      {deliveryType === 'pickup' && pickupFirstName && !isValidName(pickupFirstName) && (
        <span className="text-xs text-red-500 mb-2">Digite um nome válido (sem números).</span>
      )}
      {deliveryType === 'pickup' && pickupLastName && !isValidName(pickupLastName) && (
        <span className="text-xs text-red-500 mb-2">Digite um sobrenome válido (sem números).</span>
      )}
      {deliveryType === 'pickup' && pickupPhone && !isValidPhone(pickupPhone) && (
        <span className="text-xs text-red-500 mb-2">Digite um telefone válido.</span>
      )}
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
              onChange={(e) => {
                setPickupFirstName(e.target.value);
                updateFormData('pickupFirstName', e.target.value);
              }}
              className={`rounded-lg border px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition text-base ${pickupFirstName && !isValidName(pickupFirstName) ? 'border-red-400' : 'border-gray-300'}`}
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
              onChange={(e) => {
                setPickupLastName(e.target.value);
                updateFormData('pickupLastName', e.target.value);
              }}
              className={`rounded-lg border px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition text-base ${pickupLastName && !isValidName(pickupLastName) ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Seu sobrenome" 
              required 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-blue-900 text-sm">Telefone *</label>
            <input
              type="tel"
              name="pickupPhone"
              className={`rounded-lg border px-4 py-3 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition text-base ${pickupPhone && !isValidPhone(pickupPhone) ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="(85) 99999-9999"
              value={pickupPhone}
              onChange={e => {
                setPickupPhone(formatPhone(e.target.value));
                updateFormData('pickupPhone', formatPhone(e.target.value));
              }}
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
              onChange={e => {
                setPickupEmail(e.target.value);
                updateFormData('pickupEmail', e.target.value);
              }}
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
              <p><strong>Endereço:</strong> R. Antônio Arruda, 1170 - Vila velha, Fortaleza - CE</p>
              <p><strong>Horário:</strong> Segunda a Sábado: 8h às 19h | Domingo: 8h às 12h | Delivery: 8h às 16h</p>
              <p><strong>Telefone:</strong> (85) 98514-7067</p>
              <p className="text-xs mt-2 text-green-600">
                
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
            onChange={(e) => {
              setName(e.target.value);
              updateFormData('name', e.target.value);
            }}
            className={`rounded-lg border px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base ${name && !isValidName(name) ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Seu nome completo" 
            required 
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Telefone *</label>
          <input
            type="tel"
            name="phone"
            className={`rounded-lg border px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base ${phone && !isValidPhone(phone) ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="(85) 99999-9999"
            value={phone}
            onChange={e => {
              setPhone(formatPhone(e.target.value));
              updateFormData('phone', formatPhone(e.target.value));
            }}
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
            onChange={e => {
              setEmail(e.target.value);
              updateFormData('email', e.target.value);
            }}
          />
          {email && !isValidEmail(email) && (
            <span className="text-xs text-red-500 mt-1">Digite um e-mail válido com @</span>
          )}
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-blue-900 text-sm">CEP *</label>
          <div className="relative">
            <input
              type="text"
              name="zipCode"
              className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base w-full"
              placeholder="00000-000"
              value={zipCode}
              onChange={e => {
                setZipCode(formatZipCode(e.target.value));
                updateFormData('zipCode', formatZipCode(e.target.value));
              }}
              onBlur={handleZipCodeBlur}
              onKeyPress={handleZipCodeKeyPress}
              maxLength={9}
              required
            />
            {isSearchingCep && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {zipCode && zipCode.replace(/\D/g, '').length === 8 && !isSearchingCep && (
            <span className="text-xs text-green-600">✓ Preenchimento automático ativo</span>
          )}
        </div>
        {/* Select de bairro com preço de frete */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-blue-900 text-sm">Bairro *</label>
          <BairroDropdown />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-semibold text-blue-900 text-sm">Rua/Avenida *</label>
          <input 
            type="text" 
            name="street"
            value={street}
            onChange={e => {
              setStreet(e.target.value);
              updateFormData('street', e.target.value);
            }}
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
            onChange={e => {
              setNumber(e.target.value);
              updateFormData('number', e.target.value);
            }}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="123"
            required
          />
          <span className="text-xs text-gray-500">Informe o número da casa/apartamento</span>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Complemento</label>
          <input
            type="text"
            name="complement"
            value={complement}
            onChange={e => {
              setComplement(e.target.value);
              updateFormData('complement', e.target.value);
            }}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="Apto, bloco, etc."
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-blue-900 text-sm">Cidade *</label>
          <input
            type="text"
            name="city"
            value={city}
            onChange={e => {
              setCity(e.target.value);
              updateFormData('city', e.target.value);
            }}
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
            onChange={e => {
              setReference(e.target.value);
              updateFormData('reference', e.target.value);
            }}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base"
            placeholder="Próximo ao mercado, farmácia, etc."
          />
        </div>
        </div>
      )}
    </form>
  )
}