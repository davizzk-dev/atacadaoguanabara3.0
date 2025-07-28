import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funções utilitárias para geração de PDFs
// Importação dinâmica do jsPDF para evitar problemas de SSR

export async function generateSalesReportPDF(data: {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalProducts: number
  promotions: any[]
  orders?: any[] // Adicionando orders para detalhes
}) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Cabeçalho com logo e informações da empresa
    doc.setFillColor(59, 130, 246) // Azul
    doc.rect(0, 0, 210, 30, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('ATACADÃO GUANABARA', 105, 15, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Vendas', 105, 25, { align: 'center' })
    
    // Informações do relatório
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45)
    doc.text(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`, 20, 52)
    doc.text(`Gerado por: Sistema Administrativo`, 20, 59)
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 70, 190, 70)
    
    // Estatísticas Gerais em cards
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('RESUMO EXECUTIVO', 20, 85)
    
    // Card 1 - Pedidos
    doc.setFillColor(34, 197, 94) // Verde
    doc.rect(20, 95, 40, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('PEDIDOS', 40, 105, { align: 'center' })
    doc.setFontSize(16)
    doc.text(data.totalOrders.toString(), 40, 115, { align: 'center' })
    
    // Card 2 - Receita
    doc.setFillColor(59, 130, 246) // Azul
    doc.rect(70, 95, 40, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('RECEITA', 90, 105, { align: 'center' })
    doc.setFontSize(16)
    doc.text(`R$ ${data.totalRevenue.toFixed(2)}`, 90, 115, { align: 'center' })
    
    // Card 3 - Usuários
    doc.setFillColor(245, 158, 11) // Amarelo
    doc.rect(120, 95, 40, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('USUÁRIOS', 140, 105, { align: 'center' })
    doc.setFontSize(16)
    doc.text(data.totalUsers.toString(), 140, 115, { align: 'center' })
    
    // Card 4 - Produtos
    doc.setFillColor(239, 68, 68) // Vermelho
    doc.rect(170, 95, 20, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text('PROD', 180, 105, { align: 'center' })
    doc.setFontSize(16)
    doc.text(data.totalProducts.toString(), 180, 115, { align: 'center' })
    
    // Resetar cor do texto
    doc.setTextColor(0, 0, 0)
    
    // Detalhes dos Pedidos (se disponível)
    if (data.orders && data.orders.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('DETALHES DOS PEDIDOS', 20, 140)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      let y = 155
      let page = 1
      
      data.orders.forEach((order, index) => {
        if (y > 250) {
          doc.addPage()
          y = 20
          page++
          
          // Cabeçalho da nova página
          doc.setFillColor(59, 130, 246)
          doc.rect(0, 0, 210, 15, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.text('ATACADÃO GUANABARA - Relatório de Vendas (Continuação)', 105, 10, { align: 'center' })
          doc.setTextColor(0, 0, 0)
        }
        
        // Cabeçalho do pedido
        doc.setFillColor(240, 240, 240)
        doc.rect(20, y - 5, 170, 8, 'F')
        
        doc.setFont('helvetica', 'bold')
        doc.text(`PEDIDO #${index + 1}`, 25, y)
        y += 8
        
        // Informações do cliente
        doc.setFont('helvetica', 'normal')
        doc.text(`Cliente: ${order.userName || 'Cliente não identificado'}`, 25, y)
        y += 5
        doc.text(`ID: ${order.userId || 'N/A'} | Email: ${order.userEmail || 'N/A'}`, 25, y)
        y += 5
        doc.text(`Telefone: ${order.userPhone || 'N/A'}`, 25, y)
        y += 5
        doc.text(`Data: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`, 25, y)
        y += 5
        doc.text(`Status: ${order.status || 'N/A'}`, 25, y)
        y += 5
        
        // Itens do pedido
        if (order.items && order.items.length > 0) {
          doc.setFont('helvetica', 'bold')
          doc.text('ITENS COMPRADOS:', 25, y)
          y += 6
          
          doc.setFont('helvetica', 'normal')
          order.items.forEach((item: any) => {
            const itemText = `• ${item.name} - Qtd: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`
            doc.text(itemText, 30, y)
            y += 4
          })
          y += 2
        }
        
        // Total do pedido
        doc.setFont('helvetica', 'bold')
        doc.setFillColor(34, 197, 94)
        doc.rect(25, y - 2, 50, 6, 'F')
        doc.setTextColor(255, 255, 255)
        doc.text(`TOTAL: R$ ${(order.total || 0).toFixed(2)}`, 50, y + 2, { align: 'center' })
        doc.setTextColor(0, 0, 0)
        y += 12
      })
    }
    
    // Promoções (se houver)
    if (data.promotions.length > 0) {
      if (y > 200) {
        doc.addPage()
        y = 20
        
        // Cabeçalho da nova página
        doc.setFillColor(59, 130, 246)
        doc.rect(0, 0, 210, 15, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('ATACADÃO GUANABARA - Promoções Ativas', 105, 10, { align: 'center' })
        doc.setTextColor(0, 0, 0)
      }
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('PROMOÇÕES ATIVAS', 20, y)
      y += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      data.promotions.slice(0, 10).forEach((promo, index) => {
        if (y > 250) {
          doc.addPage()
          y = 20
        }
        doc.text(`${index + 1}. ${promo.productName} - ${promo.discount}% OFF`, 20, y)
        y += 6
      })
    }
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Relatório gerado automaticamente pelo sistema Atacadão Guanabara', 20, 280)
    doc.text(`Página ${page}`, 190, 280, { align: 'right' })
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de vendas:', error)
    throw new Error('Falha ao gerar relatório de vendas')
  }
}

export async function generateProductsPDF(products: any[]) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, 210, 30, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('ATACADÃO GUANABARA', 105, 15, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Catálogo de Produtos', 105, 25, { align: 'center' })
    
    // Informações
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45)
    doc.text(`Total de Produtos: ${products.length}`, 20, 52)
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 60, 190, 60)
    
    // Lista de produtos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('PRODUTOS DISPONÍVEIS', 20, 75)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 90
    let page = 1
    
    products.forEach((product, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
        page++
        
        // Cabeçalho da nova página
        doc.setFillColor(59, 130, 246)
        doc.rect(0, 0, 210, 15, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('ATACADÃO GUANABARA - Catálogo de Produtos (Continuação)', 105, 10, { align: 'center' })
        doc.setTextColor(0, 0, 0)
      }
      
      // Cabeçalho do produto
      doc.setFillColor(240, 240, 240)
      doc.rect(20, y - 5, 170, 8, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${product.name || 'Produto sem nome'}`, 25, y)
      y += 8
      
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
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Relatório gerado automaticamente pelo sistema Atacadão Guanabara', 20, 280)
    doc.text(`Página ${page}`, 190, 280, { align: 'right' })
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de produtos:', error)
    throw new Error('Falha ao gerar catálogo de produtos')
  }
}

export async function generatePromotionsPDF(promotions: any[]) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, 210, 30, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('ATACADÃO GUANABARA', 105, 15, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Promoções', 105, 25, { align: 'center' })
    
    // Informações
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45)
    doc.text(`Total de Promoções: ${promotions.length}`, 20, 52)
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 60, 190, 60)
    
    // Lista de promoções
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('PROMOÇÕES ATIVAS', 20, 75)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 90
    
    promotions.forEach((promo, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      // Cabeçalho da promoção
      doc.setFillColor(240, 240, 240)
      doc.rect(20, y - 5, 170, 8, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${promo.productName || 'Produto sem nome'}`, 25, y)
      y += 8
      
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
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Relatório gerado automaticamente pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de promoções:', error)
    throw new Error('Falha ao gerar relatório de promoções')
  }
}

export async function generateOrdersPDF(orders: any[]) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, 210, 30, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('ATACADÃO GUANABARA', 105, 15, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Pedidos', 105, 25, { align: 'center' })
    
    // Informações
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45)
    doc.text(`Total de Pedidos: ${orders.length}`, 20, 52)
    
    // Resumo
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    doc.text(`Receita Total: R$ ${totalRevenue.toFixed(2)}`, 20, 59)
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 70, 190, 70)
    
    // Lista de pedidos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('DETALHES DOS PEDIDOS', 20, 85)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 100
    
    orders.forEach((order, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      // Cabeçalho do pedido
      doc.setFillColor(240, 240, 240)
      doc.rect(20, y - 5, 170, 8, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Pedido ${index + 1}: ${order.userName || 'Cliente não identificado'}`, 25, y)
      y += 8
      
      doc.setFont('helvetica', 'normal')
      doc.text(`ID do Cliente: ${order.userId || 'N/A'}`, 25, y)
      y += 5
      doc.text(`Email: ${order.userEmail || 'N/A'}`, 25, y)
      y += 5
      doc.text(`Telefone: ${order.userPhone || 'N/A'}`, 25, y)
      y += 5
      doc.text(`Data: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : 'N/A'}`, 25, y)
      y += 5
      doc.text(`Total: R$ ${(order.total || 0).toFixed(2)}`, 25, y)
      y += 5
      doc.text(`Status: ${order.status || 'N/A'}`, 25, y)
      y += 5
      doc.text(`Itens: ${order.items?.length || 0}`, 25, y)
      y += 8
    })
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Relatório gerado automaticamente pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de pedidos:', error)
    throw new Error('Falha ao gerar relatório de pedidos')
  }
}

export async function generateCustomersPDF(customers: any[]) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, 210, 30, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text('ATACADÃO GUANABARA', 105, 15, { align: 'center' })
    
    doc.setFontSize(14)
    doc.text('Relatório de Clientes', 105, 25, { align: 'center' })
    
    // Informações
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 45)
    doc.text(`Total de Clientes: ${customers.length}`, 20, 52)
    
    // Resumo
    const totalSpent = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0)
    doc.text(`Total Gasto pelos Clientes: R$ ${totalSpent.toFixed(2)}`, 20, 59)
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 70, 190, 70)
    
    // Lista de clientes
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('DETALHES DOS CLIENTES', 20, 85)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 100
    
    customers.forEach((customer, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      // Cabeçalho do cliente
      doc.setFillColor(240, 240, 240)
      doc.rect(20, y - 5, 170, 8, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${customer.name || 'Cliente sem nome'}`, 25, y)
      y += 8
      
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
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Relatório gerado automaticamente pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de clientes:', error)
    throw new Error('Falha ao gerar relatório de clientes')
  }
}
