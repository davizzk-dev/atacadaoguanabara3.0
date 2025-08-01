export const dynamic = 'force-dynamic'

import Header from "@/components/header"
import { Footer } from "@/components/footer"
import { Mail, Phone, MapPin, Clock, Star, Target, Award, Heart, Users, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sobre o Atacadão Guanabara</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Seu parceiro de confiança desde 2020, atendendo empreendedores e clientes com produtos de qualidade e economia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Nossa História */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-orange-500" />
              Nossa História
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              O Atacadão Guanabara iniciou suas operações em 2020, em meio à pandemia, para atender tanto pequenos e médios empreendedores dos ramos de pizzarias, pastelarias, sushis, confeitarias, docerias e açaiterias, quanto clientes individuais que buscam produtos de qualidade com economia.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Nosso compromisso é oferecer um portfólio diversificado e serviços que atendam às expectativas de todos os nossos clientes, sendo referência em preço, custo-benefício e variedade de produtos no mercado de atacarejo.
            </p>
          </div>

          {/* Missão e Visão */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-orange-500" />
              Missão e Visão
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Missão:</h3>
                <p className="text-gray-700 text-sm">
                  Proporcionar uma experiência de compra com economia, variedade de produtos e excelência no atendimento, atendendo tanto pequenos e médios empreendedores dos ramos de pizzarias, pastelarias, sushis, confeitarias, docerias e açaiterias, quanto clientes individuais que buscam o melhor custo-benefício.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Visão:</h3>
                <p className="text-gray-700 text-sm">
                  Ser reconhecido como o parceiro preferido e indispensável para os empreendedores desses segmentos, além de atender consumidores individuais, sendo referência em preço, custo-benefício e variedade de produtos no mercado de atacarejo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nossos Valores */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-orange-500" />
            Nossos Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Economia e Preço Baixo</h3>
                <p className="text-gray-700 text-sm">Comprometemo-nos a oferecer produtos com preços competitivos que garantam economia significativa para todos os nossos clientes.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Star className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Variedade e Qualidade</h3>
                <p className="text-gray-700 text-sm">Mantemos um estoque diversificado e de alta qualidade, assegurando produtos que atendem às necessidades específicas de cada segmento.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Excelência no Atendimento</h3>
                <p className="text-gray-700 text-sm">Valorizamos a experiência do cliente, oferecendo um atendimento dedicado e eficiente em todas as interações.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Parceria com Empreendedores</h3>
                <p className="text-gray-700 text-sm">Nosso compromisso é fortalecer os negócios locais, apoiando pequenos e médios empreendedores com soluções personalizadas.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Heart className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Diversidade e Inclusão</h3>
                <p className="text-gray-700 text-sm">Valorizamos a diversidade em nosso time e entre nossos clientes, promovendo um ambiente inclusivo e acolhedor.</p>
              </div>
            </div>
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
            <p className="text-gray-600">Entregamos de 2 a 3 horas na sua região</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Preços Atacado</h3>
            <p className="text-gray-600">Preços competitivos para empreendedores e clientes</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Qualidade Garantida</h3>
            <p className="text-gray-600">Produtos frescos e de alta qualidade</p>
          </div>
        </div>
      </main>

      <Footer/>
    </div>
  )
} 
