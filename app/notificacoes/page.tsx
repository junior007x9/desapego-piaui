'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { Bell, ChevronLeft, CheckCircle2, AlertTriangle, Info, Loader2, BellRing } from 'lucide-react'
import Link from 'next/link'

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      try {
        // Tenta buscar as notificações do usuário no Firebase
        const q = query(
          collection(db, 'notificacoes'),
          where('usuarioId', '==', currentUser.uid),
          orderBy('criadoEm', 'desc')
        )
        const snap = await getDocs(q)
        
        const lista: any[] = []
        snap.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() })
        })

        // Se não tiver notificações reais, colocamos uma mensagem de Boas-Vindas padrão
        if (lista.length === 0) {
           lista.push({
              id: 'welcome-1',
              tipo: 'sucesso',
              titulo: 'Bem-vindo ao Desapego Piauí!',
              mensagem: 'Sua conta foi criada com sucesso. Fique de olho aqui para receber novidades, avisos de vendas e bônus exclusivos.',
              criadoEm: new Date(),
              lida: false
           })
        }

        setNotificacoes(lista)
      } catch (error) {
        console.error("Erro ao buscar notificações:", error)
        // Fallback caso a coleção 'notificacoes' ainda não exista no Firebase
        setNotificacoes([{
          id: 'welcome-1',
          tipo: 'info',
          titulo: 'Área de Notificações',
          mensagem: 'Você receberá alertas sobre seus anúncios e mensagens por aqui.',
          criadoEm: new Date(),
          lida: false
        }])
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  // Função para formatar a data da notificação
  const formatarData = (data: any) => {
    if (!data) return 'Agora mesmo'
    const dateObj = data.toDate ? data.toDate() : new Date(data)
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // Define o ícone e a cor com base no tipo de notificação
  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return <div className="bg-green-100 text-green-600 p-3 rounded-full shrink-0"><CheckCircle2 size={24} /></div>
      case 'alerta':
        return <div className="bg-amber-100 text-amber-600 p-3 rounded-full shrink-0"><AlertTriangle size={24} /></div>
      default:
        return <div className="bg-blue-100 text-blue-600 p-3 rounded-full shrink-0"><Info size={24} /></div>
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-10 font-sans">
      
      {/* HEADER MOBILE & DESKTOP */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition outline-none md:hidden">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="text-primary hidden md:block" size={24} /> 
              Notificações
            </h1>
          </div>
          <span className="bg-primary/10 text-primary font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider">
            {notificacoes.length} Novas
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {loading ? (
          // SKELETON LOADER
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-full"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notificacoes.length === 0 ? (
          // EMPTY STATE (Caso não tenha notificações)
          <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-sm mt-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <BellRing size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Tudo tranquilo por aqui!</h2>
            <p className="text-gray-500 font-medium mb-8 max-w-sm">Você não tem novas notificações no momento. Avisaremos quando houver novidades.</p>
            <Link href="/" className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95 outline-none">
              Voltar para o Início
            </Link>
          </div>
        ) : (
          // LISTA DE NOTIFICAÇÕES
          <div className="space-y-3 md:space-y-4">
            {notificacoes.map((notif) => (
              <div 
                key={notif.id} 
                className={`bg-white p-4 md:p-5 rounded-2xl border transition-all flex gap-3 md:gap-4 shadow-sm hover:shadow-md ${notif.lida ? 'border-gray-100 opacity-75' : 'border-primary/20'}`}
              >
                {getIcone(notif.tipo)}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-gray-900 text-sm md:text-base leading-tight pr-4">
                      {notif.titulo}
                    </h3>
                    <span className="text-[10px] md:text-xs text-gray-400 font-bold whitespace-nowrap shrink-0">
                      {formatarData(notif.criadoEm)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs md:text-sm font-medium leading-relaxed">
                    {notif.mensagem}
                  </p>
                  
                  {!notif.lida && (
                    <div className="mt-3">
                       <span className="inline-block bg-accent/10 text-accent text-[10px] font-black uppercase px-2 py-1 rounded">Nova</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}