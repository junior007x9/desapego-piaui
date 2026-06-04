'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, PlusCircle, Menu, X, User, Heart, Shield, LogOut, FileText, ChevronRight, HelpCircle, Coins } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
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
      <div className="h-24 md:hidden"></div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR FLUTUANTE (APP STYLE) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 px-4 pb-5 pt-2 pointer-events-none">
        <nav className="glass border border-gray-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl flex justify-around items-end px-2 pb-2 pt-3 pointer-events-auto relative">
          
          {/* 1. INÍCIO */}
          <Link href="/" onClick={closeMenu} className={`flex flex-col items-center justify-center transition-all duration-300 w-16 outline-none ${pathname === '/' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className={`relative transition-transform duration-300 ${pathname === '/' ? '-translate-y-1' : ''}`}>
              <Home size={22} strokeWidth={pathname === '/' ? 2.5 : 2} />
              {pathname === '/' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </div>
            <span className={`text-[10px] font-bold mt-1.5 transition-all duration-300 ${pathname === '/' ? 'opacity-100' : 'opacity-0 translate-y-2 absolute'}`}>Início</span>
          </Link>

          {/* 2. BUSCAR */}
          <Link href="/todos-anuncios" onClick={closeMenu} className={`flex flex-col items-center justify-center transition-all duration-300 w-16 outline-none ${pathname === '/todos-anuncios' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className={`relative transition-transform duration-300 ${pathname === '/todos-anuncios' ? '-translate-y-1' : ''}`}>
              <Search size={22} strokeWidth={pathname === '/todos-anuncios' ? 2.5 : 2} />
              {pathname === '/todos-anuncios' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </div>
            <span className={`text-[10px] font-bold mt-1.5 transition-all duration-300 ${pathname === '/todos-anuncios' ? 'opacity-100' : 'opacity-0 translate-y-2 absolute'}`}>Buscar</span>
          </Link>

          {/* 3. ANUNCIAR (CENTRALIZADO, FLUTUANTE E COM ANIMAÇÃO) */}
          <Link href="/anunciar" onClick={closeMenu} className="relative -top-6 flex flex-col items-center group px-2 outline-none">
            <div className="bg-accent hover:bg-accent-dark text-white p-4 rounded-full shadow-lg shadow-accent/40 transform transition-transform active:scale-90 animate-float border-4 border-white/50">
              <PlusCircle size={28} strokeWidth={2.5} />
            </div>
          </Link>

          {/* 4. FAVORITOS */}
          <Link href="/favoritos" onClick={closeMenu} className={`flex flex-col items-center justify-center transition-all duration-300 w-16 outline-none ${pathname === '/favoritos' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className={`relative transition-transform duration-300 ${pathname === '/favoritos' ? '-translate-y-1' : ''}`}>
              <Heart size={22} strokeWidth={pathname === '/favoritos' ? 2.5 : 2} className={pathname === '/favoritos' ? 'fill-primary' : ''} />
              {pathname === '/favoritos' && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </div>
            <span className={`text-[10px] font-bold mt-1.5 transition-all duration-300 ${pathname === '/favoritos' ? 'opacity-100' : 'opacity-0 translate-y-2 absolute'}`}>Favoritos</span>
          </Link>

          {/* 5. MENU GAVETA */}
          <button onClick={() => setIsMenuOpen(true)} className={`flex flex-col items-center justify-center transition-all duration-300 w-16 outline-none ${isMenuOpen ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
            <div className={`relative transition-transform duration-300 ${isMenuOpen ? '-translate-y-1' : ''}`}>
              <Menu size={22} strokeWidth={isMenuOpen ? 2.5 : 2} />
              {isMenuOpen && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </div>
            <span className={`text-[10px] font-bold mt-1.5 transition-all duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 translate-y-2 absolute'}`}>Menu</span>
          </button>
        </nav>
      </div>

      {/* OVERLAY COM DESFOQUE PARA O MENU ABERTO */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={closeMenu}
        ></div>
      )}

      {/* GAVETA DE MENU */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-50 md:hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] transform ${isMenuOpen ? 'translate-y-0 shadow-[0_-20px_40px_rgba(0,0,0,0.15)]' : 'translate-y-full'}`}>
        <div className="w-full flex justify-center pt-4 pb-2 cursor-pointer" onClick={closeMenu}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="p-6 pt-2 pb-8 max-h-[85vh] overflow-y-auto scrollbar-hide">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Mais Opções</h2>
            <button onClick={closeMenu} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {user ? (
              <>
                {/* 🚀 BOTÃO DA CARTEIRA EM DESTAQUE NO MENU MOBILE */}
                <Link href="/carteira" onClick={closeMenu} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl hover:bg-amber-100 border border-amber-100 transition-colors group mb-2 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-full text-amber-500 group-hover:scale-110 transition-transform shadow-sm"><Coins size={24} /></div>
                    <div>
                      <h3 className="font-black text-amber-900 text-base">Minha Carteira</h3>
                      <p className="text-xs text-amber-600 font-medium">Troque moedas por Destaque</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-amber-500" />
                </Link>

                <Link href="/perfil" onClick={closeMenu} className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl hover:bg-primary/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-full text-primary group-hover:scale-110 transition-transform"><User size={24} /></div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base">Meu Perfil</h3>
                      <p className="text-xs text-gray-500 font-medium">Editar dados e foto</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-primary/50" />
                </Link>

                <Link href="/meus-anuncios" onClick={closeMenu} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-200 p-3 rounded-full text-gray-600 shadow-sm group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base">Meus Anúncios</h3>
                      <p className="text-xs text-gray-500 font-medium">Gerenciar vendas</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </Link>
              </>
            ) : (
              <Link href="/login" onClick={closeMenu} className="flex items-center justify-center p-4 bg-primary text-white rounded-2xl font-black shadow-md hover:bg-primary-dark transition-colors text-lg mb-4">
                Entrar / Cadastrar
              </Link>
            )}

            <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
              <Link href="/seguranca" onClick={closeMenu} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors font-bold text-gray-700">
                <Shield size={24} className="text-blue-500" /> Dicas de Segurança
              </Link>
              
              <Link href="/contato" onClick={closeMenu} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors font-bold text-gray-700">
                <HelpCircle size={24} className="text-orange-500" /> Ajuda e Contato
              </Link>
            </div>

            {user && (
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-colors">
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