"use client"

import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, Eye, Database, Cookie, MessageSquare } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Política de Privacidade
            </h1>
            <p className="text-lg text-gray-600">
              Como protegemos e utilizamos suas informações pessoais
            </p>
          </div>

          <div className="space-y-6">
            {/* Introdução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Introdução
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  O <strong>Atacadão Guanabara</strong> está comprometido em proteger a privacidade e os dados pessoais de nossos clientes. 
                  Esta Política de Privacidade explica como coletamos, utilizamos, armazenamos e protegemos suas informações pessoais.
                </p>
                <p className="text-gray-700">
                  <strong>Data de vigência:</strong> Esta política entra em vigor em 19 de julho de 2025 e será atualizada conforme necessário.
                </p>
              </CardContent>
            </Card>

            {/* Informações Coletadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Informações que Coletamos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Informações Pessoais:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Nome completo</li>
                    <li>Endereço de e-mail</li>
                    <li>Número de telefone</li>
                    <li>Endereço de entrega</li>
                    <li>Documentos de identificação (RG/CPF)</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Informações de Pedidos:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Histórico de compras</li>
                    <li>Preferências de produtos</li>
                    <li>Dados de entrega</li>
                    <li>Informações de pagamento</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Informações Técnicas:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Endereço IP</li>
                    <li>Tipo de navegador</li>
                    <li>Sistema operacional</li>
                    <li>Cookies e tecnologias similares</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Como Utilizamos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Como Utilizamos suas Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Finalidades Principais:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Processar e entregar seus pedidos</li>
                    <li>Comunicar sobre status de pedidos</li>
                    <li>Fornecer atendimento ao cliente</li>
                    <li>Enviar ofertas e promoções (com consentimento)</li>
                    <li>Melhorar nossos produtos e serviços</li>
                    <li>Cumprir obrigações legais</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Solicitações de Câmera:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Analisar solicitações de verificação de câmeras</li>
                    <li>Entrar em contato sobre objetos perdidos</li>
                    <li>Manter registro para fins de segurança</li>
                    <li>Cumprir com a LGPD e regulamentações</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Compartilhamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Compartilhamento de Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  <strong>Não vendemos, alugamos ou compartilhamos</strong> suas informações pessoais com terceiros, exceto:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Com prestadores de serviços essenciais (entregas, pagamentos)</li>
                  <li>Quando exigido por lei ou ordem judicial</li>
                  <li>Para proteger nossos direitos e segurança</li>
                  <li>Com seu consentimento explícito</li>
                </ul>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5" />
                  Cookies e Tecnologias Similares
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Utilizamos cookies e tecnologias similares para:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Lembrar suas preferências</li>
                  <li>Analisar o uso do site</li>
                  <li>Personalizar sua experiência</li>
                  <li>Melhorar a segurança</li>
                </ul>
                <p className="text-gray-700">
                  Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
                </p>
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Segurança dos Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controle de acesso rigoroso</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Backup regular dos dados</li>
                  <li>Treinamento da equipe sobre privacidade</li>
                </ul>
              </CardContent>
            </Card>

            {/* Seus Direitos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Seus Direitos (LGPD)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Conforme a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><strong>Acesso:</strong> Solicitar informações sobre seus dados</li>
                  <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                  <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados</li>
                  <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                  <li><strong>Revogação:</strong> Revogar consentimentos dados</li>
                  <li><strong>Oposição:</strong> Opor-se ao tratamento de dados</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Contato sobre Privacidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
                </p>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <strong>E-mail:</strong> atacadaoguanabara@outlook.com
                  </p>
                  <p className="text-gray-700">
                    <strong>Telefone:</strong> (85) 98514-7067
                  </p>
                  <p className="text-gray-700">
                    <strong>Endereço:</strong> R. Antônio Arruda, 1170 - Vila Velha, Fortaleza/CE
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Atualizações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Atualizações da Política
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas através de:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Notificação no site</li>
                  <li>E-mail para clientes cadastrados</li>
                  <li>Comunicação via WhatsApp</li>
                </ul>
                <p className="text-gray-700">
                  <strong>Última atualização:</strong> 19 de julho de 2025
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
} 
