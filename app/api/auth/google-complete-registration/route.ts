import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { Address } from '@/lib/types'

const dataPath = join(process.cwd(), 'data', 'users.json')

// Garantir que o arquivo existe
function ensureDataFile() {
  const fs = require('fs')
  const dir = join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([], null, 2))
  }
}

// POST - Completar registro de usuário Google
export async function POST(request: NextRequest) {
  try {
    ensureDataFile()
    const body = await request.json()
    const { name, email, address } = body

    // Validações básicas
    if (!name || !email || !address) {
      return NextResponse.json({ error: 'Nome, email e endereço são obrigatórios' }, { status: 400 })
    }

    // Validações de endereço
    if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.zipCode) {
      return NextResponse.json({ error: 'Todos os campos de endereço são obrigatórios' }, { status: 400 })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Validar CEP (8 dígitos)
    const zipCodeRegex = /^\d{8}$/
    if (!zipCodeRegex.test(address.zipCode.replace(/\D/g, ''))) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)

    // Verificar se usuário já existe
    const existingUserIndex = users.findIndex((user: any) => user.email === email)
    
    if (existingUserIndex !== -1) {
      // Atualizar usuário existente com endereço
      users[existingUserIndex] = {
        ...users[existingUserIndex],
        address: {
          street: address.street,
          number: address.number,
          complement: address.complement || '',
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          reference: address.reference || ''
        },
        updatedAt: new Date().toISOString()
      }
    } else {
      // Criar novo usuário Google
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        phone: '', // Usuários Google não precisam de telefone
        password: '', // Usuários Google não têm senha local
        address: {
          street: address.street,
          number: address.number,
          complement: address.complement || '',
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          reference: address.reference || ''
        },
        role: 'user',
        provider: 'google', // Marcar como usuário Google
        createdAt: new Date().toISOString(),
        orders: 0
      }
      users.push(newUser)
    }

    writeFileSync(dataPath, JSON.stringify(users, null, 2))

    console.log(`✅ Registro Google completado para: ${email}`)

    return NextResponse.json({ 
      message: 'Registro completado com sucesso',
      user: {
        name,
        email,
        address
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao completar registro Google:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 