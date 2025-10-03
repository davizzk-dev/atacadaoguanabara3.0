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
  // Layout/margins padrão para todos os PDFs
  const marginLeft = 20
  const marginTop = 20
  const marginBottom = 20
  const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
  const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297
    
    // Cabeçalho simples e robusto
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
  doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    
    doc.setFontSize(14)
  doc.text('Relatório de Vendas', pageWidth / 2, marginTop + 10, { align: 'center' })
    
    // Informações básicas
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
  doc.text(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`, marginLeft, marginTop + 40)
    
    // Estatísticas
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
  doc.text('RESUMO:', marginLeft, marginTop + 60)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
  doc.text(`Total de Pedidos: ${data.totalOrders}`, marginLeft, marginTop + 75)
  doc.text(`Receita Total: R$ ${data.totalRevenue.toFixed(2)}`, marginLeft, marginTop + 85)
  doc.text(`Total de Usuários: ${data.totalUsers}`, marginLeft, marginTop + 95)
  doc.text(`Total de Produtos: ${data.totalProducts}`, marginLeft, marginTop + 105)
  doc.text(`Promoções Ativas: ${data.promotions.length}`, marginLeft, marginTop + 115)
    
    // Detalhes dos pedidos (se disponível)
    if (data.orders && data.orders.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('DETALHES DOS PEDIDOS:', marginLeft, marginTop + 135)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      let y = marginTop + 150
      
      data.orders.slice(0, 10).forEach((order, index) => {
        if (y > pageHeight - marginBottom - 30) {
          doc.addPage()
          y = marginTop
        }
        
        doc.setFont('helvetica', 'bold')
        doc.text(`Pedido ${index + 1}: ${order.userName || 'Cliente não identificado'}`, marginLeft, y)
        y += 6
        
        doc.setFont('helvetica', 'normal')
        doc.text(`ID: ${order.userId || 'N/A'} | Email: ${order.userEmail || 'N/A'}`, marginLeft, y)
        y += 5
        doc.text(`Telefone: ${order.userPhone || 'N/A'}`, marginLeft, y)
        y += 5
        doc.text(`Data: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`, marginLeft, y)
        y += 5
        doc.text(`Total: R$ ${(order.total || 0).toFixed(2)}`, marginLeft, y)
        y += 5
        doc.text(`Status: ${order.status || 'N/A'}`, marginLeft, y)
        y += 8
        
        // Itens do pedido
        if (order.items && order.items.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.text('Itens:', marginLeft + 5, y)
          y += 5
          
          doc.setFont('helvetica', 'normal')
          order.items.forEach((item: any) => {
            doc.text(`• ${item.name} - Qtd: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`, marginLeft + 10, y)
            y += 4
          })
          y += 5
        }
      })
    }
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)
    
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
  const marginLeft = 20
  const marginTop = 20
  const marginBottom = 20
  const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
  const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
  doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    
    doc.setFontSize(14)
  doc.text('Catálogo de Produtos', pageWidth / 2, marginTop + 10, { align: 'center' })
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
  doc.text(`Total de Produtos: ${products.length}`, marginLeft, marginTop + 40)
    
    // Lista de produtos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
  doc.text('PRODUTOS:', marginLeft, marginTop + 60)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = marginTop + 75
    
    products.forEach((product, index) => {
      if (y > pageHeight - marginBottom - 30) {
        doc.addPage()
        y = marginTop
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${product.name || 'Produto sem nome'}`, marginLeft, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Categoria: ${product.category || 'N/A'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Preço: R$ ${(product.price || 0).toFixed(2)}`, marginLeft + 5, y)
      y += 5
      doc.text(`Estoque: ${product.inStock ? 'Disponível' : 'Indisponível'}`, marginLeft + 5, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
  doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)
    
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
  const marginLeft = 20
  const marginTop = 20
  const marginBottom = 20
  const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
  const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
  doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    
    doc.setFontSize(14)
  doc.text('Relatório de Promoções', pageWidth / 2, marginTop + 10, { align: 'center' })
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
  doc.text(`Total de Promoções: ${promotions.length}`, marginLeft, marginTop + 40)
    
    // Lista de promoções
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
  doc.text('PROMOÇÕES:', marginLeft, marginTop + 60)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = marginTop + 75
    
    promotions.forEach((promo, index) => {
      if (y > pageHeight - marginBottom - 30) {
        doc.addPage()
        y = marginTop
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${promo.productName || 'Produto sem nome'}`, marginLeft, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Preço Original: R$ ${(promo.originalPrice || 0).toFixed(2)}`, marginLeft + 5, y)
      y += 5
      doc.text(`Preço Promocional: R$ ${(promo.newPrice || 0).toFixed(2)}`, marginLeft + 5, y)
      y += 5
      doc.text(`Desconto: ${promo.discount || 0}%`, marginLeft + 5, y)
      y += 5
      doc.text(`Status: ${promo.isActive ? 'Ativa' : 'Inativa'}`, marginLeft + 5, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
  doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)
    
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
  const marginLeft = 20
  const marginTop = 20
  const marginBottom = 20
  const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
  const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
  doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    
    doc.setFontSize(14)
  doc.text('Relatório de Pedidos', pageWidth / 2, marginTop + 10, { align: 'center' })
    
    // Período
    if (period) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
  doc.text(`Período: ${period}`, pageWidth / 2, marginTop + 20, { align: 'center' })
    }
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
  const startY = period ? marginTop + 35 : marginTop + 30
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, startY)
  doc.text(`Total de Pedidos: ${orders.length}`, marginLeft, startY + 10)
    
    // Resumo detalhado
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const ticketMedio = orders.length > 0 ? totalRevenue / orders.length : 0
    
  doc.text(`Receita Total: R$ ${totalRevenue.toFixed(2)}`, marginLeft, startY + 20)
  doc.text(`Ticket Médio: R$ ${ticketMedio.toFixed(2)}`, marginLeft, startY + 30)
    
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
  doc.text('Status dos Pedidos:', marginLeft, startY + 45)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
  doc.text(`Pendentes: ${statusCounts.pending}`, marginLeft + 10, startY + 55)
  doc.text(`Confirmados: ${statusCounts.confirmed}`, marginLeft + 10, startY + 65)
  doc.text(`Preparando: ${statusCounts.preparing}`, marginLeft + 10, startY + 75)
  doc.text(`Em Rota: ${statusCounts.delivering}`, marginLeft + 10, startY + 85)
  doc.text(`Entregues: ${statusCounts.delivered}`, marginLeft + 10, startY + 95)
  doc.text(`Cancelados: ${statusCounts.cancelled}`, marginLeft + 10, startY + 105)
    
    // Lista de pedidos
    const listStartY = startY + 120
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
  doc.text('DETALHES DOS PEDIDOS:', marginLeft, listStartY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = listStartY + 10
    
    orders.slice(0, 15).forEach((order, index) => {
      if (y > pageHeight - marginBottom - 30) {
        doc.addPage()
        y = marginTop
      }
      
      const customerName = order.userName || order.customerInfo?.name || 'Cliente não identificado'
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Pedido ${index + 1}: ${customerName}`, marginLeft, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`ID: ${order.id || 'N/A'}`, marginLeft, y)
      y += 5
      doc.text(`Email: ${order.userEmail || order.customerInfo?.email || 'N/A'}`, marginLeft, y)
      y += 5
      doc.text(`Telefone: ${order.userPhone || order.customerInfo?.phone || 'N/A'}`, marginLeft, y)
      y += 5
      doc.text(`Data: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`, marginLeft, y)
      y += 5
      doc.text(`Total: R$ ${(order.total || 0).toFixed(2)}`, marginLeft, y)
      y += 5
      doc.text(`Status: ${getStatusText(order.status)}`, marginLeft, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
  doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)
    
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
  const marginLeft = 20
  const marginTop = 20
  const marginBottom = 20
  const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
  const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
  doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    
    doc.setFontSize(14)
  doc.text('Relatório de Clientes', pageWidth / 2, marginTop + 10, { align: 'center' })
    
    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
  doc.text(`Total de Clientes: ${customers.length}`, marginLeft, marginTop + 40)
    
    // Resumo
    const totalSpent = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0)
  doc.text(`Total Gasto: R$ ${totalSpent.toFixed(2)}`, marginLeft, marginTop + 50)
    
    // Lista de clientes
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
  doc.text('CLIENTES:', marginLeft, marginTop + 70)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = marginTop + 85
    
    customers.forEach((customer, index) => {
      if (y > pageHeight - marginBottom - 30) {
        doc.addPage()
        y = marginTop
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${customer.name || 'Cliente sem nome'}`, marginLeft, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Email: ${customer.email || 'N/A'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Telefone: ${customer.phone || 'N/A'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Pedidos: ${customer.orders || 0}`, marginLeft + 5, y)
      y += 5
      doc.text(`Total Gasto: R$ ${(customer.totalSpent || 0).toFixed(2)}`, marginLeft + 5, y)
      y += 5
      doc.text(`Tipo: ${customer.isClient ? 'Cliente' : 'Usuário'}`, marginLeft + 5, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
  doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de clientes:', error)
    throw new Error('Falha ao gerar relatório de clientes')
  }
}

// Gerador de PDF padronizado para usuários
export async function generateUsersPDF(users: any[]) {
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
    const marginLeft = 20
    const marginTop = 20
    const marginBottom = 20
    const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
    const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297

    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Relatório de Usuários', pageWidth / 2, marginTop + 10, { align: 'center' })

    // Informações
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
    doc.text(`Total de Usuários: ${users.length}`, marginLeft, marginTop + 40)

    // Lista
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('USUÁRIOS:', marginLeft, marginTop + 60)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = marginTop + 75

    users.forEach((user, index) => {
      if (y > pageHeight - marginBottom - 30) {
        doc.addPage()
        y = marginTop
      }
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${user.name || 'Sem nome'}`, marginLeft, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.text(`Email: ${user.email || 'N/A'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Telefone: ${user.phone || 'N/A'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Função: ${user.role || 'N/A'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Criado em: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`, marginLeft + 5, y)
      y += 8
    })

    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)

    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de usuários:', error)
    throw new Error('Falha ao gerar relatório de usuários')
  }
}

// Gerador de PDF para feedbacks
export async function generateFeedbackPDF(feedbacks: any[]) {
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
    const marginLeft = 20
    const marginTop = 20
    const marginBottom = 20
    const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
    const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Relatório de Feedbacks', pageWidth / 2, marginTop + 10, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
    doc.text(`Total de Feedbacks: ${feedbacks.length}`, marginLeft, marginTop + 40)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('FEEDBACKS:', marginLeft, marginTop + 60)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = marginTop + 75

    feedbacks.forEach((f, index) => {
      if (y > pageHeight - marginBottom - 30) {
        doc.addPage()
        y = marginTop
      }
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${f.name || 'Cliente'} (${f.email || 'N/A'})`, marginLeft, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.text(`Avaliação: ${f.rating ?? '-'} | Status: ${f.status || '-'}`, marginLeft + 5, y)
      y += 5
      const message = (f.message || '').toString()
      const lines = (doc as any).splitTextToSize?.(message, pageWidth - marginLeft * 2 - 10) || [message]
      lines.forEach((line: string) => {
        if (y > pageHeight - marginBottom - 20) { doc.addPage(); y = marginTop }
        doc.text(line, marginLeft + 5, y)
        y += 4
      })
      y += 6
    })

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)

    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de feedbacks:', error)
    throw new Error('Falha ao gerar relatório de feedbacks')
  }
}

// Gerador de PDF para solicitações de câmera
export async function generateCameraRequestsPDF(requests: any[]) {
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
    const marginLeft = 20
    const marginTop = 20
    const marginBottom = 20
    const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
    const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Relatório de Solicitações de Câmera', pageWidth / 2, marginTop + 10, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
    doc.text(`Total: ${requests.length}`, marginLeft, marginTop + 40)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('SOLICITAÇÕES:', marginLeft, marginTop + 60)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = marginTop + 75

    requests.forEach((r, index) => {
      if (y > pageHeight - marginBottom - 30) { doc.addPage(); y = marginTop }
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${r.name || '-'} (${r.phone || '-'})`, marginLeft, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.text(`Status: ${r.status || '-'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Data: ${r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : '-'}`, marginLeft + 5, y)
      y += 5
      const cause = (r.cause || '').toString()
      const lines = (doc as any).splitTextToSize?.(cause, pageWidth - marginLeft * 2 - 10) || [cause]
      lines.forEach((line: string) => {
        if (y > pageHeight - marginBottom - 20) { doc.addPage(); y = marginTop }
        doc.text(line, marginLeft + 5, y)
        y += 4
      })
      y += 6
    })

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)

    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de solicitações de câmera:', error)
    throw new Error('Falha ao gerar relatório de solicitações')
  }
}

// Gerador de PDF para trocas/devoluções
export async function generateReturnsPDF(returns: any[]) {
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
    const marginLeft = 20
    const marginTop = 20
    const marginBottom = 20
    const pageWidth = (doc as any).internal?.pageSize?.getWidth?.() ?? 210
    const pageHeight = (doc as any).internal?.pageSize?.getHeight?.() ?? 297

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ATACADÃO GUANABARA', pageWidth / 2, marginTop, { align: 'center' })
    doc.setFontSize(14)
    doc.text('Relatório de Trocas/Devoluções', pageWidth / 2, marginTop + 10, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, marginLeft, marginTop + 30)
    doc.text(`Total: ${returns.length}`, marginLeft, marginTop + 40)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('REGISTROS:', marginLeft, marginTop + 60)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = marginTop + 75

    returns.forEach((r, index) => {
      if (y > pageHeight - marginBottom - 30) { doc.addPage(); y = marginTop }
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. Pedido ${r.orderId || '-'} - ${r.userName || 'Cliente'}`, marginLeft, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.text(`Status: ${r.status || '-'}`, marginLeft + 5, y)
      y += 5
      doc.text(`Data: ${r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : '-'}`, marginLeft + 5, y)
      y += 5
      const reason = (r.reason || '').toString()
      const lines = (doc as any).splitTextToSize?.(reason, pageWidth - marginLeft * 2 - 10) || [reason]
      lines.forEach((line: string) => {
        if (y > pageHeight - marginBottom - 20) { doc.addPage(); y = marginTop }
        doc.text(line, marginLeft + 5, y)
        y += 4
      })
      y += 6
    })

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado pelo sistema Atacadão Guanabara', marginLeft, pageHeight - 10)

    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de trocas/devoluções:', error)
    throw new Error('Falha ao gerar relatório de trocas/devoluções')
  }
}

// Função para calcular preço dinâmico baseado na quantidade
export function calculateDynamicPrice(product: any, quantity: number) {
  // Busca preços escalonados, priorizando priceAtacado, depois precoVenda2
  const precoVenda2 = product.priceAtacado > 0
    ? product.priceAtacado
    : product.prices?.precoVenda2 > 0
      ? product.prices.precoVenda2
      : product.varejoFacilData?.precos?.precoVenda2 || 0;
  const quantidadeMinimaPreco2 = product.prices?.quantidadeMinimaPreco2 > 1
    ? product.prices.quantidadeMinimaPreco2
    : product.varejoFacilData?.precos?.quantidadeMinimaPreco2 || 0;
  const price3 = product.prices?.price3 || product.varejoFacilData?.precos?.precoVenda3 || 0;
  const minQuantityPrice3 = product.prices?.minQuantityPrice3 || product.varejoFacilData?.precos?.quantidadeMinimaPreco3 || 0;

  // Se não tem preços escalonados, usar preço normal
  if (!(precoVenda2 > 0 && quantidadeMinimaPreco2 > 1)) {
    return product.price;
  }

  // Verificar preço 3 primeiro (maior quantidade)
  if (price3 && minQuantityPrice3 && quantity >= minQuantityPrice3) {
    return price3;
  }
  // Depois preço 2
  else if (precoVenda2 && quantidadeMinimaPreco2 && quantity >= quantidadeMinimaPreco2) {
    return precoVenda2;
  }
  // Senão, preço normal
  else {
    return product.price;
  }
}
