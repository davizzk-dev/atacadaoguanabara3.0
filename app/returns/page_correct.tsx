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
import { ArrowLeft, Upload, X, Check, Package, RotateCcw, Shield, Clock, MessageCircle, FileText, Plus, Send } from 'lucide-react'
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
  const [newMessage, setNewMessage] = useState('')
  const [showChatPrompt, setShowChatPrompt] = useState(false)
  const [hasUnresolvedRequests, setHasUnresolvedRequests] = useState(false)
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

  // Verificar se deve mostrar chat ou formulário
  useEffect(() => {
    if (returnRequests.length > 0) {
      // Solicitações não resolvidas incluem: pending, processing e approved (até ser completed)
      const unresolvedRequests = returnRequests.filter(req => 
        req.status === 'pending' || req.status === 'processing' || req.status === 'approved'
      )
      
      setHasUnresolvedRequests(unresolvedRequests.length > 0)
      
      if (unresolvedRequests.length > 0) {
        setActiveTab('list')
        setShowChatPrompt(true)
        // Esconder o prompt após 5 segundos
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
      setLoading(true)
      const response = await fetch('/api/return-requests')
      if (response.ok) {
        const data = await response.json()
        console.log('Dados carregados:', data)
        setReturnRequests(data.data || data || [])
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
        // Limpar formulário
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
        // Recarregar lista
        loadReturnRequests()
        // Voltar para a aba de lista
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return

    try {
      const response = await fetch('/api/return-requests/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: selectedChat.id,
          message: newMessage,
          sender: 'user'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setNewMessage('')
          loadReturnRequests()
          // Atualizar chat selecionado
          const updatedRequest = returnRequests.find(req => req.id === selectedChat.id)
          if (updatedRequest) {
            setSelectedChat(updatedRequest)
          }
          toast.success('Mensagem enviada!')
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem')
    }
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
                // Modo Chat - Mostrar solicitações pendentes com foco no chat
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
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setSelectedChat(request)}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Abrir Chat
                                    {request.messages && request.messages.length > 0 && (
                                      <Badge variant="secondary" className="ml-2">
                                        {request.messages.length} mensagens
                                      </Badge>
                                    )}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Chat - Pedido #{request.orderId}</DialogTitle>
                                    <DialogDescription>
                                      Converse com nossa equipe sobre sua solicitação
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-4">
                                    <div className="h-64 border rounded-lg p-4 overflow-y-auto bg-gray-50">
                                      {request.messages && request.messages.length > 0 ? (
                                        <div className="space-y-2">
                                          {request.messages.map((message) => (
                                            <div
                                              key={message.id}
                                              className={`p-2 rounded-lg max-w-xs ${
                                                message.sender === 'user'
                                                  ? 'bg-blue-600 text-white ml-auto'
                                                  : 'bg-white border border-gray-200'
                                              }`}
                                            >
                                              <p className="text-sm">{message.message}</p>
                                              <p className={`text-xs mt-1 ${
                                                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                                              }`}>
                                                {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                          <div className="text-center">
                                            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                                            <p>Inicie a conversa</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Digite sua mensagem..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                      />
                                      <Button 
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim()}
                                        size="icon"
                                        className="bg-blue-600 hover:bg-blue-700"
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Modo Lista - Mostrar todas as solicitações quando não há pendentes
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

      <Footer />
    </div>
  )
}
