import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para gerar PDF de relatório de vendas
export async function generateSalesReportPDF(data: any) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(20)
  doc.text('Relatório de Vendas - Atacadão Guanabara', 20, 20)
  
  // Data do relatório
  doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
  
  // Informações gerais
  doc.setFontSize(14)
  doc.text('Resumo Geral:', 20, 50)
  
  doc.setFontSize(12)
  doc.text(`Total de Pedidos: ${data.totalOrders || 0}`, 20, 65)
  doc.text(`Receita Total: R$ ${(data.totalRevenue || 0).toFixed(2)}`, 20, 75)
  doc.text(`Total de Clientes: ${data.totalUsers || 0}`, 20, 85)
  doc.text(`Produtos Cadastrados: ${data.totalProducts || 0}`, 20, 95)
  
  // Promoções ativas
  if (data.promotions && data.promotions.length > 0) {
    doc.setFontSize(14)
    doc.text('Promoções Ativas:', 20, 115)
    
    let yPosition = 130
    data.promotions.forEach((promo: any, index: number) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(10)
      doc.text(`${index + 1}. ${promo.productName}`, 25, yPosition)
      doc.text(`   De: R$ ${promo.originalPrice} Por: R$ ${promo.newPrice} (${promo.discount}% OFF)`, 25, yPosition + 5)
      yPosition += 15
    })
  }
  
  // Rodapé
  doc.setFontSize(10)
  doc.text('Atacadão Guanabara - Relatório gerado automaticamente', 20, 280)
  
  return doc
}

// Função para gerar PDF de produtos
export async function generateProductsPDF(products: any[]) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(20)
  doc.text('Catálogo de Produtos - Atacadão Guanabara', 20, 20)
  
  // Data
  doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
  
  let yPosition = 50
  let pageNumber = 1
  
  products.forEach((product, index) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
      pageNumber++
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${product.name}`, 20, yPosition)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Categoria: ${product.category}`, 25, yPosition + 8)
    doc.text(`Preço: R$ ${product.price.toFixed(2)}`, 25, yPosition + 16)
    doc.text(`Marca: ${product.brand || 'N/A'}`, 25, yPosition + 24)
    doc.text(`Estoque: ${product.stock || 0} unidades`, 25, yPosition + 32)
    
    yPosition += 45
  })
  
  // Rodapé
  doc.setFontSize(10)
  doc.text(`Página ${pageNumber} - Atacadão Guanabara`, 20, 280)
  
  return doc
}

// Função para gerar PDF de promoções
export async function generatePromotionsPDF(promotions: any[]) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(20)
  doc.text('Relatório de Promoções - Atacadão Guanabara', 20, 20)
  
  // Data
  doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
  
  let yPosition = 50
  
  promotions.forEach((promotion, index) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${promotion.productName}`, 20, yPosition)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Preço Original: R$ ${promotion.originalPrice.toFixed(2)}`, 25, yPosition + 8)
    doc.text(`Preço Promocional: R$ ${promotion.newPrice.toFixed(2)}`, 25, yPosition + 16)
    doc.text(`Desconto: ${promotion.discount}% OFF`, 25, yPosition + 24)
    doc.text(`Status: ${promotion.isActive ? 'Ativa' : 'Inativa'}`, 25, yPosition + 32)
    
    if (promotion.validUntil) {
      doc.text(`Válida até: ${new Date(promotion.validUntil).toLocaleDateString('pt-BR')}`, 25, yPosition + 40)
    }
    
    yPosition += 55
  })
  
  // Rodapé
  doc.setFontSize(10)
  doc.text('Atacadão Guanabara - Relatório de Promoções', 20, 280)
  
  return doc
}

// Função para gerar PDF de pedidos
export async function generateOrdersPDF(orders: any[]) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(20)
  doc.text('Relatório de Pedidos - Atacadão Guanabara', 20, 20)
  
  // Data
  doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
  
  let yPosition = 50
  let totalRevenue = 0
  
  orders.forEach((order, index) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Pedido #${order.id}`, 20, yPosition)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Cliente: ${order.userName}`, 25, yPosition + 8)
    doc.text(`Telefone: ${order.userPhone}`, 25, yPosition + 16)
    doc.text(`Itens: ${order.items.length}`, 25, yPosition + 24)
    doc.text(`Total: R$ ${order.total.toFixed(2)}`, 25, yPosition + 32)
    doc.text(`Status: ${order.status}`, 25, yPosition + 40)
    doc.text(`Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}`, 25, yPosition + 48)
    
    totalRevenue += order.total
    yPosition += 65
  })
  
  // Resumo
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total de Pedidos: ${orders.length}`, 20, yPosition + 10)
  doc.text(`Receita Total: R$ ${totalRevenue.toFixed(2)}`, 20, yPosition + 20)
  
  // Rodapé
  doc.setFontSize(10)
  doc.text('Atacadão Guanabara - Relatório de Pedidos', 20, 280)
  
  return doc
}

// Função para gerar PDF de clientes
export async function generateCustomersPDF(customers: any[]) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(20)
  doc.text('Relatório de Clientes - Atacadão Guanabara', 20, 20)
  
  // Data
  doc.setFontSize(12)
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35)
  
  let yPosition = 50
  
  customers.forEach((customer, index) => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${customer.name}`, 20, yPosition)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Email: ${customer.email}`, 25, yPosition + 8)
    doc.text(`Telefone: ${customer.phone}`, 25, yPosition + 16)
    doc.text(`Pedidos: ${customer.orders}`, 25, yPosition + 24)
    doc.text(`Total Gasto: R$ ${customer.totalSpent.toFixed(2)}`, 25, yPosition + 32)
    
    if (customer.lastOrder) {
      doc.text(`Último Pedido: ${new Date(customer.lastOrder).toLocaleDateString('pt-BR')}`, 25, yPosition + 40)
    }
    
    yPosition += 55
  })
  
  // Rodapé
  doc.setFontSize(10)
  doc.text('Atacadão Guanabara - Relatório de Clientes', 20, 280)
  
  return doc
}
