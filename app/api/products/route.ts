import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Conectar com o backend Java
    const response = await fetch('http://localhost:8080/api/products', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    // Dados mockados em caso de erro
    return NextResponse.json([
      {
        id: 1,
        name: "ÁGUA MINERAL NATURAGUA 1,5L",
        price: 2.99,
        originalPrice: 2.30,
        image: "https://i.ibb.co/N65dsgfh/aguanaturagua1-5l.jpg",
        category: "Bebidas",
        description: "Água mineral natural 1,5 litros",
        stock: 6,
        rating: 4.5,
        reviews: 12,
        brand: "Naturagua",
        unit: "1,5L"
      },
      {
        id: 2,
        name: "ÁGUA MINERAL NATURAGUA 500ML C/ GÁS",
        price: 1.99,
        originalPrice: 1.44,
        image: "https://i.ibb.co/p6WM3mnK/aguacomg-s.jpg",
        category: "Bebidas",
        description: "Água mineral com C/GÁS 500ml",
        stock: 12,
        rating: 4.3,
        reviews: 8,
        brand: "Naturagua",
        unit: "500ml"
      },
      {
        id: 3,
        name: "ÁGUA MINERAL NATURAGUA 500ML S/ GÁS",
        price: 1.49,
        originalPrice: 1.08,
        image: "https://i.ibb.co/4gVp5kbz/aguasemg-s.jpg",
        category: "Bebidas",
        description: "Água mineral sem gás 500ml",
        stock: 12,
        rating: 4.4,
        reviews: 15,
        brand: "Naturagua",
        unit: "500ml"
      },
      {
        id: 4,
        name: "AMENDOIM EM BANDA CASTRO 1KG",
        price: 13.99,
        originalPrice: 13.49,
        image: "https://i.ibb.co/PZ9HLZrg/amendoimembanda.jpg",
        category: "Snacks",
        description: "Amendoim em banda tradicional 1kg",
        stock: 4,
        rating: 4.7,
        reviews: 25,
        brand: "Castro",
        unit: "1kg"
      },
      {
        id: 5,
        name: "ARROZ BRANCO NAMORADO 1KG",
        price: 5.69,
        originalPrice: 5.29,
        image: "https://i.ibb.co/V0rGtJcP/arroznamorado.jpg",
        category: "Grãos",
        description: "Arroz branco tipo 1 1kg",
        stock: 10,
        rating: 4.6,
        reviews: 45,
        brand: "Namorado",
        unit: "1kg"
      },
      {
        id: 6,
        name: "ARROZ BRANCO PAI JOÃO 1KG",
        price: 5.49,
        originalPrice: 5.39,
        image: "https://i.ibb.co/gbzsG1wc/arrozbrancopaijo-o.jpg",
        category: "Grãos",
        description: "Arroz branco tipo 1 1kg",
        stock: 10,
        rating: 4.5,
        reviews: 38,
        brand: "Pai João",
        unit: "1kg"
      }
    ])
  }
} 