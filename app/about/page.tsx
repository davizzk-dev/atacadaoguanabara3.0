import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { Mail, Phone, MapPin, Clock, Star } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sobre o Atacadão Guanabara</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sua loja de confiança para produtos de qualidade com os melhores preços da região.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Informações da Empresa */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nossa História</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              O Atacadão Guanabara nasceu da paixão por oferecer produtos de qualidade 
              a preços acessíveis para toda a comunidade. Desde 06/01/2021, temos servido 
              nossa comunidade com dedicação e compromisso.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Nossa missão é proporcionar uma experiência de compra única, com produtos 
              frescos, preços justos e um atendimento que faz você se sentir em casa.
            </p>
          </div>

          {/* Valores */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nossos Valores</h2>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700">Qualidade em todos os produtos</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700">Preços justos e competitivos</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700">Atendimento personalizado</span>
              </li>
              <li className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-orange-500" />
                <span className="text-gray-700">Compromisso com a comunidade</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Informações de Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-gray-600">atacadaoguanabara@outlook.com</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-medium text-gray-900">Telefone</p>
                <p className="text-gray-600">(85) 98514-7067</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-medium text-gray-900">Endereço</p>
                <p className="text-gray-600">
                  R. Antônio Arruda, 1170<br />
                  Vila Velha, Fortaleza - CE<br />
                  CEP: 60347-255
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-medium text-gray-900">Horário</p>
                <p className="text-gray-600">Seg-Sáb: 7h às 19h</p>
                <p className="text-gray-600">Dom: 7h às 13h</p>
                <p className="text-gray-600 text-sm">Delivery: 8h às 16h30</p>
              </div>
            </div>
          </div>
        </div>

        {/* Diferenciais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚚</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Entrega Rápida</h3>
            <p className="text-gray-600">Entregamos em até 2 horas na sua região</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Melhores Preços</h3>
            <p className="text-gray-600">Preços atacado para você economizar</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Qualidade Garantida</h3>
            <p className="text-gray-600">Produtos frescos e de qualidade</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
} 
