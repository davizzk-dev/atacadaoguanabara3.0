import Link from 'next/link'
import { Clock, Package, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl md:text-4xl">🏪</span>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-orange-500 leading-tight">
                  Atacadão Guanabara
                </span>
                <span className="text-xs md:text-sm text-gray-500 hidden md:block">
                  Trocas e Devoluções
                </span>
              </div>
            </div>
            <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium">
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Trocas e Devoluções
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              Garantimos sua satisfação com nossa política de trocas e devoluções
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Política Geral */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Política de Trocas e Devoluções</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="flex items-start space-x-4">
              <Clock className="w-8 h-8 text-orange-500 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Prazo de 7 Dias</h3>
                <p className="text-gray-700">
                  Aceitamos trocas e devoluções em até 7 dias após a compra, 
                  contados a partir da data de recebimento do produto.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <Package className="w-8 h-8 text-orange-500 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Embalagem Original</h3>
                <p className="text-gray-700">
                  O produto deve estar em perfeitas condições e na embalagem original, 
                  sem sinais de uso ou danos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-500 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">Importante</h3>
                <p className="text-blue-800">
                  Produtos de higiene pessoal, alimentos perecíveis e produtos personalizados 
                  não podem ser trocados ou devolvidos por questões de segurança e higiene.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Como Solicitar */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Como Solicitar Trocas e Devoluções</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Entre em Contato</h3>
                <p className="text-gray-700">
                  Entre em contato conosco pelo WhatsApp (85) 98514-7067 ou email 
                  atacadaoguanabara@outlook.com informando o motivo da troca/devolução.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aguarde Aprovação</h3>
                <p className="text-gray-700">
                  Nossa equipe analisará sua solicitação e entrará em contato em até 24 horas 
                  para confirmar a aprovação da troca/devolução.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Retorne o Produto</h3>
                <p className="text-gray-700">
                  Após a aprovação, você pode retornar o produto em nossa loja ou solicitar 
                  a retirada em domicílio (taxa adicional pode ser cobrada).
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Receba a Solução</h3>
                <p className="text-gray-700">
                  Após a análise do produto, você receberá a troca, reembolso ou crédito 
                  conforme a situação.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tipos de Solução */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tipos de Solução</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <RefreshCw className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Troca</h3>
              <p className="text-gray-700">
                Troque por outro produto de mesmo valor ou complemente a diferença.
              </p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reembolso</h3>
              <p className="text-gray-700">
                Receba o valor de volta na forma original do pagamento.
              </p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <span className="text-4xl mx-auto mb-4 block">💳</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Crédito</h3>
              <p className="text-gray-700">
                Receba crédito para usar em futuras compras em nossa loja.
              </p>
            </div>
          </div>
        </div>

        {/* Casos Especiais */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Casos Especiais</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-orange-500 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Produto com Defeito</h3>
              <p className="text-gray-700">
                Produtos com defeito de fabricação podem ser trocados ou devolvidos 
                independentemente do prazo de 7 dias, conforme a garantia do fabricante.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Erro no Pedido</h3>
              <p className="text-gray-700">
                Caso você receba um produto diferente do solicitado, faremos a troca 
                imediatamente sem custos adicionais.
              </p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Produto Danificado</h3>
              <p className="text-gray-700">
                Produtos que chegam danificados devem ser reportados imediatamente 
                para que possamos resolver a situação.
              </p>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-orange-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Precisa de Ajuda?</h2>
          <p className="text-gray-700 mb-6">
            Nossa equipe está pronta para ajudar você com qualquer dúvida sobre 
            trocas e devoluções.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">WhatsApp</h3>
              <p className="text-gray-600">(85) 98514-7067</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-600">atacadaoguanabara@outlook.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Atacadão Guanabara</h3>
              <p className="text-gray-400">
                Sua loja de confiança há mais de 4 anos, oferecendo preço baixo e qualidade!
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Links Úteis</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white">Início</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white">Sobre Nós</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Política de Privacidade</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Termos de Uso</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Atendimento</h4>
              <ul className="space-y-2">
                <li><Link href="/feedback" className="text-gray-400 hover:text-white">Feedback</Link></li>
                <li><Link href="/camera-request/form" className="text-gray-400 hover:text-white">Solicitar Câmera</Link></li>
                <li><Link href="/faq" className="text-gray-400 hover:text-white">FAQ</Link></li>
                <li><Link href="/returns" className="text-gray-400 hover:text-white">Trocas e Devoluções</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400">
                <li>atacadaoguanabara@outlook.com</li>
                <li>(85) 98514-7067</li>
                <li>R. Antônio Arruda, 1170 - Vila Velha - Fortaleza</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Atacadão Guanabara. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
