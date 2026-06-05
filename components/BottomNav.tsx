'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Plus, Menu, X, User, Heart, Shield, LogOut, FileText, ChevronRight, HelpCircle, Coins } from 'lucide-react'
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
  if (pathname?.startsWith('/chat')) return null // Esconde no chat para não atrapalhar o teclado

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* ESPAÇO FANTASMA PARA A BARRA NÃO COBRIR CONTEÚDO */}
      <div className="h-28 md:hidden"></div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR FLUTUANTE 3D */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 pointer-events-none">
        <nav className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_10px_40px_rgba(109,40,217,0.15)] rounded-[2rem] flex justify-between items-center px-2 h-[72px] relative pointer-events-auto">
          
          {/* Esquerda */}
          <div className="flex w-2/5 justify-around h-full">
            <Link href="/" onClick={closeMenu} className={`relative flex flex-col items-center justify-center w-full h-full group outline-none ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              <div className={`transition-all duration-300 ${isActive('/') ? '-translate-y-1' : 'group-active:scale-90'}`}>
                <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive('/') ? 'opacity-100' : 'opacity-70'}`}>Início</span>
              {isActive('/') && <div className="w-1.5 h-1.5 bg-primary rounded-full absolute bottom-1 shadow-[0_0_8px_rgba(109,40,217,0.8)]" />}
            </Link>
            
            <Link href="/todos-anuncios" onClick={closeMenu} className={`relative flex flex-col items-center justify-center w-full h-full group outline-none ${isActive('/todos-anuncios') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              <div className={`transition-all duration-300 ${isActive('/todos-anuncios') ? '-translate-y-1' : 'group-active:scale-90'}`}>
                <Search size={24} strokeWidth={isActive('/todos-anuncios') ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive('/todos-anuncios') ? 'opacity-100' : 'opacity-70'}`}>Buscar</span>
              {isActive('/todos-anuncios') && <div className="w-1.5 h-1.5 bg-primary rounded-full absolute bottom-1 shadow-[0_0_8px_rgba(109,40,217,0.8)]" />}
            </Link>
          </div>

          {/* Centro - Botão 3D Flutuante Realista */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex justify-center w-1/5">
            <Link href="/anunciar" onClick={closeMenu} className="group flex flex-col items-center outline-none">
              <div className="bg-gradient-to-b from-primary to-primary-dark text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(109,40,217,0.5)] border-[3px] border-white 
                border-b-[6px] active:border-b-[3px] active:translate-y-[3px] transition-all duration-150">
                <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              </div>
            </Link>
          </div>

          {/* Direita */}
          <div className="flex w-2/5 justify-around h-full">
            <Link href="/favoritos" onClick={closeMenu} className={`relative flex flex-col items-center justify-center w-full h-full group outline-none ${isActive('/favoritos') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              <div className={`transition-all duration-300 ${isActive('/favoritos') ? '-translate-y-1' : 'group-active:scale-90'}`}>
                <Heart size={24} strokeWidth={isActive('/favoritos') ? 2.5 : 2} className={isActive('/favoritos') ? 'fill-primary' : ''} />
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive('/favoritos') ? 'opacity-100' : 'opacity-70'}`}>Favoritos</span>
              {isActive('/favoritos') && <div className="w-1.5 h-1.5 bg-primary rounded-full absolute bottom-1 shadow-[0_0_8px_rgba(109,40,217,0.8)]" />}
            </Link>

            {/* BOTÃO DO MENU (Mantivemos a sua gaveta) */}
            <button onClick={() => setIsMenuOpen(true)} className={`relative flex flex-col items-center justify-center w-full h-full group outline-none ${isMenuOpen ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              <div className={`transition-all duration-300 ${isMenuOpen ? '-translate-y-1' : 'group-active:scale-90'}`}>
                <Menu size={24} strokeWidth={isMenuOpen ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-70'}`}>Menu</span>
              {isMenuOpen && <div className="w-1.5 h-1.5 bg-primary rounded-full absolute bottom-1 shadow-[0_0_8px_rgba(109,40,217,0.8)]" />}
            </button>
          </div>

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