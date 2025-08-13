'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, X, Check, Package, RotateCcw, Shield, Clock, MessageCircle, FileText, Plus, Send, Camera, Mic, Image as ImageIcon, Play, Pause } from 'lucide-react'
import { toast } from 'sonner'
import Header from '@/components/header'
import { Footer } from '@/components/footer'

interface ReturnFormData {
  orderId: string
  userName: string
  userEmail: string
  userPhone: string
  productName: string
  productId?: string
  quantity: number
  requestType: 'exchange' | 'refund'
  reason: string
  description?: string
  photos: File[]
}

interface ReturnRequest {
  id: string
  orderId: string
  userName: string
  productName: string
  requestType: 'exchange' | 'refund'
  reason: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  createdAt: string
  messages?: ChatMessage[]
}

interface ChatMessage {
  id: string
  sender: 'user' | 'admin'
  message: string
  timestamp: string
  type?: 'text' | 'image' | 'audio'
  mediaUrl?: string
  mediaName?: string
}

const RETURN_REASONS = [
  'Produto defeituoso',
  'Produto diferente do anunciado',
  'Produto danificado na entrega',
  'Arrependimento da compra',
  'Produto não atende às expectativas',
  'Erro no pedido',
  'Outro motivo'
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800'
    case 'rejected': return 'bg-red-100 text-red-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'completed': return 'bg-purple-100 text-purple-800'
    default: return 'bg-yellow-100 text-yellow-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Pendente'
    case 'approved': return 'Aprovado'
    case 'rejected': return 'Rejeitado'
    case 'processing': return 'Processando'
    case 'completed': return 'Concluído'
    default: return 'Pendente'
  }
}

export default function ReturnsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('auto')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<ReturnRequest | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showChatPrompt, setShowChatPrompt] = useState(false)
  const [hasUnresolvedRequests, setHasUnresolvedRequests] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [chatImages, setChatImages] = useState<File[]>([])
  const [isPlayingAudio, setIsPlayingAudio] = useState<{[key: string]: boolean}>({})
  const chatImageInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Polling para atualizar mensagens em tempo real
  const [chatPolling, setChatPolling] = useState<NodeJS.Timeout | null>(null)
  
  const [formData, setFormData] = useState<ReturnFormData>({
    orderId: '',
    userName: '',
    userEmail: '',
    userPhone: '',
    productName: '',
    productId: '',
    quantity: 1,
    requestType: 'exchange',
    reason: '',
    description: '',
    photos: []
  })

  // Carregar solicitações existentes
  useEffect(() => {
    loadReturnRequests()
  }, [])

  // Polling para atualizar mensagens em tempo real APENAS quando chat está aberto
  useEffect(() => {
    if (isChatOpen && selectedChat && !chatPolling) {
      const interval = setInterval(() => {
        loadReturnRequests()
      }, 3000) // Atualiza a cada 3 segundos
      setChatPolling(interval)
    } else if ((!isChatOpen || !selectedChat) && chatPolling) {
      clearInterval(chatPolling)
      setChatPolling(null)
    }

    return () => {
      if (chatPolling) {
        clearInterval(chatPolling)
      }
    }
  }, [isChatOpen, selectedChat])

  // Auto-scroll para a última mensagem com delay
  useEffect(() => {
    if (chatContainerRef.current && selectedChat?.messages) {
      setTimeout(() => {
        const container = chatContainerRef.current
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 100)
    }
  }, [selectedChat?.messages])

  // Cleanup do polling ao desmontar
  useEffect(() => {
    return () => {
      if (chatPolling) {
        clearInterval(chatPolling)
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }
    }
  }, [])

  // Verificar se deve mostrar chat ou formulário
  useEffect(() => {
    if (returnRequests.length > 0) {
      const unresolvedRequests = returnRequests.filter(req => 
        req.status === 'pending' || req.status === 'processing' || req.status === 'approved'
      )
      
      setHasUnresolvedRequests(unresolvedRequests.length > 0)
      
      if (unresolvedRequests.length > 0) {
        setActiveTab('list')
        setShowChatPrompt(true)
        setTimeout(() => setShowChatPrompt(false), 5000)
      } else {
        setActiveTab('new')
      }
    } else {
      setActiveTab('new')
    }
  }, [returnRequests])

  const loadReturnRequests = async () => {
    try {
      const response = await fetch('/api/return-requests')
      if (response.ok) {
        const data = await response.json()
        const newRequests = data.data || data || []
        setReturnRequests(newRequests)
        
        // Atualizar chat selecionado se existir
        if (selectedChat) {
          const updatedChat = newRequests.find((req: ReturnRequest) => req.id === selectedChat.id)
          if (updatedChat) {
            setSelectedChat(updatedChat)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
      toast.error('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ReturnFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (formData.photos.length + imageFiles.length > 5) {
      toast.error('Máximo de 5 fotos permitido')
      return
    }

    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...imageFiles]
    }))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/return-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          userName: formData.userName,
          userEmail: formData.userEmail,
          userPhone: formData.userPhone,
          productName: formData.productName,
          productId: formData.productId,
          quantity: formData.quantity,
          requestType: formData.requestType,
          reason: formData.reason,
          description: formData.description
        })
      })

      if (!response.ok) {
        throw new Error('Erro na resposta da API')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Solicitação de troca/devolução enviada com sucesso!')
        setShowSuccess(true)
        setFormData({
          orderId: '',
          userName: '',
          userEmail: '',
          userPhone: '',
          productName: '',
          productId: '',
          quantity: 1,
          requestType: 'exchange',
          reason: '',
          description: '',
          photos: []
        })
        loadReturnRequests()
        setActiveTab('list')
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        throw new Error(result.message || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funções de mídia para chat
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
      toast.info('Gravação iniciada - clique novamente para parar')
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      toast.error('Erro ao acessar microfone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
      toast.success('Gravação finalizada')
    }
  }

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (!selectedChat) return
    if (!newMessage.trim() && chatImages.length === 0 && !audioUrl) return

    try {
      let messagesSent = false

      // Enviar mensagem de texto
      if (newMessage.trim()) {
        const response = await fetch('/api/return-requests/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requestId: selectedChat.id,
            message: newMessage,
            sender: 'user',
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
          formData.append('requestId', selectedChat.id)
          formData.append('sender', 'user')
          formData.append('type', 'image')

          await fetch('/api/return-requests/chat', {
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
        formData.append('requestId', selectedChat.id)
        formData.append('sender', 'user')
        formData.append('type', 'audio')

        await fetch('/api/return-requests/chat', {
          method: 'POST',
          body: formData
        })
        
        setAudioUrl(null)
        messagesSent = true
      }

      if (messagesSent) {
        await loadReturnRequests()
        toast.success('Mensagem enviada!')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
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

  const openChat = (request: ReturnRequest) => {
    setSelectedChat(request)
    setIsChatOpen(true)
  }

  const closeChat = () => {
    setIsChatOpen(false)
    setSelectedChat(null)
    setNewMessage('')
    setChatImages([])
    setAudioUrl(null)
    if (chatPolling) {
      clearInterval(chatPolling)
      setChatPolling(null)
    }
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender === 'user'
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div
          className={`max-w-2xl lg:max-w-4xl px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200'
          }`}
        >
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
              <Button
                size="sm"
                variant={isUser ? "secondary" : "default"}
                onClick={() => playAudio(message.id, message.mediaUrl!)}
                className="h-8 w-8 p-0"
              >
                {isPlayingAudio[message.id] ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
              <span className="text-sm">Áudio</span>
            </div>
          )}
          
          {message.message && (
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          )}
          
          <p className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/')}
              className="hover:bg-orange-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trocas e Devoluções</h1>
              <p className="text-gray-600 mt-2">Gerencie suas solicitações de troca e devolução</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="list" 
                className="flex items-center gap-2"
                disabled={!hasUnresolvedRequests && returnRequests.length === 0}
              >
                <MessageCircle className="h-4 w-4" />
                {hasUnresolvedRequests ? 'Chat' : 'Minhas Solicitações'}
                {hasUnresolvedRequests && (
                  <Badge variant="destructive" className="ml-1">
                    {returnRequests.filter(req => req.status === 'pending' || req.status === 'processing' || req.status === 'approved').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="new" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Solicitação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              {hasUnresolvedRequests ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Suas Solicitações Pendentes</h3>
                        <p className="text-blue-700 text-sm">
                          Você tem solicitações em andamento. Use o chat para acompanhar o status.
                        </p>
                      </div>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Carregando solicitações...</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {returnRequests
                        .filter(req => req.status === 'pending' || req.status === 'processing' || req.status === 'approved')
                        .map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">Pedido #{request.orderId}</CardTitle>
                                <CardDescription>
                                  {request.productName} • {request.requestType === 'exchange' ? 'Troca' : 'Devolução'}
                                </CardDescription>
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusText(request.status)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                <strong>Motivo:</strong> {request.reason}
                              </p>
                              {request.description && (
                                <p className="text-sm text-gray-600">
                                  <strong>Descrição:</strong> {request.description}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">
                                Criado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            
                            <div className="mt-4">
                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={() => openChat(request)}
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Abrir Chat
                                {request.messages && request.messages.length > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    {request.messages.length} mensagens
                                  </Badge>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Carregando solicitações...</p>
                    </div>
                  ) : returnRequests.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma solicitação encontrada</h3>
                        <p className="text-gray-600 text-center mb-4">
                          Você ainda não fez nenhuma solicitação de troca ou devolução.
                        </p>
                        <Button 
                          onClick={() => setActiveTab('new')}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Fazer Nova Solicitação
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {returnRequests.map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">Pedido #{request.orderId}</CardTitle>
                                <CardDescription>
                                  {request.productName} • {request.requestType === 'exchange' ? 'Troca' : 'Devolução'}
                                </CardDescription>
                              </div>
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusText(request.status)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-gray-600">
                                <strong>Motivo:</strong> {request.reason}
                              </p>
                              {request.description && (
                                <p className="text-sm text-gray-600">
                                  <strong>Descrição:</strong> {request.description}
                                </p>
                              )}
                              <p className="text-sm text-gray-500">
                                Criado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Nova Solicitação de Troca ou Devolução
                  </CardTitle>
                  <CardDescription>
                    Preencha os dados abaixo para solicitar uma troca ou devolução
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="orderId">Número do Pedido *</Label>
                        <Input
                          id="orderId"
                          value={formData.orderId}
                          onChange={(e) => handleInputChange('orderId', e.target.value)}
                          placeholder="Ex: #12345"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="userName">Nome Completo *</Label>
                        <Input
                          id="userName"
                          value={formData.userName}
                          onChange={(e) => handleInputChange('userName', e.target.value)}
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="userEmail">E-mail *</Label>
                        <Input
                          id="userEmail"
                          type="email"
                          value={formData.userEmail}
                          onChange={(e) => handleInputChange('userEmail', e.target.value)}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="userPhone">Telefone *</Label>
                        <Input
                          id="userPhone"
                          value={formData.userPhone}
                          onChange={(e) => handleInputChange('userPhone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="productName">Nome do Produto *</Label>
                        <Input
                          id="productName"
                          value={formData.productName}
                          onChange={(e) => handleInputChange('productName', e.target.value)}
                          placeholder="Nome do produto"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Tipo de Solicitação *</Label>
                      <RadioGroup 
                        value={formData.requestType} 
                        onValueChange={(value) => handleInputChange('requestType', value)}
                        className="flex gap-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="exchange" id="exchange" />
                          <Label htmlFor="exchange">Troca</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="refund" id="refund" />
                          <Label htmlFor="refund">Devolução</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="reason">Motivo *</Label>
                      <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {RETURN_REASONS.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição Adicional</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Descreva detalhes sobre o problema ou sua solicitação"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Fotos (Opcional - Máximo 5)</Label>
                      <div className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-dashed"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Adicionar Fotos
                        </Button>
                      </div>
                      
                      {formData.photos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          {formData.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={() => removePhoto(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/')}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enviando...
                          </>
                        ) : (
                          'Enviar Solicitação'
                        )}cd 
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Dialog do Chat - FORA das tabs para funcionar independente */}
          {isChatOpen && selectedChat && (
            <Dialog open={isChatOpen} onOpenChange={(open) => !open && closeChat()}>
              <DialogContent 
                className="max-w-[95vw] max-h-[98vh] flex flex-col p-0"
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
              >
                <DialogHeader className="flex-shrink-0 p-6 pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle>Chat - Pedido #{selectedChat.orderId}</DialogTitle>
                      <DialogDescription>
                        Converse com nossa equipe sobre sua solicitação
                      </DialogDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeChat}
                      className="h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 flex flex-col min-h-0 p-6 pt-4">
                  {/* Container de mensagens com scroll fixo */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 border rounded-lg p-4 overflow-y-auto bg-gray-50 min-h-[500px] max-h-[70vh] scroll-smooth"
                    style={{ scrollBehavior: 'smooth' }}
                    onScroll={(e) => e.stopPropagation()}
                  >
                    {selectedChat?.messages && selectedChat.messages.length > 0 ? (
                      <div className="space-y-3">
                        {selectedChat.messages.map(renderMessage)}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-lg font-medium">Inicie a conversa</p>
                          <p className="text-sm">Envie uma mensagem para começar</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Preview de imagens selecionadas */}
                  {chatImages.length > 0 && (
                    <div className="flex gap-2 p-3 bg-gray-100 rounded-lg mt-3 flex-wrap">
                      {chatImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            onClick={() => removeChatImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Preview de áudio */}
                  {audioUrl && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Mic className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-blue-900">Áudio gravado</span>
                          <p className="text-xs text-blue-700">Pronto para enviar</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAudioUrl(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Controles de entrada */}
                  <div className="flex-shrink-0 space-y-3 pt-4 border-t bg-white">
                    {/* Botões de mídia */}
                    <div className="flex gap-2">
                      <input
                        ref={chatImageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleChatImageUpload}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => chatImageInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Foto
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-2 ${isRecording ? 'bg-red-50 border-red-200 text-red-700' : ''}`}
                      >
                        <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                        {isRecording ? 'Parar' : 'Áudio'}
                      </Button>
                    </div>
                    
                    {/* Input de texto e enviar */}
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <Button 
                        type="submit"
                        disabled={!newMessage.trim() && chatImages.length === 0 && !audioUrl}
                        className="bg-blue-600 hover:bg-blue-700 px-4"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Mensagem flutuante para chat */}
          {showChatPrompt && hasUnresolvedRequests && (
            <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
              <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm relative">
                <button
                  onClick={() => setShowChatPrompt(false)}
                  className="absolute top-2 right-2 text-white hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📢 Você tem solicitações pendentes!</h4>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      Use o chat para conversar com nossa equipe sobre suas solicitações em andamento.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3 bg-white text-blue-600 hover:bg-gray-100 text-xs"
                      onClick={() => {
                        setShowChatPrompt(false)
                        setActiveTab('list')
                      }}
                    >
                      Ver Chats
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showSuccess && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="text-center py-8">
                  <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Solicitação Enviada!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Sua solicitação de {formData.requestType === 'exchange' ? 'troca' : 'devolução'} foi enviada com sucesso. 
                    Nossa equipe entrará em contato em breve.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>Retornando automaticamente...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Audio element para reprodução */}
      <audio ref={audioRef} className="hidden" />

      <Footer />
    </div>
  )
}
