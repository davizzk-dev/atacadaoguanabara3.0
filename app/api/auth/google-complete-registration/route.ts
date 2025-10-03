import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'
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
    
    console.log('🔥 Google complete registration called')
    console.log('📨 Full request body:', JSON.stringify(body, null, 2))
    
    const { name, email, phone, password, address } = body

    console.log('� Extracted data:')
    console.log('  👤 Name:', name)
    console.log('  📧 Email:', email)
    console.log('  📱 Phone:', phone, '(length:', phone?.length || 0, ')')
    console.log('  🔐 Password:', password ? `provided (${password.length} chars)` : 'missing')
    console.log('  🏠 Address:', address ? 'provided' : 'missing')

    // Validações básicas
    if (!name || !email || !address) {
      console.log('❌ Missing required fields:', { name: !!name, email: !!email, address: !!address })
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

    // Hash da senha se fornecida
    let hashedPassword = ''
    if (password && password.trim() !== '') {
      hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
      console.log('🔐 Senha foi hashada com SHA256:', hashedPassword.substring(0, 10) + '...')
    } else {
      console.log('⚠️ Nenhuma senha fornecida ou senha vazia')
    }

    console.log('📱 Telefone processado:', phone || 'vazio')

    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)

    // Verificar se usuário já existe
    const existingUserIndex = users.findIndex((user: any) => user.email === email)
    
    if (existingUserIndex !== -1) {
      // Atualizar usuário existente com telefone, senha e endereço
      const currentUser = users[existingUserIndex]
      
      // Garantir formato correto - remover campos de endereço soltos se existirem
      const cleanUser = {
        id: currentUser.id,
        name: name,
        email: email,
        phone: phone || '',
        password: hashedPassword,
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
        role: currentUser.role || 'user',
        provider: 'google',
        createdAt: currentUser.createdAt,
        orders: currentUser.orders || 0,
        updatedAt: new Date().toISOString()
      }
      
      users[existingUserIndex] = cleanUser
      console.log('📝 Usuário Google existente atualizado (formato limpo):')
      console.log('  📱 Telefone salvo:', phone || 'vazio')
      console.log('  🔐 Senha salva:', hashedPassword ? 'sim (hash SHA256)' : 'não')
      console.log('  🏠 Address formato:', 'objeto correto')
    } else {
      // Criar novo usuário Google
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
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
      console.log('🆕 Novo usuário Google criado:')
      console.log('  📱 Telefone salvo:', phone || 'vazio')
      console.log('  🔐 Senha salva:', hashedPassword ? 'sim (hash SHA256)' : 'não')
    }

    writeFileSync(dataPath, JSON.stringify(users, null, 2))

    console.log(`✅ Registro Google completado para: ${email}`)

    return NextResponse.json({ 
      message: 'Registro completado com sucesso',
      user: {
        id: existingUserIndex !== -1 ? users[existingUserIndex].id : users[users.length - 1].id,
        name,
        email,
        phone: phone || '',
        address,
        provider: 'google'
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Erro ao completar registro Google:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 