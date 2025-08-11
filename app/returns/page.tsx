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
  
  // Estados para touch gestures e mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  
  // Estados para gravação por arrastar (WhatsApp style)
  const [isPressingMic, setIsPressingMic] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const micButtonRef = useRef<HTMLButtonElement>(null)
  
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
      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
    }
  }, [])

  // Verificar permissões de microfone no mobile
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          console.log('Permissão de microfone:', result.state)
          
          if (result.state === 'denied') {
            console.warn('Permissão de microfone negada')
          }
        } catch (error) {
          console.log('Não foi possível verificar permissões:', error)
        }
      }
    }
    
    checkMicrophonePermission()
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

  // Funções para gravação por arrastar (WhatsApp style) - Mobile Optimized
  const startDragRecording = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // Solicitar permissão explicitamente no mobile
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Gravação de áudio não suportada neste dispositivo')
        return
      }

      // Configurações otimizadas para mobile
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000, min: 8000, max: 44100 },
          channelCount: { ideal: 1 },
          sampleSize: { ideal: 16 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Detectar formato suportado no mobile
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav'
        }
      }
      
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        stream.getTracks().forEach(track => {
          track.stop()
        })
      }

      recorder.onerror = (e) => {
        console.error('Erro de gravação:', e)
        toast.error('Erro durante a gravação')
        cancelRecording()
      }

      recorder.start(250) // Intervalo maior para mobile
      setMediaRecorder(recorder)
      setIsPressingMic(true)
      setIsRecording(true)
      setRecordingTime(0)
      
      // Timer para mostrar tempo de gravação
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)
      
      // Feedback tátil no mobile
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      toast.success('🎤 Gravando...', { duration: 1000 })
    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada. Habilite nas configurações do navegador.')
      } else if (error.name === 'NotFoundError') {
        toast.error('Microfone não encontrado')
      } else {
        toast.error('Erro ao acessar microfone: ' + error.message)
      }
    }
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPressingMic) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const micButton = micButtonRef.current
    
    if (micButton) {
      const rect = micButton.getBoundingClientRect()
      const distance = rect.bottom - clientY
      setDragDistance(Math.max(0, distance))
      
      // Feedback visual e tátil
      if (distance > 80) {
        if (navigator.vibrate) {
          navigator.vibrate(20)
        }
      }
      
      // Se arrastar mais de 120px para cima, cancela a gravação
      if (distance > 120) {
        cancelRecording()
      }
    }
  }

  const finishRecording = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    setIsPressingMic(false)
    setIsRecording(false)
    setDragDistance(0)
    
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    
    // Feedback tátil
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }
    
    if (recordingTime < 1) {
      toast.warning('Gravação muito curta')
      setAudioUrl(null)
    } else {
      toast.success(`✅ Áudio gravado! ${recordingTime}s`)
    }
    
    setRecordingTime(0)
  }

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    setIsPressingMic(false)
    setIsRecording(false)
    setDragDistance(0)
    setAudioUrl(null)
    
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    
    // Feedback tátil de cancelamento
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50])
    }
    
    setRecordingTime(0)
    toast.error('❌ Gravação cancelada')
  }

  const startRecording = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } 
        })
        
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        })
        
        const chunks: BlobPart[] = []

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
          
          // Parar todas as tracks do stream
          stream.getTracks().forEach(track => {
            track.stop()
          })
        }

        recorder.onerror = (e) => {
          console.error('Erro na gravação:', e)
          toast.error('Erro durante a gravação')
          setIsRecording(false)
          setMediaRecorder(null)
        }

        recorder.start(100) // Capturar dados a cada 100ms
        setMediaRecorder(recorder)
        setIsRecording(true)
        toast.success('Gravação iniciada - clique novamente para parar')
      } else {
        throw new Error('getUserMedia não suportado')
      }
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      toast.error('Erro ao acessar microfone. Verifique as permissões.')
      setIsRecording(false)
      setMediaRecorder(null)
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

  const playAudio = async (messageId: string, audioUrl: string) => {
    try {
      if (audioRef.current) {
        // Parar qualquer áudio que esteja tocando
        Object.keys(isPlayingAudio).forEach(id => {
          if (isPlayingAudio[id] && id !== messageId) {
            setIsPlayingAudio(prev => ({ ...prev, [id]: false }))
          }
        })
        
        if (isPlayingAudio[messageId]) {
          // Pausar o áudio atual
          audioRef.current.pause()
          setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
        } else {
          // Reproduzir novo áudio
          audioRef.current.src = audioUrl
          setIsPlayingAudio(prev => ({ ...prev, [messageId]: true }))
          
          // Configurar eventos do áudio
          audioRef.current.onended = () => {
            setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
          }
          
          audioRef.current.onerror = (e) => {
            console.error('Erro ao reproduzir áudio:', e)
            setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
            toast.error('Erro ao reproduzir áudio')
          }
          
          await audioRef.current.play()
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error)
      setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
      toast.error('Erro ao reproduzir áudio')
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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-sm lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white border border-gray-200 rounded-bl-md'
          }`}
        >
          {/* Renderizar imagem */}
          {message.type === 'image' && message.mediaUrl && (
            <div className="mb-2">
              <img
                src={message.mediaUrl}
                alt="Imagem enviada"
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.mediaUrl, '_blank')}
                onError={(e) => {
                  console.error('Erro ao carregar imagem:', message.mediaUrl)
                  e.currentTarget.style.display = 'none'
                }}
              />
              {message.message && message.message !== 'Imagem enviada' && (
                <p className="text-sm mt-2 whitespace-pre-wrap">{message.message}</p>
              )}
            </div>
          )}
          
          {/* Renderizar áudio */}
          {message.type === 'audio' && message.mediaUrl && (
            <div className="mb-2">
              <div className="flex items-center gap-3 p-3 bg-black bg-opacity-10 rounded-lg">
                <Button
                  size="sm"
                  variant={isUser ? "secondary" : "default"}
                  onClick={() => playAudio(message.id, message.mediaUrl!)}
                  className="h-10 w-10 p-0 rounded-full"
                >
                  {isPlayingAudio[message.id] ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 opacity-70" />
                    <span className="text-sm font-medium">
                      {isPlayingAudio[message.id] ? 'Reproduzindo...' : 'Mensagem de áudio'}
                    </span>
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    Clique para {isPlayingAudio[message.id] ? 'pausar' : 'reproduzir'}
                  </div>
                </div>
              </div>
              {message.message && message.message !== 'Áudio enviado' && (
                <p className="text-sm mt-2 whitespace-pre-wrap">{message.message}</p>
              )}
            </div>
          )}
          
          {/* Renderizar mensagem de texto */}
          {(message.type === 'text' || !message.type) && message.message && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
          )}
          
          {/* Timestamp */}
          <p className={`text-xs mt-2 ${
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
                        )}
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
                className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden"
              >
                {/* Overlay de gravação - Mobile Optimized */}
                {isRecording && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full mx-4">
                      <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg">
                        <Mic className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-800">🎤 Gravando</h3>
                      <div className="text-3xl font-mono text-red-600 mb-4">{recordingTime}s</div>
                      <div className="text-sm text-gray-600 bg-gray-100 rounded-lg p-3">
                        {dragDistance > 80 ? (
                          <div className="text-red-600 font-bold text-base">
                            ⬆️ SOLTE PARA CANCELAR
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold">📱 Como usar:</div>
                            <div>• Mantenha pressionado</div>
                            <div>• Arraste ⬆️ para cancelar</div>
                            <div>• Solte para enviar</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogHeader className="flex-shrink-0 p-4 border-b">
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
                
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Container de mensagens com scroll LIVRE */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 p-4 overflow-y-scroll bg-gray-50"
                    style={{ 
                      maxHeight: 'calc(90vh - 200px)',
                      minHeight: '400px',
                      overflowY: 'scroll',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {selectedChat?.messages && selectedChat.messages.length > 0 ? (
                      <div className="space-y-4 pb-4">
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
                  
                  {/* Área de input fixo no bottom */}
                  <div className="flex-shrink-0 border-t bg-white">
                    {/* Preview de imagens selecionadas */}
                    {chatImages.length > 0 && (
                      <div className="p-3 border-b bg-gray-50">
                        <div className="flex gap-2 flex-wrap">
                          {chatImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full"
                                onClick={() => removeChatImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Preview de áudio */}
                    {audioUrl && (
                      <div className="p-3 border-b bg-green-50 border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                              <Mic className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-green-900">🎵 Áudio pronto!</span>
                              <p className="text-xs text-green-700">Clique em enviar para mandar</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAudioUrl(null)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 border-red-200"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Controles de entrada */}
                    <div className="p-4 space-y-3">
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
                        <button
                          ref={micButtonRef}
                          type="button"
                          className={`
                            px-4 py-2 rounded-lg border-2 flex items-center gap-2 select-none 
                            font-medium text-sm transition-all duration-200 min-w-[120px] justify-center
                            recording-button
                            ${isRecording 
                              ? 'bg-red-100 border-red-300 text-red-700 shadow-lg scale-105 recording-indicator' 
                              : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 active:scale-95'
                            } 
                            ${isPressingMic ? 'transform scale-110 shadow-xl' : ''}
                          `}
                          onMouseDown={startDragRecording}
                          onMouseMove={handleDragMove}
                          onMouseUp={finishRecording}
                          onMouseLeave={finishRecording}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            startDragRecording(e)
                          }}
                          onTouchMove={(e) => {
                            e.preventDefault()
                            handleDragMove(e)
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault()
                            finishRecording(e)
                          }}
                          onTouchCancel={(e) => {
                            e.preventDefault()
                            cancelRecording()
                          }}
                          style={{
                            transform: `translateY(-${Math.min(dragDistance, 50)}px)`,
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            touchAction: 'none'
                          }}
                        >
                          <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse text-red-600' : ''}`} />
                          {isRecording ? `🎤 ${recordingTime}s` : '🎤 Segurar'}
                        </button>
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

      {/* Audio element para reprodução com configurações otimizadas */}
      <audio 
        ref={audioRef} 
        className="hidden" 
        preload="auto"
        controls={false}
      />

      {/* Estilos para melhorar experiência touch */}
      <style jsx>{`
        .select-none {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        
        @media (max-width: 768px) {
          .chat-container {
            touch-action: pan-y;
          }
          
          .recording-button {
            touch-action: none;
          }
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.5s ease-out;
        }
        
        .recording-button {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          touch-action: none;
        }
        
        .recording-button:active {
          outline: none;
          transform: scale(1.1);
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .recording-indicator {
          animation: pulse 1s infinite;
        }
      `}</style>

      <Footer />
    </div>
  )
}
