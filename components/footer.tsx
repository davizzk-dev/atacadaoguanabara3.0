'use client'
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin, Clock, CreditCard, Truck, Shield } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-primary via-primary-700 to-primary-900 text-white">
      {/* Newsletter Section */}
    

      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Logo e Descrição */}
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-3 mb-2">
              <img src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" alt="Logo Atacadão Guanabara" className="h-16 w-auto rounded-xl shadow-lg mb-2" />
            <div className="flex items-center space-x-3">

              <div>
                <h3 className="text-2xl font-bold">Atacadão Guanabara</h3>
                <p className="text-secondary font-semibold">Preço baixo e qualidade!</p>
                </div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Desde 2020, somos o parceiro de confiança para pequenos e médios empreendedores dos ramos de pizzarias, pastelarias, sushis, confeitarias, docerias e açaiterias, além de clientes individuais que buscam produtos de qualidade com economia.
            </p>

            {/* Redes Sociais */}
            <div className="flex space-x-4">
              <Link
                href="#"
                className="bg-white/10 p-3 rounded-full hover:bg-secondary transition-all duration-300 group"
              >
                <Facebook className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </Link>
              <Link
                href="https://www.instagram.com/atacadaoguanabara/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 p-3 rounded-full hover:bg-secondary transition-all duration-300 group"
              >
                <Instagram className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </Link>
              <Link
                href="#"
                className="bg-white/10 p-3 rounded-full hover:bg-secondary transition-all duration-300 group"
              >
                <Twitter className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="space-y-6">
            <h4 className="text-lg sm:text-xl font-bold text-secondary">Links Rápidos</h4>
            <ul className="space-y-3">
              {[
                { name: "Início", href: "/" },
                { name: "Produtos", href: "/catalog" },
                { name: "Sobre Nós", href: "/about" },
                { name: "FAQ", href: "/faq" },
                { name: "Trocas e Devoluções", href: "/returns" },
                { name: "Política de Privacidade", href: "/privacy" },
              ].map((link) => (
                <li key={link.name} className="text-sm sm:text-base">
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-secondary transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-secondary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Atendimento */}
          <div className="space-y-6">
            <h4 className="text-lg sm:text-xl font-bold text-secondary">Atendimento</h4>
            <ul className="space-y-3">
              {[
                { name: "Solicitar Câmera", href: "/camera-request/form" },
                { name: "Feedback", href: "/feedback" },
                { name: "Termos de Uso", href: "/terms" },
                { name: "Contato", href: "/about" },
                { name: "Horários", href: "/about" },
                { name: "Localização", href: "/about" },
              ].map((link) => (
                <li key={link.name} className="text-sm sm:text-base">
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-secondary transition-colors duration-300 flex items-center group"
                  >
                    <span className="w-2 h-2 bg-secondary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-6">
            <h4 className="text-lg sm:text-xl font-bold text-secondary">Contato</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <div className="bg-secondary/20 p-2 rounded-lg group-hover:bg-secondary transition-colors">
                  <Mail className="h-5 w-5 text-secondary group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold">E-mail</p>
                  <p className="text-gray-300">atacadaoguanabara@outlook.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <div className="bg-secondary/20 p-2 rounded-lg group-hover:bg-secondary transition-colors">
                  <Phone className="h-5 w-5 text-secondary group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold">Telefone</p>
                  <p className="text-gray-300">(85) 98514-7067</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <div className="bg-secondary/20 p-2 rounded-lg group-hover:bg-secondary transition-colors">
                  <MapPin className="h-5 w-5 text-secondary group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold">Endereço</p>
                  <p className="text-gray-300">
                    R. Antônio Arruda, 1170
                    <br />
                    Vila Velha, Fortaleza - CE
                    <br />
                    CEP: 60347-255
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <div className="bg-secondary/20 p-2 rounded-lg group-hover:bg-secondary transition-colors">
                  <Clock className="h-5 w-5 text-secondary group-hover:text-white" />
                </div>
                <div>
                  <p className="font-semibold">Horário</p>
                  <p className="text-gray-300">Seg-Sáb: 7h às 19h</p>
                  <p className="text-gray-300">Dom: 7h às 13h</p>
                  <p className="text-gray-300 text-sm">Delivery: 8h às 16h30</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="border-t border-white/20 mt-16 pt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-center space-x-3 group">
              <div className="bg-secondary/20 p-3 rounded-full group-hover:bg-secondary transition-colors">
                <Truck className="h-6 w-6 text-secondary group-hover:text-white" />
              </div>
              <div>
                <h5 className="font-bold">Entrega Rápida</h5>
                <p className="text-gray-300 text-sm">Em até 2 horas</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 group">
              <div className="bg-secondary/20 p-3 rounded-full group-hover:bg-secondary transition-colors">
                <Shield className="h-6 w-6 text-secondary group-hover:text-white" />
              </div>
              <div>
                <h5 className="font-bold">Compra Segura</h5>
                <p className="text-gray-300 text-sm">SSL Certificado</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 group">
              <div className="bg-secondary/20 p-3 rounded-full group-hover:bg-secondary transition-colors">
                <CreditCard className="h-6 w-6 text-secondary group-hover:text-white" />
              </div>
              <div>
                <h5 className="font-bold">Pagamento</h5>
                <p className="text-gray-300 text-sm">Cartão, PIX, Dinheiro.</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 group">
              <div className="bg-secondary/20 p-3 rounded-full group-hover:bg-secondary transition-colors">
                <Phone className="h-6 w-6 text-secondary group-hover:text-white" />
              </div>
              <div>
                <h5 className="font-bold">Suporte</h5>
                <p className="text-gray-300 text-sm">Sempre disponível</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-300">&copy; 2025 Atacadão Guanabara. Todos os direitos reservados.</p>
              <p className="text-gray-400 text-sm mt-1">
                CNPJ: 40.284.268/0001-17 | Desde 06/01/2021
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Desenvolvido com <span className="text-blue-500">💙</span> por Davi Kalebe
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-6 text-sm text-gray-300">
                <Link href="/privacy" className="hover:text-secondary transition-colors">
                  Privacidade
                </Link>
                <Link href="/terms" className="hover:text-secondary transition-colors">
                  Termos
                </Link>
                <Link href="/cookies" className="hover:text-secondary transition-colors">
                  Cookies
                </Link>
              </div>

              {/* Selo de Segurança */}
              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://www.sitelock.com/verify.php?site=atacadaoguanabara.com','SiteLock','width=600,height=600,left=160,top=170');
                  }}
                  className="hover:opacity-80 transition-opacity"
                  title="Verificar Segurança do Site"
                >
                  <img
                    className="h-10 w-auto"
                    alt="SiteLock"
                    title="SiteLock"
                    src="https://shield.sitelock.com/shield/atacadaoguanabara.com"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
