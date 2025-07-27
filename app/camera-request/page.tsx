"use client"

import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Clock, Shield, MessageCircle, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function CameraRequestPage() {
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
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <MessageCircle className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Contato</h3>
                <p className="text-sm text-gray-600">Via WhatsApp</p>
              </CardContent>
            </Card>
          </div>

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

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <Link href="/camera-request/form">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Camera className="h-5 w-5 mr-2" />
                Acessar Formulário de Solicitação
              </Button>
            </Link>
            
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

          {/* Additional Information */}
          <Card className="mt-8">
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
        </div>
      </div>
      <Footer />
    </div>
  )
} 
