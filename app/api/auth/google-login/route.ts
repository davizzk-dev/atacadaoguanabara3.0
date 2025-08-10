import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 API Google Login: Iniciando...')
    
    const body = await request.json()
    const { name, email, image } = body
    
    console.log('📝 Dados recebidos:', { name, email, image })
    
    // Verificar se os dados necessários estão presentes
    if (!name || !email) {
      console.error('❌ Dados obrigatórios faltando')
      return NextResponse.json({ 
        success: false, 
        error: 'Nome e email são obrigatórios' 
      }, { status: 400 })
    }
    
    // Ler dados existentes
    const dataDir = path.join(process.cwd(), 'data')
    const usersFilePath = path.join(dataDir, 'users.json')
    
    console.log('📁 Caminho do arquivo:', usersFilePath)
    
    let usersData = []
    try {
      const fileContent = await fs.readFile(usersFilePath, 'utf-8')
      usersData = JSON.parse(fileContent)
      console.log('👥 Usuários existentes:', usersData.length)
    } catch (readError) {
      console.error('⚠️ Erro ao ler arquivo, criando novo:', readError)
      usersData = []
    }
    
    // Verificar se o usuário já existe
    const existingUser = usersData.find((user: any) => user.email === email)
    
    if (existingUser) {
      console.log('✅ Usuário já existe:', existingUser.name)
      return NextResponse.json({ 
        success: true, 
        message: 'Usuário já existe',
        user: existingUser
      })
    }
    
    // Criar novo usuário Google
    const newUser = {
      id: Date.now().toString(),
      name: name,
      email: email,
      phone: '',
      password: '',
      role: 'user',
      createdAt: new Date().toISOString(),
      isGoogleUser: true,
      image: image || '',
      orders: 0
    }
    
    console.log('🆕 Novo usuário Google criado:', newUser)
    
    // Adicionar ao array de usuários
    usersData.push(newUser)
    
    // Salvar no arquivo
    try {
      await fs.writeFile(usersFilePath, JSON.stringify(usersData, null, 2), 'utf-8')
      console.log('💾 Usuário salvo com sucesso no JSON')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Usuário Google salvo com sucesso',
        user: newUser
      })
    } catch (writeError) {
      console.error('❌ Erro ao salvar usuário:', writeError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao salvar usuário: ' + (writeError as Error).message 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Erro na API Google Login:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + (error as Error).message 
    }, { status: 500 })
  }
} 