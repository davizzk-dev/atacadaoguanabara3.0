import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para tratar erros de conexão de forma mais elegante
export function handleConnectionError(error: any, context: string = 'API') {
  // Verificar se é um erro de conexão recusada
  if (error?.code === 'ECONNREFUSED' || 
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('ECONNREFUSED')) {
    
    // Durante o build, não logar esses erros para não poluir o console
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      return {
        error: 'Sistema temporariamente indisponível',
        isConnectionError: true
      }
    }
    
    console.warn(`⚠️ ${context}: Sistema Java não está rodando (isso é normal se o backend não estiver ativo)`)
    return {
      error: 'Sistema temporariamente indisponível',
      isConnectionError: true
    }
  }
  
  // Para outros tipos de erro, logar normalmente
  console.error(`❌ ${context}:`, error)
  return {
    error: 'Erro interno do servidor',
    isConnectionError: false
  }
}

// Função para verificar se estamos em modo de build
export function isBuildMode() {
  return process.env.NODE_ENV === 'production' && typeof window === 'undefined'
}

// Função para fazer fetch com tratamento de erro melhorado
export async function safeFetch(url: string, options?: RequestInit) {
  try {
    // Durante o build, retornar dados mockados para evitar erros
    if (isBuildMode()) {
      console.log(`🔧 Build mode: Mockando resposta para ${url}`)
      return {
        ok: true,
        json: async () => ({}),
        status: 200
      } as Response
    }
    
    const response = await fetch(url, options)
    return response
  } catch (error) {
    const errorInfo = handleConnectionError(error, `Fetch para ${url}`)
    throw new Error(errorInfo.error)
  }
}

// Funções utilitárias para geração de PDFs
// Versão simplificada e robusta

export async function generateSalesReportPDF(data: {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalProducts: number
  promotions: any[]
  orders?: any[]
}) {
  try {
    // Importação dinâmica com fallback
    let jsPDF
    try {
      const module = await import('jspdf')
      jsPDF = module.default
    } catch (error) {
      console.error('Erro ao importar jsPDF:', error)
      throw new Error('Biblioteca PDF não disponível')
    }

    const doc = new jsPDF()
    
    // Cabeçalho simples e robusto
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', 105, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Vendas', 105, 30, { align: 'center' })
    
    // Informações básicas
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50)
    doc.text(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`, 20, 60)
    
    // Estatísticas
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('RESUMO:', 20, 80)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Total de Pedidos: ${data.totalOrders}`, 20, 95)
    doc.text(`Receita Total: R$ ${data.totalRevenue.toFixed(2)}`, 20, 105)
    doc.text(`Total de Usuários: ${data.totalUsers}`, 20, 115)
    doc.text(`Total de Produtos: ${data.totalProducts}`, 20, 125)
    doc.text(`Promoções Ativas: ${data.promotions.length}`, 20, 135)
    
    // Detalhes dos pedidos (se disponível)
    if (data.orders && data.orders.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('DETALHES DOS PEDIDOS:', 20, 155)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      let y = 170
      
      data.orders.slice(0, 10).forEach((order, index) => {
        if (y > 250) {
          doc.addPage()
          y = 20
        }
        
        doc.setFont('helvetica', 'bold')
        doc.text(`Pedido ${index + 1}: ${order.userName || 'Cliente não identificado'}`, 20, y)
        y += 6
        
        doc.setFont('helvetica', 'normal')
        doc.text(`ID: ${order.userId || 'N/A'} | Email: ${order.userEmail || 'N/A'}`, 20, y)
        y += 5
        doc.text(`Telefone: ${order.userPhone || 'N/A'}`, 20, y)
        y += 5
        doc.text(`Data: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`, 20, y)
        y += 5
        doc.text(`Total: R$ ${(order.total || 0).toFixed(2)}`, 20, y)
        y += 5
        doc.text(`Status: ${order.status || 'N/A'}`, 20, y)
        y += 8
        
        // Itens do pedido
        if (order.items && order.items.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.text('Itens:', 25, y)
          y += 5
          
          doc.setFont('helvetica', 'normal')
          order.items.forEach((item: any) => {
            doc.text(`• ${item.name} - Qtd: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`, 30, y)
            y += 4
          })
          y += 5
        }
      })
    }
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de vendas:', error)
    throw new Error('Falha ao gerar relatório de vendas')
  }
}

export async function generateProductsPDF(products: any[]) {
  try {
    let jsPDF
    try {
      const module = await import('jspdf')
      jsPDF = module.default
    } catch (error) {
      console.error('Erro ao importar jsPDF:', error)
      throw new Error('Biblioteca PDF não disponível')
    }

    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', 105, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Catálogo de Produtos', 105, 30, { align: 'center' })
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50)
    doc.text(`Total de Produtos: ${products.length}`, 20, 60)
    
    // Lista de produtos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('PRODUTOS:', 20, 80)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 95
    
    products.forEach((product, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${product.name || 'Produto sem nome'}`, 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Categoria: ${product.category || 'N/A'}`, 25, y)
      y += 5
      doc.text(`Preço: R$ ${(product.price || 0).toFixed(2)}`, 25, y)
      y += 5
      doc.text(`Estoque: ${product.inStock ? 'Disponível' : 'Indisponível'}`, 25, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de produtos:', error)
    throw new Error('Falha ao gerar catálogo de produtos')
  }
}

export async function generatePromotionsPDF(promotions: any[]) {
  try {
    let jsPDF
    try {
      const module = await import('jspdf')
      jsPDF = module.default
    } catch (error) {
      console.error('Erro ao importar jsPDF:', error)
      throw new Error('Biblioteca PDF não disponível')
    }

    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', 105, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Promoções', 105, 30, { align: 'center' })
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50)
    doc.text(`Total de Promoções: ${promotions.length}`, 20, 60)
    
    // Lista de promoções
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('PROMOÇÕES:', 20, 80)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 95
    
    promotions.forEach((promo, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${promo.productName || 'Produto sem nome'}`, 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Preço Original: R$ ${(promo.originalPrice || 0).toFixed(2)}`, 25, y)
      y += 5
      doc.text(`Preço Promocional: R$ ${(promo.newPrice || 0).toFixed(2)}`, 25, y)
      y += 5
      doc.text(`Desconto: ${promo.discount || 0}%`, 25, y)
      y += 5
      doc.text(`Status: ${promo.isActive ? 'Ativa' : 'Inativa'}`, 25, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de promoções:', error)
    throw new Error('Falha ao gerar relatório de promoções')
  }
}

export async function generateOrdersPDF(orders: any[], period?: string) {
  try {
    let jsPDF
    try {
      const module = await import('jspdf')
      jsPDF = module.default
    } catch (error) {
      console.error('Erro ao importar jsPDF:', error)
      throw new Error('Biblioteca PDF não disponível')
    }

    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', 105, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Pedidos', 105, 30, { align: 'center' })
    
    // Período
    if (period) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`Período: ${period}`, 105, 40, { align: 'center' })
    }
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    const startY = period ? 55 : 50
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, startY)
    doc.text(`Total de Pedidos: ${orders.length}`, 20, startY + 10)
    
    // Resumo detalhado
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const ticketMedio = orders.length > 0 ? totalRevenue / orders.length : 0
    
    doc.text(`Receita Total: R$ ${totalRevenue.toFixed(2)}`, 20, startY + 20)
    doc.text(`Ticket Médio: R$ ${ticketMedio.toFixed(2)}`, 20, startY + 30)
    
    // Status breakdown
    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      delivering: orders.filter(o => o.status === 'delivering').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Status dos Pedidos:', 20, startY + 45)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Pendentes: ${statusCounts.pending}`, 30, startY + 55)
    doc.text(`Confirmados: ${statusCounts.confirmed}`, 30, startY + 65)
    doc.text(`Preparando: ${statusCounts.preparing}`, 30, startY + 75)
    doc.text(`Em Rota: ${statusCounts.delivering}`, 30, startY + 85)
    doc.text(`Entregues: ${statusCounts.delivered}`, 30, startY + 95)
    doc.text(`Cancelados: ${statusCounts.cancelled}`, 30, startY + 105)
    
    // Lista de pedidos
    const listStartY = startY + 120
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('DETALHES DOS PEDIDOS:', 20, listStartY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = listStartY + 10
    
    orders.slice(0, 15).forEach((order, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      const customerName = order.userName || order.customerInfo?.name || 'Cliente não identificado'
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Pedido ${index + 1}: ${customerName}`, 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`ID: ${order.id || 'N/A'}`, 20, y)
      y += 5
      doc.text(`Email: ${order.userEmail || order.customerInfo?.email || 'N/A'}`, 20, y)
      y += 5
      doc.text(`Telefone: ${order.userPhone || order.customerInfo?.phone || 'N/A'}`, 20, y)
      y += 5
      doc.text(`Data: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`, 20, y)
      y += 5
      doc.text(`Total: R$ ${(order.total || 0).toFixed(2)}`, 20, y)
      y += 5
      doc.text(`Status: ${getStatusText(order.status)}`, 20, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de pedidos:', error)
    throw new Error('Falha ao gerar relatório de pedidos')
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    delivering: 'Em Rota',
    delivered: 'Entregue',
    cancelled: 'Cancelado'
  }
  return statusMap[status] || status
}

export async function generateCustomersPDF(customers: any[]) {
  try {
    let jsPDF
    try {
      const module = await import('jspdf')
      jsPDF = module.default
    } catch (error) {
      console.error('Erro ao importar jsPDF:', error)
      throw new Error('Biblioteca PDF não disponível')
    }

    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', 105, 20, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Clientes', 105, 30, { align: 'center' })
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50)
    doc.text(`Total de Clientes: ${customers.length}`, 20, 60)
    
    // Resumo
    const totalSpent = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0)
    doc.text(`Total Gasto: R$ ${totalSpent.toFixed(2)}`, 20, 70)
    
    // Lista de clientes
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('CLIENTES:', 20, 90)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 105
    
    customers.forEach((customer, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${customer.name || 'Cliente sem nome'}`, 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Email: ${customer.email || 'N/A'}`, 25, y)
      y += 5
      doc.text(`Telefone: ${customer.phone || 'N/A'}`, 25, y)
      y += 5
      doc.text(`Pedidos: ${customer.orders || 0}`, 25, y)
      y += 5
      doc.text(`Total Gasto: R$ ${(customer.totalSpent || 0).toFixed(2)}`, 25, y)
      y += 5
      doc.text(`Tipo: ${customer.isClient ? 'Cliente' : 'Usuário'}`, 25, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de clientes:', error)
    throw new Error('Falha ao gerar relatório de clientes')
  }
}
