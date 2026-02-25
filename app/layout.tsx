import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer' // IMPORTAMOS O FOOTER AQUI

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
      <body className={inter.className}>
        <Navbar />
        {/* pb-20 no mobile para dar espaço à BottomNav e md:pb-0 no desktop */}
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* ADICIONAMOS O FOOTER AQUI, com padding inferior no mobile */}
        <div className="pb-16 md:pb-0">
          <Footer />
        </div>
        
        <BottomNav />
      </body>
    </html>
  )
}