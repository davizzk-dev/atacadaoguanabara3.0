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
}) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Cabeçalho
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Relatório de Vendas - Atacadão Guanabara', 20, 20)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
    doc.text(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`, 20, 45)
    
    // Estatísticas
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Estatísticas Gerais:', 20, 65)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Total de Pedidos: ${data.totalOrders}`, 20, 80)
    doc.text(`Receita Total: R$ ${data.totalRevenue.toFixed(2)}`, 20, 90)
    doc.text(`Total de Usuários: ${data.totalUsers}`, 20, 100)
    doc.text(`Total de Produtos: ${data.totalProducts}`, 20, 110)
    doc.text(`Promoções Ativas: ${data.promotions.length}`, 20, 120)
    
    // Promoções
    if (data.promotions.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('Promoções Ativas:', 20, 140)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      let y = 155
      data.promotions.slice(0, 10).forEach((promo, index) => {
        if (y > 250) {
          doc.addPage()
          y = 20
        }
        doc.text(`${index + 1}. ${promo.productName} - ${promo.discount}% OFF`, 20, y)
        y += 8
      })
    }
    
    // Rodapé
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.text('Relatório gerado automaticamente pelo sistema Atacadão Guanabara', 20, 280)
    
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
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Catálogo de Produtos - Atacadão Guanabara', 20, 20)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
    doc.text(`Total de Produtos: ${products.length}`, 20, 45)
    
    // Lista de produtos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Produtos:', 20, 65)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 80
    let page = 1
    
    products.forEach((product, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
        page++
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
    doc.text(`Página ${page} - Relatório gerado automaticamente`, 20, 280)
    
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
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Relatório de Promoções - Atacadão Guanabara', 20, 20)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
    doc.text(`Total de Promoções: ${promotions.length}`, 20, 45)
    
    // Lista de promoções
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Promoções:', 20, 65)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 80
    
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
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Relatório de Pedidos - Atacadão Guanabara', 20, 20)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
    doc.text(`Total de Pedidos: ${orders.length}`, 20, 45)
    
    // Resumo
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    doc.text(`Receita Total: R$ ${totalRevenue.toFixed(2)}`, 20, 55)
    
    // Lista de pedidos
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Pedidos:', 20, 75)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 90
    
    orders.forEach((order, index) => {
      if (y > 250) {
        doc.addPage()
        y = 20
      }
      
      doc.setFont('helvetica', 'bold')
      doc.text(`Pedido ${index + 1}: ${order.userName || 'Cliente não identificado'}`, 20, y)
      y += 6
      
      doc.setFont('helvetica', 'normal')
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
    doc.setFontSize(10)
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
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Relatório de Clientes - Atacadão Guanabara', 20, 20)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
    doc.text(`Total de Clientes: ${customers.length}`, 20, 45)
    
    // Resumo
    const totalSpent = customers.reduce((sum, customer) => sum + (customer.totalSpent || 0), 0)
    doc.text(`Total Gasto pelos Clientes: R$ ${totalSpent.toFixed(2)}`, 20, 55)
    
    // Lista de clientes
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('Clientes:', 20, 75)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    let y = 90
    
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
    doc.text('Relatório gerado automaticamente pelo sistema Atacadão Guanabara', 20, 280)
    
    return doc
  } catch (error) {
    console.error('Erro ao gerar PDF de clientes:', error)
    throw new Error('Falha ao gerar relatório de clientes')
  }
}
