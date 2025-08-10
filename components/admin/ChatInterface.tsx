'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'admin'
  message: string
  timestamp: string
}

interface ChatInterfaceProps {
  requestId: string
  requestType: 'camera' | 'return'
  requestName: string
  requestStatus: string
  onStatusChange: (status: string) => void
  onMessageSent?: () => void
}

export default function ChatInterface({
  requestId,
  requestType,
  requestName,
  requestStatus,
  onStatusChange,
  onMessageSent
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Status options baseado no tipo de solicitação
  const statusOptions = requestType === 'camera' 
    ? [
        { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'processing', label: 'Processando', color: 'bg-blue-100 text-blue-800' },
        { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' }
      ]
    : [
        { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800' },
        { value: 'rejected', label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
        { value: 'completed', label: 'Concluído', color: 'bg-blue-100 text-blue-800' }
      ]

  // Carregar mensagens
  const loadMessages = async () => {
    if (!requestId) return
    
    try {
      const endpoint = requestType === 'camera' 
        ? `/api/camera-requests/${requestId}/messages`
        : `/api/return-requests/${requestId}/messages`
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.data.messages || [])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // Enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading || !requestId) return

    setIsLoading(true)
    try {
      const endpoint = requestType === 'camera' 
        ? `/api/camera-requests/${requestId}/messages`
        : `/api/return-requests/${requestId}/messages`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: newMessage.trim(),
          sender: 'admin'
        })
      })

      if (response.ok) {
        setNewMessage('')
        // Recarregar mensagens após enviar
        await loadMessages()
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Atualizar status
  const handleStatusChange = async (newStatus: string) => {
    if (!requestId) return
    
    try {
      const endpoint = requestType === 'camera' 
        ? `/api/camera-requests/${requestId}/status`
        : `/api/return-requests/${requestId}/status`
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        onStatusChange(newStatus)
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Carregar mensagens quando requestId mudar
  useEffect(() => {
    if (requestId) {
      loadMessages()
    }
  }, [requestId])

  // Auto-scroll quando mensagens mudarem
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handler para Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{requestName}</h3>
              <p className="text-sm text-gray-500">
                {requestType === 'camera' ? 'Solicitação de Câmera' : 'Trocas/Devoluções'}
              </p>
            </div>
          </div>
          <select 
            value={requestStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Inicie a conversa enviando uma mensagem</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id}
              className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender === 'admin' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'admin' ? 'opacity-75' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <Send className="h-4 w-4" />
            <span>Enviar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
