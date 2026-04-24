import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import FeedbackButton from '@/components/FeedbackButton'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast' // 🚀 IMPORTAÇÃO DOS AVISOS (TOASTS)

const inter = Inter({ subsets: ['latin'] })

// OTIMIZAÇÃO GLOBAL DE SEO (Google, WhatsApp, Facebook) E PWA
export const metadata: Metadata = {
  title: 'Desapego Piauí | Compra e Venda de Forma Rápida e Local',
  description: 'A melhor plataforma para conectar quem quer vender com quem quer comprar no Piauí. Simples, rápido e local. Anuncie imóveis, carros, celulares e muito mais!',
  manifest: '/manifest.json', // 🚀 ATIVADOR DO PWA (Ícone na tela inicial)
  keywords: [
    "desapego piaui", 
    "olx piaui", 
    "classificados teresina", 
    "compra e venda piaui", 
    "vender celular teresina", 
    "carros seminovos piaui", 
    "imoveis piaui",
    "desapegopi"
  ],
  authors: [{ name: "AARTI ESTUDIO" }],
  openGraph: {
    title: 'Desapego Piauí | Compra e Venda',
    description: 'Compre e venda produtos novos e usados de forma fácil, rápida e segura no PI.',
    url: 'https://desapegopiaui.com.br', 
    siteName: 'Desapego Piauí',
    images: [
      {
        url: 'https://i.imgur.com/vHqB0aA.png', 
        width: 1200,
        height: 630,
        alt: 'Capa Desapego Piauí',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Bloqueios de zoom removidos para o movimento de pinça nas fotos funcionar!
  themeColor: '#4c1d95', 
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <head>
        {/* GOOGLE SITE VERIFICATION (Aprovação do Search Console) */}
        <meta name="google-site-verification" content="MpSBIeObHIeNjSIanheXLRqWVLvCtzPsu2Qtv2Ydo8E" />

        {/* GOOGLE ANALYTICS 4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-998KLBW15Q" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-998KLBW15Q');
          `}
        </Script>

        {/* META PIXEL DO FACEBOOK/INSTAGRAM */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', 'SEU_PIXEL_ID');
            fbq('track', 'PageView');
          `}
        </Script>

        {/* GOOGLE ADSENSE (Monetização) */}
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5151678673256465"
        />
      </head>

      <body className={`${inter.className} bg-gray-50 flex flex-col min-h-screen w-full overflow-x-hidden`}>
        
        {/* 🚀 ATIVADOR DO APLICATIVO (Service Worker) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />

        <Navbar />
        
        <main className="flex-grow pb-16 md:pb-0 w-full overflow-x-hidden">
          {children}
        </main>
        
        <div className="pb-16 md:pb-0 w-full">
          <Footer />
        </div>
        
        <BottomNav />
        <CookieBanner />
        <FeedbackButton />
        
        {/* 🚀 O ALTO-FALANTE DE NOTIFICAÇÕES (Instalado em todas as páginas) */}
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            style: { background: '#10B981' }
          },
          error: {
            style: { background: '#EF4444' }
          }
        }} />

      </body>
    </html>
  )
}