import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import CookieBanner from "@/components/cookie-banner"
import OrderTrackingNotification from "@/components/order-tracking-notification"
import VisitorTracker from "@/components/visitor-tracker"
import { Providers } from "./providers"
import "./globals.css"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Atacadão Guanabara - Seu supermercado de confiança',
  description: 'Preço baixo e qualidade!',
  icons: {
    icon: '/favicon-32x32.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} style={{ overflow: 'visible' }}>
                            <Providers>
                      {children}
                      <CookieBanner />
                      <OrderTrackingNotification />
                      <VisitorTracker />
                    </Providers>
      </body>
    </html>
  )
}
