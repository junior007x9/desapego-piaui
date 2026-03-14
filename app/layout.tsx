import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'] })

// OTIMIZAÇÃO GLOBAL DE SEO (Google, WhatsApp, Facebook)
export const metadata: Metadata = {
  title: 'DesapegoPI - O maior marketplace do Piauí',
  description: 'Compre e venda produtos novos e usados de forma fácil, rápida e segura em Teresina e em todo o Piauí!',
  keywords: 'desapego, piauí, teresina, comprar, vender, classificados, mercado livre, usados, desapegopi',
  openGraph: {
    title: 'DesapegoPI - O maior marketplace do Piauí',
    description: 'Compre e venda produtos novos e usados de forma fácil, rápida e segura no PI.',
    url: 'https://desapegopi.com', // Altere para o seu domínio oficial futuramente
    siteName: 'DesapegoPI',
    images: [
      {
        url: 'https://i.imgur.com/vHqB0aA.png', // Substitua pelo link de um banner real da sua marca
        width: 1200,
        height: 630,
        alt: 'Capa DesapegoPI',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
}

// Configuração OFICIAL e forçada para dispositivos móveis
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4c1d95', // Deixa a barra de notificações do celular roxa!
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      {/* w-full e overflow-x-hidden impedem o site de criar scroll para os lados */}
      <body className={`${inter.className} bg-gray-50 flex flex-col min-h-screen w-full overflow-x-hidden`}>
        <Navbar />
        
        <main className="flex-grow pb-16 md:pb-0 w-full overflow-x-hidden">
          {children}
        </main>
        
        <div className="pb-16 md:pb-0 w-full">
          <Footer />
        </div>
        
        <BottomNav />
        
        {/* COMPONENTE DO BANNER RENDERIZADO AQUI */}
        <CookieBanner />
      </body>
    </html>
  )
}