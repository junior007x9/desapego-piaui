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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      {/* AQUI ESTÁ A FIXAÇÃO FORÇADA PARA O MOBILE */}
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      
      <body className={`${inter.className} bg-gray-50 flex flex-col min-h-screen`}>
        <Navbar />
        
        {/* O conteúdo cresce para empurrar o footer, com espaço para o menu mobile */}
        <main className="flex-grow pb-16 md:pb-0 w-full overflow-x-hidden">
          {children}
        </main>
        
        <div className="pb-16 md:pb-0 w-full">
          <Footer />
        </div>
        
        <BottomNav />
      </body>
    </html>
  )
}