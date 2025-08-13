import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const chatsFilePath = path.join(process.cwd(), 'data', 'chats.json')

// Garantir que o arquivo de chats existe
const ensureChatsFileExists = async () => {
  try {
    await fs.access(chatsFilePath)
  } catch (error) {
    // Se o arquivo não existe, criar com array vazio
    await fs.writeFile(chatsFilePath, JSON.stringify([], null, 2))
  }
}

// Interface para mensagem de chat
interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderType: 'user' | 'admin'
  message: string
  timestamp: string
  isRead: boolean
  attachments?: string[]
}

// Interface para conversa
interface Conversation {
  id: string
  userId: string
  userName: string
  userEmail: string
  subject: string
  status: 'open' | 'closed' | 'waiting'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
  assignedAdmin?: string
  lastMessage?: string
  unreadCount: number
}

// GET - Buscar conversas e mensagens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')
    const adminView = searchParams.get('adminView') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    await ensureChatsFileExists()
    
    const chatsData = await fs.readFile(chatsFilePath, 'utf8')
    const { conversations = [], messages = [] } = JSON.parse(chatsData) || {}

    console.log('🔍 Buscando dados de chat:', {
      conversationId,
      userId,
      adminView,
      totalConversations: conversations.length,
      totalMessages: messages.length
    })

    // Se está buscando uma conversa específica, retornar mensagens
    if (conversationId) {
      const conversationMessages = messages
        .filter((msg: ChatMessage) => msg.conversationId === conversationId)
        .sort((a: ChatMessage, b: ChatMessage) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-limit)

      const conversation = conversations.find((conv: Conversation) => conv.id === conversationId)

      return NextResponse.json({
        success: true,
        data: {
          conversation,
          messages: conversationMessages
        }
      })
    }

    // Se é um usuário específico, retornar suas conversas
    if (userId && !adminView) {
      const userConversations = conversations
        .filter((conv: Conversation) => conv.userId === userId)
        .sort((a: Conversation, b: Conversation) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      return NextResponse.json({
        success: true,
        data: {
          conversations: userConversations
        }
      })
    }

    // Se é visão admin, retornar todas as conversas
    if (adminView) {
      const sortedConversations = conversations
        .sort((a: Conversation, b: Conversation) => {
          // Ordenar por prioridade e depois por data de atualização
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        })

      const stats = {
        total: conversations.length,
        open: conversations.filter((conv: Conversation) => conv.status === 'open').length,
        waiting: conversations.filter((conv: Conversation) => conv.status === 'waiting').length,
        closed: conversations.filter((conv: Conversation) => conv.status === 'closed').length,
        unread: conversations.filter((conv: Conversation) => conv.unreadCount > 0).length
      }

      return NextResponse.json({
        success: true,
        data: {
          conversations: sortedConversations,
          stats
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        conversations: [],
        messages: []
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao buscar dados de chat:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// POST - Enviar mensagem ou criar conversa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conversationId,
      userId,
      userName,
      userEmail,
      senderId,
      senderName,
      senderType,
      message,
      subject,
      priority = 'medium',
      attachments = []
    } = body

    await ensureChatsFileExists()
    
    const chatsData = await fs.readFile(chatsFilePath, 'utf8')
    const data = JSON.parse(chatsData) || {}
    const conversations = data.conversations || []
    const messages = data.messages || []

    const timestamp = new Date().toISOString()
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Se não tem conversationId, criar nova conversa
    let targetConversationId = conversationId
    
    if (!conversationId) {
      targetConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const newConversation: Conversation = {
        id: targetConversationId,
        userId: userId || senderId,
        userName: userName || senderName,
        userEmail: userEmail || '',
        subject: subject || 'Nova conversa',
        status: 'open',
        priority,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastMessage: message.substring(0, 100),
        unreadCount: senderType === 'user' ? 1 : 0
      }
      
      conversations.push(newConversation)
      console.log('✅ Nova conversa criada:', targetConversationId)
    } else {
      // Atualizar conversa existente
      const conversationIndex = conversations.findIndex((conv: Conversation) => conv.id === conversationId)
      if (conversationIndex !== -1) {
        conversations[conversationIndex] = {
          ...conversations[conversationIndex],
          updatedAt: timestamp,
          lastMessage: message.substring(0, 100),
          unreadCount: senderType === 'user' 
            ? conversations[conversationIndex].unreadCount + 1 
            : conversations[conversationIndex].unreadCount,
          status: senderType === 'user' ? 'waiting' : conversations[conversationIndex].status
        }
      }
    }

    // Criar nova mensagem
    const newMessage: ChatMessage = {
      id: messageId,
      conversationId: targetConversationId,
      senderId: senderId || userId,
      senderName: senderName || userName,
      senderType,
      message,
      timestamp,
      isRead: false,
      attachments
    }

    messages.push(newMessage)

    // Salvar dados atualizados
    const updatedData = {
      conversations,
      messages
    }

    await fs.writeFile(chatsFilePath, JSON.stringify(updatedData, null, 2))

    console.log('✅ Mensagem enviada:', {
      messageId,
      conversationId: targetConversationId,
      senderType
    })

    return NextResponse.json({
      success: true,
      data: {
        message: newMessage,
        conversationId: targetConversationId
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ Erro ao enviar mensagem:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}

// PUT - Atualizar conversa (marcar como lida, alterar status, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      conversationId,
      status,
      assignedAdmin,
      priority,
      markAsRead = false
    } = body

    await ensureChatsFileExists()
    
    const chatsData = await fs.readFile(chatsFilePath, 'utf8')
    const data = JSON.parse(chatsData) || {}
    const conversations = data.conversations || []
    const messages = data.messages || []

    // Atualizar conversa
    const conversationIndex = conversations.findIndex((conv: Conversation) => conv.id === conversationId)
    if (conversationIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Conversa não encontrada'
      }, { status: 404 })
    }

    const updatedFields: Partial<Conversation> = {
      updatedAt: new Date().toISOString()
    }

    if (status) updatedFields.status = status
    if (assignedAdmin) updatedFields.assignedAdmin = assignedAdmin
    if (priority) updatedFields.priority = priority
    if (markAsRead) updatedFields.unreadCount = 0

    conversations[conversationIndex] = {
      ...conversations[conversationIndex],
      ...updatedFields
    }

    // Se marcar como lida, marcar mensagens também
    if (markAsRead) {
      messages.forEach((msg: ChatMessage) => {
        if (msg.conversationId === conversationId) {
          msg.isRead = true
        }
      })
    }

    // Salvar dados atualizados
    const updatedData = {
      conversations,
      messages
    }

    await fs.writeFile(chatsFilePath, JSON.stringify(updatedData, null, 2))

    console.log('✅ Conversa atualizada:', conversationId)

    return NextResponse.json({
      success: true,
      data: conversations[conversationIndex]
    })

  } catch (error: any) {
    console.error('❌ Erro ao atualizar conversa:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 })
  }
}
