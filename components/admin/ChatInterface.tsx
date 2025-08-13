'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle, Camera, Mic, Play, Pause, X, ChevronDown, Smile } from 'lucide-react'

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
  onBack?: () => void
}

export default function ChatInterface({
  requestId,
  requestType,
  requestName,
  requestStatus,
  onStatusChange,
  onMessageSent,
  sender = 'admin',
  onBack
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [chatImages, setChatImages] = useState<File[]>([])
  const [isPlayingAudio, setIsPlayingAudio] = useState<{ [key: string]: boolean }>({})
  const [isDragging, setIsDragging] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playingProgress, setPlayingProgress] = useState<number>(0)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showEmoji, setShowEmoji] = useState(false)
  const [shouldForceScrollBottom, setShouldForceScrollBottom] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesWrapRef = useRef<HTMLDivElement>(null)
  const chatImageInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recordingTimerRef = useRef<any>(null)
  
  // Sugestões rápidas por perfil
  const CLIENT_QUICK_REPLIES = [
    'Olá! Preciso de ajuda com meu pedido.',
    'Quero entender o status da minha solicitação.',
    'Posso enviar mais detalhes e fotos?'
  ]
  const ADMIN_QUICK_REPLIES = [
    'Olá! Estou analisando sua solicitação.',
    'Pode me enviar fotos do problema, por favor?',
    'Acabamos de atualizar o status, confira por favor.',
    'Obrigado! Qualquer dúvida, fico à disposição.'
  ]

  const statusOptions = requestType === 'camera'
    ? [
        { value: 'pending', label: 'Pendente' },
        { value: 'processing', label: 'Processando' },
        { value: 'completed', label: 'Concluído' }
      ]
    : [
        { value: 'pending', label: 'Pendente' },
        { value: 'approved', label: 'Aprovado' },
        { value: 'rejected', label: 'Rejeitado' },
        { value: 'completed', label: 'Concluído' }
      ]

  const loadMessages = async () => {
    if (!requestId) return
    try {
      const endpoint = requestType === 'camera'
        ? `/api/camera-requests/${requestId}/messages`
        : `/api/return-requests/${requestId}/messages`
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

      recorder.ondataavailable = (e) => { chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingSeconds(0)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const playAudio = (messageId: string, url: string) => {
    if (!audioRef.current) return
    if (isPlayingAudio[messageId]) {
      audioRef.current.pause()
      setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
      return
    }
    audioRef.current.src = url
    audioRef.current.play()
    setIsPlayingAudio(prev => ({ ...prev, [messageId]: true }))
    setPlayingId(messageId)
    audioRef.current.onended = () => {
      setIsPlayingAudio(prev => ({ ...prev, [messageId]: false }))
      setPlayingId(null)
      setPlayingProgress(0)
    }
    audioRef.current.ontimeupdate = () => {
      const a = audioRef.current!
      if (!a.duration || a.duration === Infinity) return
      setPlayingProgress(a.currentTime / a.duration)
    }
  }

  const sendMessage = async () => {
    if ((!newMessage.trim() && chatImages.length === 0 && !audioUrl) || isLoading || !requestId) return
    setIsLoading(true)
    try {
      let messagesSent = false

      if (newMessage.trim()) {
        const optimistic: Message = {
          id: `optimistic-${Date.now()}`,
          sender,
          message: newMessage.trim(),
          timestamp: new Date().toISOString(),
          type: 'text'
        }
        setMessages(prev => [...prev, optimistic])
        const endpoint = requestType === 'camera' ? '/api/camera-requests/chat' : '/api/return-requests/chat'
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, message: newMessage.trim(), sender, type: 'text' })
        })
        if (res.ok) {
          setNewMessage('')
          messagesSent = true
        }
      }

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

      if (audioUrl) {
        const resp = await fetch(audioUrl)
        const blob = await resp.blob()
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
        await new Promise(r => setTimeout(r, 120))
        await loadMessages()
  // ensure we bring the user to the latest after an explicit send
  setShouldForceScrollBottom(true)
        onMessageSent?.()
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!requestId) return
    try {
      const endpoint = requestType === 'camera' ? `/api/camera-requests/${requestId}/status` : `/api/return-requests/${requestId}/status`
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) onStatusChange(newStatus)
    } catch (e) {
      console.error('Erro ao atualizar status:', e)
    }
  }

  const scrollToBottom = () => {
    const el = messagesWrapRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  useEffect(() => {
    if (requestId) {
      loadMessages()
      setTimeout(() => {
        try {
          // Prevent scroll jump caused by focusing the input
          inputRef.current?.focus({ preventScroll: true } as any)
        } catch {}
      }, 0)
    }
  }, [requestId])

  useEffect(() => {
    if (!requestId) return
    const id = setInterval(loadMessages, 1500)
    return () => clearInterval(id)
  }, [requestId])

  useEffect(() => {
    // Only auto-scroll if already near bottom or after sending a message
    if (shouldForceScrollBottom || isAtBottom) {
      scrollToBottom()
      if (shouldForceScrollBottom) setShouldForceScrollBottom(false)
    }
  }, [messages, shouldForceScrollBottom, isAtBottom])

  useEffect(() => {
    const el = messagesWrapRef.current
    if (!el) return
    let isUserScrolling = false
    let raf = 0
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
        setIsAtBottom(atBottom)
        isUserScrolling = true
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    const images: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) images.push(new File([file], `pasted-${Date.now()}.png`, { type: file.type }))
      }
    }
    if (images.length) {
      e.preventDefault()
      setChatImages(prev => [...prev, ...images])
    }
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false)
    const files = Array.from(e.dataTransfer.files || [])
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length) setChatImages(prev => [...prev, ...imageFiles])
  }

  return (
    <div className="bg-white rounded-xl shadow-md h-[48rem] flex flex-col border border-gray-100">
      {/* Header com branding */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button type="button" aria-label="Voltar" onClick={onBack} className="shrink-0 h-9 w-9 rounded-full hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-700 mx-auto" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            )}
            <img src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" alt="Atacadão Guanabara" className="h-8 w-auto shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">Suporte • {requestName}</h3>
              <p className="text-xs text-gray-600 truncate">{requestType === 'camera' ? 'Solicitação de Câmera' : 'Trocas e Devoluções'}</p>
            </div>
          </div>
          {sender === 'admin' ? (
            <select aria-label="Status da solicitação" value={requestStatus} onChange={(e) => handleStatusChange(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-blue-500 focus:border-blue-500 bg-white">
              {statusOptions.map(option => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          ) : (
            <span className="px-2 py-1 rounded text-xs bg-white text-gray-700 border border-gray-200">
              {requestStatus === 'pending' ? 'Pendente' : requestStatus === 'approved' ? 'Aprovado' : requestStatus === 'rejected' ? 'Rejeitado' : requestStatus === 'completed' ? 'Concluído' : requestStatus}
            </span>
          )}
        </div>
      </div>

      {/* Mensagens */}
  <div ref={messagesWrapRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-gray-50 relative" role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensagens do chat">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">Nenhuma mensagem ainda</p>
              <p className="text-sm">Inicie a conversa enviando uma mensagem</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
              <div className={`max-w-[95%] px-4 py-2 rounded-2xl shadow-sm ${message.sender === 'admin' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md' : 'bg-orange-50 text-orange-950 border border-orange-200 rounded-bl-md'}`}>
                {message.type === 'image' && message.mediaUrl && (
                  <div className="mb-2">
                    <img src={message.mediaUrl} alt="Imagem enviada" className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90" onClick={() => window.open(message.mediaUrl!, '_blank')} />
                  </div>
                )}
                {message.type === 'audio' && message.mediaUrl && (
                  <div className="flex items-center gap-3 mb-2">
                    <button type="button" aria-label={isPlayingAudio[message.id] ? 'Pausar áudio' : 'Reproduzir áudio'} onClick={() => playAudio(message.id, message.mediaUrl!)} className={`h-8 w-8 rounded-full flex items-center justify-center ${message.sender === 'admin' ? 'bg-white bg-opacity-20 hover:bg-opacity-30' : 'bg-gray-300 hover:bg-gray-400'}`}>
                      {isPlayingAudio[message.id] ? (<Pause className="h-3 w-3" />) : (<Play className="h-3 w-3" />)}
                    </button>
                    <div className="flex-1 min-w-[140px]">
                      <div className="text-xs opacity-90">Áudio</div>
                      <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <div className={`${message.sender === 'admin' ? 'bg-white/80' : 'bg-gray-500'}`} style={{ height: '100%', width: playingId === message.id ? `${Math.round(playingProgress * 100)}%` : '0%' }} />
                      </div>
                    </div>
                  </div>
                )}
                {message.message && (<p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>)}
                <p className={`text-[11px] mt-1 ${message.sender === 'admin' ? 'opacity-75' : 'text-gray-600'}`}>
                  {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />

        {/* Indicador de digitação */}
        {newMessage.trim().length > 0 && (
          <div className={`flex ${sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in duration-200 ${sender === 'admin' ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md' : 'bg-gray-200 text-gray-700 rounded-bl-md'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-600"></span>
              </span>
              Digitando…
            </div>
          </div>
        )}

        {/* Botão flutuante para rolar ao fim */}
        {!isAtBottom && (
          <button type="button" onClick={(e) => { e.stopPropagation(); scrollToBottom() }} aria-label="Ir para a última mensagem" className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 flex items-center justify-center animate-in fade-in">
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Input */}
      <div className={`p-4 border-t border-gray-200 bg-white ${isDragging ? 'ring-2 ring-orange-400 ring-offset-1' : ''}`} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {/* Preview de imagens selecionadas */}
        {chatImages.length > 0 && (
          <div className="flex gap-2 p-3 bg-gray-100 rounded-lg mb-3 flex-wrap">
            {chatImages.map((image, index) => (
              <div key={index} className="relative">
                <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm" />
                <button type="button" onClick={() => removeChatImage(index)} className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
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
            <button type="button" onClick={() => setAudioUrl(null)} className="text-red-600 hover:text-red-700 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Botões de mídia */}
        <div className="flex gap-2 mb-3 items-center">
          <input ref={chatImageInputRef} type="file" accept="image/*" multiple onChange={handleChatImageUpload} className="hidden" />
          <button type="button" onClick={() => chatImageInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm" aria-label="Enviar fotos">
            <Camera className="h-4 w-4" />
            Fotos
          </button>
          <button type="button" onClick={() => setShowEmoji(v => !v)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm" aria-label="Inserir emoji">
            <Smile className="h-4 w-4" />
            Emojis
          </button>
          <div
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm select-none ${isRecording ? 'bg-red-50 border-red-200 text-red-700' : 'border-gray-300 hover:bg-gray-50'}`}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={() => isRecording && stopRecording()}
            onTouchStart={(e) => { e.preventDefault(); startRecording() }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
            role="button"
            aria-label={isRecording ? 'Solte para parar a gravação' : 'Segure para gravar áudio'}
            title={isRecording ? 'Solte para parar a gravação' : 'Segure para gravar áudio'}
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
            {isRecording ? (<span>Gravando… {recordingSeconds}s</span>) : (<span>Segure p/ gravar</span>)}
          </div>
        </div>

        {/* Emoji popover */}
        {showEmoji && (
          <div className="mb-3 p-2 border border-gray-200 rounded-md bg-white shadow-sm w-full max-w-sm">
            <div className="flex flex-wrap gap-2 text-xl">
              {['😀','😁','😂','😊','😍','🤝','👍','🙏','📷','🎧','📝','🚚','📦'].map(e => (
                <button type="button" key={e} className="hover:scale-110 transition-transform" onClick={() => setNewMessage(prev => (prev || '') + e)} aria-label={`Inserir ${e}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sugestões rápidas */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(sender === 'admin' ? ADMIN_QUICK_REPLIES : CLIENT_QUICK_REPLIES).map((text, i) => (
            <button type="button" key={i} onClick={() => setNewMessage(text)} className="px-3 py-1.5 rounded-full text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200">
              {text}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onPaste={handlePaste} placeholder="Digite sua mensagem..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" onKeyDown={handleKeyPress} disabled={isLoading} aria-label="Mensagem" ref={inputRef} />
          <button type="button" onClick={(e) => { e.preventDefault(); sendMessage() }} disabled={(!newMessage.trim() && chatImages.length === 0 && !audioUrl) || isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1" aria-label="Enviar mensagem">
            <Send className="h-4 w-4" />
            <span>Enviar</span>
          </button>
        </div>

        {isDragging && (
          <div className="mt-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">Solte as imagens aqui para anexar</div>
        )}
      </div>

      {/* Audio element para reprodução */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
