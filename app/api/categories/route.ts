import { NextResponse } from 'next/server'
import { getDynamicCategories } from '@/lib/data'

export async function GET() {
  try {
    const categories = await getDynamicCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Erro ao obter categorias:', error)
    // Retornar categorias padrão em caso de erro
    return NextResponse.json(['Todos', 'Eletrônicos', 'Roupas', 'Casa', 'Esportes', 'Livros', 'Alimentos', 'Bebidas', 'Higiene', 'Limpeza'])
  }
}
