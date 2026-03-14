import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

// OTIMIZAÇÃO GLOBAL DE SEO (Google, WhatsApp, Facebook)
export const metadata: Metadata = {
  title: 'DesapegoPI - O maior marketplace do Piauí',
  description: 'Compre e venda produtos novos e usados de forma fácil, rápida e segura em Teresina e em todo o Piauí!',
  keywords: 'desapego, piauí, teresina, comprar, vender, classificados, mercado livre, usados, desapegopi',
  openGraph: {
    title: 'DesapegoPI - O maior marketplace do Piauí',
    description: 'Compre e venda produtos novos e usados de forma fácil, rápida e segura no PI.',
    url: 'https://desapegopi.com', 
    siteName: 'DesapegoPI',
    images: [
      {
        url: 'https://i.imgur.com/vHqB0aA.png', 
        width: 1200,
        height: 630,
        alt: 'Capa DesapegoPI',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        {/* GOOGLE ANALYTICS 4 (Troque G-SEU_ID_AQUI pelo seu ID real) */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-SEU_ID_AQUI" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-998KLBW15Q');
          `}
        </Script>

        {/* META PIXEL DO FACEBOOK/INSTAGRAM (Troque SEU_PIXEL_ID pelo seu ID numérico) */}
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
      </head>

      <body className={`${inter.className} bg-gray-50 flex flex-col min-h-screen w-full overflow-x-hidden`}>
        <Navbar />
        
        <main className="flex-grow pb-16 md:pb-0 w-full overflow-x-hidden">
          {children}
        </main>
        
        <div className="pb-16 md:pb-0 w-full">
          <Footer />
        </div>
        
        <BottomNav />
        
        <CookieBanner />
      </body>
    </html>
  )
}