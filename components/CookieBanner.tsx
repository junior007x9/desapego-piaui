'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verifica se o usuário já aceitou antes
    const consent = localStorage.getItem('lgpd_cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('lgpd_cookie_consent', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 z-[99] pb-[80px] md:pb-4 md:bottom-4 md:left-4 md:right-auto md:w-96 md:rounded-2xl md:border">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600 font-medium leading-relaxed">
          Nós utilizamos cookies e outras tecnologias para melhorar a sua experiência e segurança. Ao continuar navegando, você concorda com a nossa{' '}
          <Link href="/privacidade" className="text-primary font-bold hover:underline">
            Política de Privacidade
          </Link>.
        </p>
        <button 
          onClick={handleAccept}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-xl w-full transition-colors text-sm"
        >
          Entendi e Aceito
        </button>
      </div>
    </div>
  )
}