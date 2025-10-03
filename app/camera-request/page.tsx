"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react"
import { useAuthStore } from "@/lib/store"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, Clock, Shield, MessageCircle, AlertTriangle, CheckCircle, User, Phone } from "lucide-react"
import ChatInterface from "@/components/admin/ChatInterface"
import Link from "next/link"

interface CameraRequest {
  id: string
  name: string
  phone: string
  cause: string
  createdAt: string
  status: string
  messages?: any[]
}

function CameraRequestContent() {
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('solicitar')
  const [requests, setRequests] = useState<CameraRequest[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Verificar parâmetros da URL para abrir aba específica
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'minhas' && user) {
      setActiveTab('minhas')
    }
  }, [searchParams, user])

  // Carregar solicitações do usuário
  useEffect(() => {
    if (!user || activeTab !== 'minhas') return
    
    setLoading(true)
    fetch(`/api/camera-requests?t=${Date.now()}`, {
      headers: {
        "x-user-email": user.email,
        "x-user-id": user.id,
      },
      cache: 'no-store'
    })
      .then((res) => res.json())
      .then((data) => setRequests(Array.isArray(data.data) ? data.data : []))
      .finally(() => setLoading(false))
  }, [user, activeTab])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Em Análise', color: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Solicitação de Verificação de Câmeras
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Este formulário é destinado a clientes que desejam solicitar a verificação das câmeras de segurança do <strong>Atacadão Guanabara</strong>, em caso de esquecimento de mercadorias nas dependências da loja.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Prazo de Resposta</h3>
                <p className="text-sm text-gray-600">Até 72 horas úteis</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Privacidade</h3>
                <p className="text-sm text-gray-600">Conforme LGPD</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
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
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
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
              {/* LGPD Information */}
              <Card className="mb-8 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-5 w-5" />
                    Informações Importantes sobre Privacidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>De acordo com a Lei Geral de Proteção de Dados (LGPD)</strong> e por respeito à privacidade de todos:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>As imagens <strong>não são disponibilizadas diretamente</strong> ao cliente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Exceções apenas em casos específicos previstos em lei (ordem judicial ou se o solicitante for a única pessoa visível)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Nossa equipe fará a <strong>análise interna das imagens</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Prazo para resposta: <strong>até 72 horas úteis</strong></span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Action Button */}
              <div className="text-center mb-8">
                <Link href="/camera-request/form">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    <Camera className="h-5 w-5 mr-2" />
                    Acessar Formulário de Solicitação
                  </Button>
                </Link>
              </div>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Como Funciona o Processo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">1. Preenchimento do Formulário</h4>
                      <p className="text-sm text-gray-600">
                        Preencha todos os campos obrigatórios com suas informações pessoais e detalhes sobre o item perdido.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">2. Análise da Equipe</h4>
                      <p className="text-sm text-gray-600">
                        Nossa equipe de segurança analisará as imagens das câmeras com base nas informações fornecidas.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">3. Contato</h4>
                      <p className="text-sm text-gray-600">
                        Entraremos em contato em até 72 horas úteis para informar o resultado da análise.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">4. Resolução</h4>
                      <p className="text-sm text-gray-600">
                        Se o item for encontrado, combinaremos a retirada conforme nossas políticas de segurança.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="text-center mt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MessageCircle className="h-4 w-4" />
                    <span>Para mais informações:</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <a 
                      href="tel:+5585985147067" 
                      className="text-primary hover:underline font-medium"
                    >
                      (85) 98514-7067
                    </a>
                    <span className="text-gray-400">|</span>
                    <a 
                      href="mailto:atacadaoguanabara@outlook.com" 
                      className="text-primary hover:underline font-medium"
                    >
                      atacadaoguanabara@outlook.com
                    </a>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Aba Minhas Solicitações */}
            <TabsContent value="minhas" className="mt-6">
              {!user ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600 mb-4">Você precisa estar logado para ver suas solicitações.</p>
                    <Button onClick={() => router.push('/login?callback=/camera-request?tab=minhas')}>
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
                      requestType="camera"
                      requestName={requests.find(r => r.id === selectedRequestId)?.cause || "Solicitação de Câmera"}
                      requestStatus={requests.find(r => r.id === selectedRequestId)?.status || "pending"}
                      onStatusChange={() => {}}
                      sender="user"
                      onBack={() => setSelectedRequestId(null)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Você ainda não fez nenhuma solicitação.</p>
                        <Button onClick={() => setActiveTab('solicitar')}>
                          Fazer Nova Solicitação
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    requests.map((request) => (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <Camera className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold">Solicitação #{request.id}</p>
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
                              <span className="text-sm">{request.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{request.phone}</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              <strong>Motivo:</strong> {request.cause}
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
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function CameraRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <CameraRequestContent />
    </Suspense>
  )
}
