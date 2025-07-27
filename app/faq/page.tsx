'use client'

import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const faqs = [
    {
      question: "Como faço um pedido?",
      answer: "Para fazer um pedido, navegue pelo nosso catálogo, adicione os produtos desejados ao carrinho e clique em 'Finalizar Compra'. Você será redirecionado para o WhatsApp para completar o pedido."
    },
    {
      question: "Quais são as formas de pagamento?",
      answer: "Aceitamos PIX, cartão de crédito, cartão de débito e dinheiro. O pagamento é realizado no momento da entrega ou retirada."
    },
    {
      question: "Vocês fazem entrega?",
      answer: "Sim! Fazemos entrega em toda a região. O valor do frete varia conforme a distância e será informado no momento do pedido."
    },
    {
      question: "Qual o prazo de entrega?",
      answer: "O prazo de entrega varia de 1 a 3 dias úteis, dependendo da sua localização e disponibilidade dos produtos."
    },
    {
      question: "Posso trocar ou devolver um produto?",
      answer: "Sim! Aceitamos trocas e devoluções em até 7 dias após a compra, desde que o produto esteja em perfeitas condições e na embalagem original."
    },
    {
      question: "Como solicito verificação de câmeras de segurança?",
      answer: "Acesse a página 'Solicitar Câmera' no menu, preencha o formulário com os detalhes do item perdido e aguarde nosso contato em até 72 horas."
    },
    {
      question: "Vocês têm estoque de todos os produtos?",
      answer: "Nosso estoque é atualizado constantemente. Caso um produto não esteja disponível, entraremos em contato para oferecer alternativas."
    },
    {
      question: "Como posso entrar em contato?",
      answer: "Você pode nos contatar pelo WhatsApp, telefone (85) 98514-7067, email atacadaoguanabara@outlook.com ou através do formulário de feedback."
    },
    {
      question: "Qual o horário de funcionamento?",
      answer: "Funcionamos de segunda a sábado, das 8h às 18h. Aos domingos estamos fechados."
    },
    {
      question: "Vocês têm promoções?",
      answer: "Sim! Sempre temos promoções especiais. Fique atento ao nosso catálogo e redes sociais para não perder nenhuma oferta."
    }
  ]

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
                  Perguntas Frequentes
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
              Perguntas Frequentes
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              Tire suas dúvidas sobre nossos produtos e serviços
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Perguntas Frequentes</h2>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {openItems.includes(index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {openItems.includes(index) && (
                    <div className="px-6 pb-4">
                      <p className="text-gray-700">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-orange-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ainda tem dúvidas?
          </h3>
          <p className="text-gray-700 mb-6">
            Se sua pergunta não foi respondida aqui, entre em contato conosco:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📱</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">WhatsApp</h4>
              <p className="text-gray-600">(85) 98514-7067</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📧</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Email</h4>
              <p className="text-gray-600">atacadaoguanabara@outlook.com</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💬</span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Feedback</h4>
              <Link href="/feedback" className="text-orange-500 hover:text-orange-600">
                Enviar mensagem
              </Link>
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
                Sua loja de confiança há mais de 4 anos, oferecendo oferecendo preço baixo e qualidade!
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
