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

// POST - Registrar usuário
export async function POST(request: NextRequest) {
  try {
    ensureDataFile()
    const body = await request.json()
    const { name, email, phone, password, address } = body

    // Validações básicas
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    // Validações de endereço
    if (!address || !address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.zipCode) {
      return NextResponse.json({ error: 'Todos os campos de endereço são obrigatórios' }, { status: 400 })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Validar formato do telefone (apenas números, 10-11 dígitos)
    const phoneRegex = /^\d{10,11}$/
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // Validar CEP (8 dígitos)
    const zipCodeRegex = /^\d{8}$/
    if (!zipCodeRegex.test(address.zipCode.replace(/\D/g, ''))) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
    }

    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)

    // Verificar se email já existe
    const existingUser = users.find((user: any) => user.email === email)
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

    // Criar novo usuário
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone.replace(/\D/g, ''), // Remover caracteres não numéricos
      password: password, // Em produção, deve ser criptografada
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
      createdAt: new Date().toISOString(),
      orders: 0
    }

    users.push(newUser)
    writeFileSync(dataPath, JSON.stringify(users, null, 2))

    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 