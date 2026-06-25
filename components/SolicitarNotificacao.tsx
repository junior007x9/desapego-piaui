'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { BellRing, X } from 'lucide-react'

// OBS: Este componente pede permissão e salva o Token do usuário no Banco de Dados
export default function SolicitarNotificacao() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [userUid, setUserUid] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserUid(currentUser.uid)
        // Checa se o navegador suporta notificações e se já não foram bloqueadas/aceitas
        if ('Notification' in window && Notification.permission === 'default') {
          // Espera 3 segundos antes de mostrar o banner para não ser agressivo
          const timer = setTimeout(() => setShowPrompt(true), 3000)
          return () => clearTimeout(timer)
        }
      }
    })
    return () => unsubscribe()
  }, [])

  const handleRequestPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted' && userUid) {
        await updateDoc(doc(db, 'users', userUid), {
          aceitaNotificacoesPush: true,
          dataAutorizacaoPush: new Date()
        })
        
        alert("🎉 Sucesso! Agora você será avisado sobre suas vendas e moedas.")
        setShowPrompt(false)
      } else {
        setShowPrompt(false)
      }
    } catch (error) {
      console.error("Erro ao pedir permissão:", error)
      setShowPrompt(false)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white p-5 rounded-2xl shadow-2xl border border-primary/20 z-[9999] animate-in slide-in-from-bottom-5 flex gap-4">
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
        <BellRing size={24} className="animate-pulse" />
      </div>
      <div className="flex-1">
        <h3 className="text-gray-900 font-black text-sm mb-1">Ativar Alertas de Venda?</h3>
        <p className="text-gray-500 text-xs font-medium leading-relaxed mb-3">
          Seja avisado instantaneamente quando seus anúncios estiverem expirando ou quando ganhar moedas virtuais.
        </p>
        <div className="flex gap-2">
          <button onClick={handleRequestPermission} className="bg-primary hover:bg-primary-dark text-white text-xs font-black px-4 py-2 rounded-lg flex-1 transition-colors">
            Ativar Agora
          </button>
          <button onClick={() => setShowPrompt(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-3 py-2 rounded-lg transition-colors">
            Agora não
          </button>
        </div>
      </div>
      <button onClick={() => setShowPrompt(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
        <X size={16} />
      </button>
    </div>
  )
}