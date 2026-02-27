import type { Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DesapegoPI - O maior marketplace do Piauí',
  description: 'Compre e venda produtos novos e usados em Teresina e todo o Piauí.',
}

// A MÁGICA PARA O CELULAR LER O TAMANHO CERTO É ESTA:
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className={`${inter.className} bg-gray-50`}>
        <Navbar />
        {/* main ocupa o mínimo da tela inteira */}
        <main className="min-h-screen pb-16 md:pb-0">
          {children}
        </main>
        
        <div className="pb-16 md:pb-0">
          <Footer />
        </div>
        
        {/* O menu de celular */}
        <BottomNav />
      </body>
    </html>
  )
}