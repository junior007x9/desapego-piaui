import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

// Configurações de SEO e Título do Site
export const metadata: Metadata = {
  title: 'Desapego Piauí',
  description: 'A melhor plataforma para conectar quem quer vender com quem quer comprar no Piauí.',
};

// É ESTA CONFIGURAÇÃO QUE CONSERTA A TELA NO CELULAR 👇
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {/* O pb-16 no mobile é para o BottomNav não ficar por cima do conteúdo */}
      <body className="bg-gray-50 text-gray-900 pb-16 md:pb-0 min-h-screen flex flex-col">
        <Navbar />
        
        {/* Onde o conteúdo de cada página (Home, Anunciar, etc) vai aparecer */}
        <main className="flex-grow">
          {children}
        </main>
        
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}