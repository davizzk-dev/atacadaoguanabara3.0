import Link from 'next/link'

export default function TermsPage() {
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
                  Termos de Uso
                </span>
              </div>
            </div>
            <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium">
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p className="text-gray-700 mb-4">
                Ao acessar e usar este website, você aceita estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Uso do Serviço</h2>
              <p className="text-gray-700 mb-4">
                Nosso website permite que você:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Visualize nosso catálogo de produtos</li>
                <li>Adicione produtos ao carrinho de compras</li>
                <li>Faça pedidos através do WhatsApp</li>
                <li>Solicite verificação de câmeras de segurança</li>
                <li>Envie feedback, sugestões e reclamações</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Pedidos e Pagamentos</h2>
              <p className="text-gray-700 mb-4">
                Todos os pedidos são processados através do WhatsApp. Os preços estão sujeitos a alterações 
                sem aviso prévio. O pagamento deve ser realizado conforme acordado com nossa equipe.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Disponibilidade de Produtos</h2>
              <p className="text-gray-700 mb-4">
                A disponibilidade dos produtos pode variar. Reservamo-nos o direito de cancelar pedidos 
                caso o produto não esteja disponível no momento da compra.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Política de Privacidade</h2>
              <p className="text-gray-700 mb-4">
                Suas informações pessoais são tratadas de acordo com nossa 
                <Link href="/privacy" className="text-orange-500 hover:text-orange-600"> Política de Privacidade</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitação de Responsabilidade</h2>
              <p className="text-gray-700 mb-4">
                O Atacadão Guanabara não se responsabiliza por danos indiretos, incidentais ou consequenciais 
                decorrentes do uso de nossos serviços.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriedade Intelectual</h2>
              <p className="text-gray-700 mb-4">
                Todo o conteúdo deste website, incluindo textos, imagens, logos e design, é propriedade 
                do Atacadão Guanabara e está protegido por direitos autorais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modificações</h2>
              <p className="text-gray-700 mb-4">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                entrarão em vigor imediatamente após sua publicação no website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Lei Aplicável</h2>
              <p className="text-gray-700 mb-4">
                Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida 
                nos tribunais da comarca onde está localizada nossa empresa.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contato</h2>
              <p className="text-gray-700 mb-4">
                Para dúvidas sobre estes termos, entre em contato conosco:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Email: atacadaoguanabara@outlook.com</li>
                <li>Telefone: (85) 98514-7067</li>
                <li>Endereço: Rua das Flores, 123 - Centro</li>
              </ul>
            </section>
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
