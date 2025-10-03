'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Package, RotateCcw, Shield, Clock, MessageCircle, Upload, X, Send, User, Phone, Check } from 'lucide-react'
import { toast } from 'sonner'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import ChatInterface from '@/components/admin/ChatInterface'

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

export default function ReturnsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('solicitar')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
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

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejeitado' },
      processing: { color: 'bg-blue-100 text-blue-800', text: 'Processando' },
      completed: { color: 'bg-purple-100 text-purple-800', text: 'Concluído' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    )
  }

  // Carregar solicitações quando a página carrega
  useEffect(() => {
    if (user) {
      loadReturnRequests()
    }
  }, [user])

  const loadReturnRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/return-requests', {
        headers: {
          'Authorization': `Bearer ${user?.email}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setReturnRequests(data.data || data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
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

  const handleSubmit = async () => {
    if (!formData.orderId || !formData.productName || !formData.userName || 
        !formData.userEmail || !formData.userPhone || !formData.reason) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setIsSubmitting(true)
      
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'photos') {
          value.forEach((photo: File) => {
            submitData.append('photos', photo)
          })
        } else {
          submitData.append(key, value.toString())
        }
      })

      const response = await fetch('/api/return-requests', {
        method: 'POST',
        body: submitData
      })

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
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
          setActiveTab('minhas')
          loadReturnRequests()
        }, 3000)
      } else {
        throw new Error('Erro ao enviar solicitação')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
              <Package className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Trocas e Devoluções
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Solicite trocas ou devoluções de produtos do <strong>Atacadão Guanabara</strong> de forma prática e segura.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Prazo de Resposta</h3>
                <p className="text-sm text-gray-600">Até 48 horas úteis</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <RotateCcw className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Processo Simples</h3>
                <p className="text-sm text-gray-600">Formulário digital</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Acompanhamento</h3>
                <p className="text-sm text-gray-600">Chat em tempo real</p>
              </CardContent>
            </Card>
          </div>

          {/* Botão de acesso rápido para usuários logados */}
          {user && (
            <div className="text-center mb-6">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('minhas')}
                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ver Minhas Solicitações
              </Button>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="solicitar">Nova Solicitação</TabsTrigger>
              <TabsTrigger value="minhas">Minhas Solicitações</TabsTrigger>
            </TabsList>

            {/* Aba Nova Solicitação */}
            <TabsContent value="solicitar" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Formulário de Troca/Devolução
                  </CardTitle>
                  <CardDescription>
                    Preencha os dados abaixo para solicitar uma troca ou devolução
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Informações do Pedido */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Informações do Pedido</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="orderId">Número do Pedido *</Label>
                        <Input
                          id="orderId"
                          value={formData.orderId}
                          onChange={(e) => handleInputChange('orderId', e.target.value)}
                          placeholder="Ex: ATG-12345"
                          required
                        />
                      </div>
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
                    </div>
                  </div>

                  {/* Informações do Cliente */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Suas Informações</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="(85) 99999-9999"
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
                  </div>

                  {/* Tipo de Solicitação */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Tipo de Solicitação</h4>
                    <RadioGroup
                      value={formData.requestType}
                      onValueChange={(value) => handleInputChange('requestType', value)}
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

                  {/* Motivo */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Motivo da Solicitação</h4>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) => handleInputChange('reason', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {RETURN_REASONS.map(reason => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Descrição Detalhada</h4>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descreva detalhadamente o motivo da solicitação..."
                      rows={4}
                    />
                  </div>

                  {/* Upload de Fotos */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Fotos do Produto (Opcional)</h4>
                    <div className="space-y-4">
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
                        disabled={formData.photos.length >= 5}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Fotos ({formData.photos.length}/5)
                      </Button>
                      
                      {formData.photos.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {formData.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removePhoto(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botão de Envio */}
                  <div className="pt-6">
                    <Button 
                      className="w-full" 
                      disabled={isSubmitting || !formData.orderId || !formData.productName || !formData.userName || !formData.userEmail || !formData.userPhone || !formData.reason}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Minhas Solicitações */}
            <TabsContent value="minhas" className="mt-6">
              {!user ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600 mb-4">Você precisa estar logado para ver suas solicitações.</p>
                    <Button onClick={() => router.push('/login?callback=/returns?tab=minhas')}>
                      Fazer Login
                    </Button>
                  </CardContent>
                </Card>
              ) : loading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p>Carregando suas solicitações...</p>
                  </CardContent>
                </Card>
              ) : selectedRequestId ? (
                <Card>
                  <CardContent className="p-0">
                    <ChatInterface 
                      requestId={selectedRequestId} 
                      requestType="return"
                      requestName={returnRequests.find(r => r.id === selectedRequestId)?.reason || "Solicitação de Troca/Devolução"}
                      requestStatus={returnRequests.find(r => r.id === selectedRequestId)?.status || "pending"}
                      onStatusChange={() => {}}
                      sender="user"
                      onBack={() => setSelectedRequestId(null)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {returnRequests.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Você ainda não fez nenhuma solicitação.</p>
                        <Button onClick={() => setActiveTab('solicitar')}>
                          Fazer Nova Solicitação
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    returnRequests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-full">
                                <Package className="h-4 w-4 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-semibold">Pedido #{request.orderId}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{request.userName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{request.productName}</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              <strong>Tipo:</strong> {request.requestType === 'exchange' ? 'Troca' : 'Devolução'}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Motivo:</strong> {request.reason}
                            </p>
                          </div>

                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Abrir Chat
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Modal de Sucesso */}
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
                    <span>Redirecionando...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
