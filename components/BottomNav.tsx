'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, PlusCircle, MessageCircle, Menu, X, User, Heart, Shield, LogOut, FileText, ChevronRight, HelpCircle } from 'lucide-react'
import { auth, db } from '@/lib/firebase' // Adicionado db
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, onSnapshot } from 'firebase/firestore' // Importado funções do Firestore

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0) // Estado da bolinha vermelha

  // Verifica usuário e escuta as mensagens não lidas
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        // Escuta os chats do usuário
        const q = query(
          collection(db, 'chats'),
          where('participantes', 'array-contains', currentUser.uid)
        )

        const unsubscribeChats = onSnapshot(q, (snapshot) => {
          let naoLidas = 0
          snapshot.forEach((doc) => {
            const data = doc.data()
            if (data.lido === false && data.ultimoRemetenteId && data.ultimoRemetenteId !== currentUser.uid) {
              naoLidas++
            }
          })
          setUnreadCount(naoLidas)
        })

        return () => unsubscribeChats()
      } else {
        setUnreadCount(0)
      }
    })
    return () => unsubscribeAuth()
  }, [])

  const handleLogout = async () => {
    const confirmar = window.confirm("Tem certeza que deseja sair?")
    if (confirmar) {
      await signOut(auth)
      setIsMenuOpen(false)
      router.push('/login')
    }
  }

  const closeMenu = () => setIsMenuOpen(false)

  if (pathname === '/login' || pathname === '/cadastro') return null

  return (
    <>
      {/* ESPAÇO FANTASMA PARA A BARRA NÃO COBRIR CONTEÚDO */}
      <div className="h-16 md:hidden"></div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR PRINCIPAL */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link href="/" onClick={closeMenu} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${pathname === '/' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <Home size={24} strokeWidth={pathname === '/' ? 2.5 : 2} className={pathname === '/' ? 'scale-110 transition-transform' : ''} />
            <span className="text-[10px] font-bold mt-1">Início</span>
          </Link>

          <Link href="/todos-anuncios" onClick={closeMenu} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${pathname === '/todos-anuncios' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <Search size={24} strokeWidth={pathname === '/todos-anuncios' ? 2.5 : 2} />
            <span className="text-[10px] font-bold mt-1">Buscar</span>
          </Link>

          <Link href="/anunciar" onClick={closeMenu} className="flex flex-col items-center justify-center w-full h-full -mt-5">
            <div className="bg-accent text-white p-3 rounded-full shadow-lg border-4 border-gray-50 transform hover:scale-105 transition-transform">
              <PlusCircle size={28} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold mt-1 text-accent">Anunciar</span>
          </Link>

          {/* BOTÃO DO CHAT COM A BOLINHA VERMELHA NA BARRA INFERIOR */}
          <Link href="/chat" onClick={closeMenu} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${pathname.includes('/chat') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className="relative">
              <MessageCircle size={24} strokeWidth={pathname.includes('/chat') ? 2.5 : 2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-1">Chat</span>
          </Link>

          {/* BOTÃO MÁGICO DO MENU */}
          <button onClick={() => setIsMenuOpen(true)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isMenuOpen ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <Menu size={24} strokeWidth={isMenuOpen ? 2.5 : 2} className={isMenuOpen ? 'scale-110 transition-transform' : ''} />
            <span className="text-[10px] font-bold mt-1">Menu</span>
          </button>
        </div>
      </nav>

      {/* OVERLAY ESCURO (Fundo desfocado) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300"
          onClick={closeMenu}
        ></div>
      )}

      {/* GAVETA DO MENU (BOTTOM SHEET) */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-50 md:hidden transition-transform duration-300 ease-in-out transform ${isMenuOpen ? 'translate-y-0 shadow-[0_-20px_40px_rgba(0,0,0,0.2)]' : 'translate-y-full'}`}>
        <div className="w-full flex justify-center pt-3 pb-1" onClick={closeMenu}>
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="p-6 pt-2 pb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Mais Opções</h2>
            <button onClick={closeMenu} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {user ? (
              <>
                <Link href="/perfil" onClick={closeMenu} className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl hover:bg-primary/10 transition group">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-full text-primary group-hover:scale-110 transition-transform"><User size={24} /></div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Meu Perfil</h3>
                      <p className="text-xs text-gray-500 font-medium">Editar dados e foto</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </Link>

                <Link href="/meus-anuncios" onClick={closeMenu} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition group">
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-200 p-3 rounded-full text-gray-600 shadow-sm group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">Meus Anúncios</h3>
                      <p className="text-xs text-gray-500 font-medium">Gerenciar vendas</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </Link>

                <Link href="/favoritos" onClick={closeMenu} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition group">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-50 text-red-500 p-3 rounded-full group-hover:scale-110 transition-transform"><Heart size={24} /></div>
                    <h3 className="font-bold text-gray-900 text-base">Favoritos</h3>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </Link>
              </>
            ) : (
              <Link href="/login" onClick={closeMenu} className="flex items-center justify-center p-4 bg-primary text-white rounded-2xl font-bold shadow-md hover:bg-primary-dark transition text-lg mb-4">
                Entrar / Cadastrar
              </Link>
            )}

            <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
              <Link href="/seguranca" onClick={closeMenu} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition font-bold text-gray-700">
                <Shield size={22} className="text-blue-500" /> Dicas de Segurança
              </Link>
              
              <Link href="/contato" onClick={closeMenu} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition font-bold text-gray-700">
                <HelpCircle size={22} className="text-orange-500" /> Ajuda e Contato
              </Link>
            </div>

            {user && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition">
                  <LogOut size={20} /> Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}