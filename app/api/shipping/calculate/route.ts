import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/lib/shipping'
import type { Address } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, orderValue = 0 } = body

    // Validações
    if (!address) {
      return NextResponse.json({ error: 'Endereço é obrigatório' }, { status: 400 })
    }

    // Validar campos obrigatórios do endereço
    const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
    for (const field of requiredFields) {
      if (!address[field as keyof Address]) {
        return NextResponse.json({ error: `Campo ${field} é obrigatório` }, { status: 400 })
      }
    }

    // Validar CEP
    const zipCodeNumbers = address.zipCode.replace(/\D/g, '')
    if (zipCodeNumbers.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    // Calcular frete
    const shippingCalculation = await shippingService.calculateShipping(address, orderValue)

    return NextResponse.json(shippingCalculation)
  } catch (error) {
    console.error('Erro ao calcular frete:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 