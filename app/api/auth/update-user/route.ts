import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, message: 'ID do usuário e dados são obrigatórios' },
        { status: 400 }
      )
    }

    // Ler arquivo de usuários
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json')
    const usersData = await fs.readFile(usersFilePath, 'utf8')
    const users = JSON.parse(usersData)

    // Encontrar usuário
    const userIndex = users.findIndex((u: any) => u.id === userId || u.email === userId)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar dados do usuário
    const currentUser = users[userIndex]
    
    // Processar updates para garantir formato correto
    const processedUpdates = { ...updates }
    
    // Garantir que address seja sempre um objeto
    if (processedUpdates.address) {
      if (typeof processedUpdates.address === 'string') {
        // Se address veio como string, converter para objeto mantendo o valor atual
        console.log('⚠️ Address veio como string, mantendo address atual:', currentUser.address)
        delete processedUpdates.address // Remove address string incorreto
      } else if (typeof processedUpdates.address === 'object') {
        // Se address é objeto, garantir que tem todos os campos necessários
        processedUpdates.address = {
          street: processedUpdates.address.street || '',
          number: processedUpdates.address.number || '',
          complement: processedUpdates.address.complement || '',
          neighborhood: processedUpdates.address.neighborhood || '',
          city: processedUpdates.address.city || '',
          state: processedUpdates.address.state || '',
          zipCode: processedUpdates.address.zipCode || '',
          reference: processedUpdates.address.reference || ''
        }
      }
    }
    
    // Garantir que telefone seja limpo (apenas números) se fornecido
    if (processedUpdates.phone) {
      // Manter formatação do telefone se fornecida
      processedUpdates.phone = processedUpdates.phone.toString()
    }
    
    console.log('📋 Atualizando usuário:', userId)
    console.log('📨 Updates processados:', JSON.stringify(processedUpdates, null, 2))
    
    const updatedUser = {
      ...currentUser,
      ...processedUpdates,
      updatedAt: new Date().toISOString()
    }

    // Verificar se email já existe em outro usuário
    if (updates.email && updates.email !== currentUser.email) {
      const emailExists = users.some((u: any, index: number) => 
        index !== userIndex && u.email === updates.email
      )
      
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Este email já está em uso' },
          { status: 400 }
        )
      }
    }

    users[userIndex] = updatedUser

    // Salvar arquivo
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2))

    // Retornar usuário atualizado (sem senha)
    const { password, ...userWithoutPassword } = updatedUser
    
    return NextResponse.json({ 
      success: true, 
      user: userWithoutPassword 
    })

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
