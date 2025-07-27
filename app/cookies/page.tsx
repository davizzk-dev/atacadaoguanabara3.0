"use client"

import Header from '@/components/header'
import { Footer } from '@/components/footer'
import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-8 pt-20">
        <img src="https://i.ibb.co/fGSnH3hd/logoatacad-o.jpg" alt="Logo Atacadão Guanabara" className="h-20 w-auto mb-6 rounded-2xl shadow-lg" />
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Política de Cookies</h1>
          <p className="text-gray-700 mb-6">Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e anúncios, fornecer recursos de mídia social e analisar nosso tráfego. Ao continuar navegando, você concorda com nossa <span className="text-orange-500 font-semibold">Política de Cookies</span>.</p>
          <Link href="/" className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-orange-600 transition">Voltar ao início</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
} 