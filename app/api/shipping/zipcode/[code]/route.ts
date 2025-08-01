import { NextRequest, NextResponse } from 'next/server'
import { shippingService, ShippingService } from '@/lib/shipping'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const zipCode = params.code

    if (!zipCode) {
      return NextResponse.json({ error: 'CEP é obrigatório' }, { status: 400 })
    }

    // Validar formato do CEP
    const zipCodeNumbers = zipCode.replace(/\D/g, '')
    if (zipCodeNumbers.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    // Buscar endereço
    const addressData = await ShippingService.getAddressByZipCode(zipCodeNumbers)

    if (!addressData) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json(addressData)
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 