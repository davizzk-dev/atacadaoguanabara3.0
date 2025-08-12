'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User, MessageCircle, Camera, Mic, Play, Pause, X } from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'admin'
  message: string
  timestamp: string
  type?: 'text' | 'image' | 'audio'
  mediaUrl?: string
  mediaName?: string
}

interface ChatInterfaceProps {
  requestId: string
  requestType: 'camera' | 'return'
  requestName: string
  requestStatus: string
  onStatusChange: (status: string) => void
  onMessageSent?: () => void
  sender?: 'user' | 'admin'
}

export default function ChatInterface({
  requestId,
  requestType,
  requestName,
  requestStatus,
  onStatusChange,
  onMessageSent,
  sender = 'admin'
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [chatImages, setChatImages] = useState<File[]>([])
  const [isPlayingAudio, setIsPlayingAudio] = useState<{[key: string]: boolean}>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatImageInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

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

  // Carregar mensagens do request selecionado
  const loadMessages = async () => {
    if (!requestId) return
    try {
      const endpoint = requestType === 'camera'
        ? `/api/camera-requests/${requestId}/messages`
        : `/api/return-requests/${requestId}/messages`
      // Evitar cache do navegador durante o chat
      const url = `${endpoint}?t=${Date.now()}`
      const response = await fetch(url, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        const msgs = data?.data?.messages || []
        setMessages(Array.isArray(msgs) ? msgs : [])
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // Funções de mídia
  const handleChatImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setChatImages(prev => [...prev, ...imageFiles])
  }

  const removeChatImage = (index: number) => {
    setChatImages(prev => prev.filter((_, i) => i !== index))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const playAudio = (messageId: string, audioUrl: string) => {
    if (audioRef.current) {
      if (isPlayingAudio[messageId]) {
        audioRef.current.pause()
        setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
      } else {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setIsPlayingAudio(prev => ({ ...prev, [messageId]: true }))
        
        audioRef.current.onended = () => {
          setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
        }
      }
    }
  }

  // Enviar mensagem
  const sendMessage = async () => {
    if ((!newMessage.trim() && chatImages.length === 0 && !audioUrl) || isLoading || !requestId) return

    setIsLoading(true)
    try {
      let messagesSent = false

      // Enviar mensagem de texto
      if (newMessage.trim()) {
        // Otimista: mostra a mensagem imediatamente
        const optimistic: Message = {
          id: `optimistic-${Date.now()}`,
          sender,
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          type: 'text'
        }
        setMessages(prev => [...prev, optimistic])
        const endpoint = requestType === 'camera' ? `/api/camera-requests/chat` : `/api/return-requests/chat`
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            requestId,
            message: newMessage.trim(),
            sender,
            type: 'text'
          })
        })

        if (response.ok) {
          setNewMessage('')
          messagesSent = true
        }
      }

      // Enviar imagens
    if (chatImages.length > 0) {
        for (const image of chatImages) {
          const formData = new FormData()
          formData.append('file', image)
          formData.append('requestId', requestId)
          formData.append('sender', sender)
          formData.append('type', 'image')

      await fetch(requestType === 'camera' ? '/api/camera-requests/chat' : '/api/return-requests/chat', {
            method: 'POST',
            body: formData
          })
        }
        setChatImages([])
        messagesSent = true
      }

      // Enviar áudio
      if (audioUrl) {
        const response = await fetch(audioUrl)
        const blob = await response.blob()
        const formData = new FormData()
        formData.append('file', blob, 'audio.wav')
        formData.append('requestId', requestId)
  formData.append('sender', sender)
        formData.append('type', 'audio')

        await fetch(requestType === 'camera' ? '/api/camera-requests/chat' : '/api/return-requests/chat', {
          method: 'POST',
          body: formData
        })
        
        setAudioUrl(null)
        messagesSent = true
      }

      if (messagesSent) {
        // Pequeno atraso para garantir persistência no arquivo e evitar race condition
        await new Promise(r => setTimeout(r, 120))
        await loadMessages()
        if (onMessageSent) onMessageSent()
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

  // Polling leve para sincronizar mensagens de ambos os lados
  useEffect(() => {
    if (!requestId) return
    const id = setInterval(() => {
      loadMessages()
    }, 1500)
    return () => clearInterval(id)
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
          {sender === 'admin' ? (
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
          ) : (
            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
              {requestStatus === 'pending' ? 'Pendente' : requestStatus === 'approved' ? 'Aprovado' : requestStatus === 'rejected' ? 'Rejeitado' : requestStatus === 'completed' ? 'Concluído' : requestStatus}
            </span>
          )}
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
                {message.type === 'image' && message.mediaUrl && (
                  <div className="mb-2">
                    <img
                      src={message.mediaUrl}
                      alt="Imagem enviada"
                      className="max-w-full h-auto rounded-lg cursor-pointer"
                      onClick={() => window.open(message.mediaUrl, '_blank')}
                    />
                  </div>
                )}
                
                {message.type === 'audio' && message.mediaUrl && (
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => playAudio(message.id, message.mediaUrl!)}
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        message.sender === 'admin' 
                          ? 'bg-white bg-opacity-20 hover:bg-opacity-30' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    >
                      {isPlayingAudio[message.id] ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </button>
                    <span className="text-sm">Áudio</span>
                  </div>
                )}
                
                {message.message && (
                  <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                )}
                
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
        {/* Preview de imagens selecionadas */}
        {chatImages.length > 0 && (
          <div className="flex gap-2 p-3 bg-gray-100 rounded-lg mb-3 flex-wrap">
            {chatImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
                />
                <button
                  onClick={() => removeChatImage(index)}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Preview de áudio */}
        {audioUrl && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-medium text-blue-900">Áudio gravado</span>
                <p className="text-xs text-blue-700">Pronto para enviar</p>
              </div>
            </div>
            <button
              onClick={() => setAudioUrl(null)}
              className="text-red-600 hover:text-red-700 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Botões de mídia */}
        <div className="flex gap-2 mb-3">
          <input
            ref={chatImageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChatImageUpload}
            className="hidden"
          />
          <button
            onClick={() => chatImageInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Camera className="h-4 w-4" />
            Foto
          </button>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm ${
              isRecording 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
            {isRecording ? 'Parar' : 'Áudio'}
          </button>
        </div>

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
            disabled={(!newMessage.trim() && chatImages.length === 0 && !audioUrl) || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <Send className="h-4 w-4" />
            <span>Enviar</span>
          </button>
        </div>
      </div>

      {/* Audio element para reprodução */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
