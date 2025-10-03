import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { hashPassword } from '@/lib/password'
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
    console.log('[API/auth/register][POST] chamada recebida')
    ensureDataFile()
    
    // Usar request.text() e parsing manual para evitar erro do Express middleware
    const textBody = await request.text()
    console.log('[API/auth/register][POST] body recebido:', textBody)
    
    let body: any
    try {
      body = JSON.parse(textBody)
      console.log('[API/auth/register][POST] body parseado:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('[API/auth/register][POST] Erro ao fazer parse do JSON:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON inválido',
        details: (parseError as Error)?.message
      }, { status: 400 })
    }
    
    const { name, email, phone, password, address } = body

    console.log('[API/auth/register][POST] Campos extraídos:', {
      name: name || 'UNDEFINED',
      email: email || 'UNDEFINED', 
      phone: phone || 'UNDEFINED',
      password: password ? '[PRESENTE]' : 'UNDEFINED',
      address: address || 'UNDEFINED'
    })

    // Validações básicas
    if (!name || !email || !phone || !password) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!email) missingFields.push('email')
      if (!phone) missingFields.push('phone')
      if (!password) missingFields.push('password')
      
      console.log('[API/auth/register][POST] Campos obrigatórios faltando:', missingFields)
      return NextResponse.json({ 
        success: false,
        error: `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
        missingFields
      }, { status: 400 })
    }

    // Validações de endereço
    if (!address || typeof address !== 'object') {
      console.log('[API/auth/register][POST] Endereço ausente ou inválido:', address)
      return NextResponse.json({ 
        success: false,
        error: 'Endereço é obrigatório e deve ser um objeto válido' 
      }, { status: 400 })
    }
    
    const { street, number, neighborhood, city, state, zipCode } = address
    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
      const missingAddressFields = []
      if (!street) missingAddressFields.push('street')
      if (!number) missingAddressFields.push('number')
      if (!neighborhood) missingAddressFields.push('neighborhood')
      if (!city) missingAddressFields.push('city')
      if (!state) missingAddressFields.push('state')
      if (!zipCode) missingAddressFields.push('zipCode')
      
      console.log('[API/auth/register][POST] Campos de endereço faltando:', missingAddressFields)
      return NextResponse.json({ 
        success: false,
        error: `Campos de endereço obrigatórios faltando: ${missingAddressFields.join(', ')}`,
        missingAddressFields
      }, { status: 400 })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false,
        error: 'Email inválido' 
      }, { status: 400 })
    }

    // Validar formato do telefone (apenas números, 10-11 dígitos)
    const phoneRegex = /^\d{10,11}$/
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      return NextResponse.json({ 
        success: false,
        error: 'Telefone inválido' 
      }, { status: 400 })
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return NextResponse.json({ 
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres' 
      }, { status: 400 })
    }

    // Validar CEP (8 dígitos)
    const zipCodeRegex = /^\d{8}$/
    if (!zipCodeRegex.test(address.zipCode.replace(/\D/g, ''))) {
      return NextResponse.json({ 
        success: false,
        error: 'CEP inválido' 
      }, { status: 400 })
    }

    const data = readFileSync(dataPath, 'utf-8')
    const users = JSON.parse(data)

    // Verificar se email já existe
    const existingUser = users.find((user: any) => user.email === email)
    if (existingUser) {
      return NextResponse.json({ 
        success: false,
        error: 'Email já cadastrado' 
      }, { status: 409 })
    }

    // Criar novo usuário
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      phone: phone.replace(/\D/g, ''), // Remover caracteres não numéricos
      password: hashPassword(password), // Criptografar senha
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
    console.log('[API/auth/register][POST] usuário registrado com sucesso:', email)
    
    return NextResponse.json({
      success: true,
      data: userWithoutPassword
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API/auth/register][POST] Erro:', error, error?.stack)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error?.message,
      stack: error?.stack,
      errorString: String(error),
      errorType: error?.constructor?.name
    }, { status: 500 })
  }
} 