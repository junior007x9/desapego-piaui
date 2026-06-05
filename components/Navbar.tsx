'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bell, BookOpen, Coins, Plus } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  const [locFull, setLocFull] = useState('Carregando...');
  const [locShort, setLocShort] = useState('...');
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    async function fetchLocation() {
      try {
        const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=pt');
        const data = await res.json();
        
        const city = data.city || data.locality || 'Teresina';
        let state = 'PI';
        
        if (data.principalSubdivisionCode && data.principalSubdivisionCode.includes('-')) {
          state = data.principalSubdivisionCode.split('-')[1]; 
        } else if (data.principalSubdivision) {
          state = data.principalSubdivision.substring(0, 2).toUpperCase();
        }

        setLocFull(`${city}, ${state}`);
        setLocShort(city);
      } catch (error) {
        console.error("Erro de localização:", error);
        setLocFull('Teresina, PI');
        setLocShort('Teresina');
      }
    }
    fetchLocation();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Deseja sair da sua conta?")) {
      await signOut(auth);
      router.push('/');
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-gray-100 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* LOGO (Com animação 3D sutil) */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group outline-none">
              <div className="rounded-2xl overflow-hidden border-2 border-b-[4px] border-gray-200 shadow-sm w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-50 group-active:border-b-2 group-active:translate-y-[2px] transition-all duration-150">
                <Image 
                  src="/logo.jpeg" 
                  alt="Logo Desapego Piauí" 
                  width={48}
                  height={48}
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  priority
                />
              </div>
              <span className="text-primary font-black text-xl md:text-2xl tracking-tighter group-hover:text-primary-dark transition-colors">
                Desapego<span className="text-accent">Piauí</span>
              </span>
            </Link>
          </div>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex items-center space-x-5">
            {/* Pílula de Localização 3D */}
            <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border-2 border-b-[4px] border-gray-200 shadow-sm mr-2">
              <MapPin size={16} className="text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">{locFull}</span>
            </div>

            <Link href="/blog" className="flex items-center gap-1.5 text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none">
              <BookOpen size={18} /> Dicas
            </Link>

            <Link href="/favoritos" className="text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none">
              Favoritos
            </Link>
            
            {user ? (
              <div className="flex items-center gap-5 border-l-2 border-gray-100 pl-6 ml-2">
                
                {/* 🚀 BOTÃO DA CARTEIRA VIP 3D */}
                <Link href="/carteira" className="flex items-center gap-1.5 bg-gradient-to-b from-amber-50 to-amber-100 text-amber-600 hover:text-amber-700 font-black text-sm px-5 py-2.5 rounded-xl border-2 border-b-[4px] border-amber-200 active:border-b-2 active:translate-y-[2px] transition-all shadow-sm outline-none">
                  <Coins size={18} /> Carteira
                </Link>

                <Link href="/meus-anuncios" className="text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none">
                  Meus Anúncios
                </Link>
                <Link href="/perfil" className="text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none">
                  Minha Conta
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 font-bold text-sm transition-colors outline-none">
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l-2 border-gray-100 pl-6 ml-2">
                <Link href="/login" className="text-primary hover:text-primary-dark font-black text-sm transition-colors outline-none">
                  Entrar
                </Link>
              </div>
            )}

            {/* BOTÃO ANUNCIAR GRÁTIS 3D REALISTA */}
            <Link 
              href={user ? "/anunciar" : "/login"} 
              className="bg-gradient-to-b from-accent to-[#d97706] text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 border-x border-t border-[#d97706] border-b-[5px] active:border-b-[2px] active:translate-y-[3px] hover:brightness-110 transition-all shadow-md ml-2 outline-none"
            >
              <Plus size={18} strokeWidth={3} />
              Anunciar Grátis
            </Link>
          </div>

          {/* MENU MOBILE */}
          <div className="flex md:hidden items-center gap-3">
             {/* Localização Pílula 3D */}
             <div className="flex items-center gap-1 text-gray-700 font-black text-[10px] uppercase tracking-wider bg-gray-50 border-2 border-b-[4px] border-gray-200 px-3 py-2 rounded-xl shadow-sm">
                <MapPin size={14} className="text-accent" />
                <span className="truncate max-w-[90px]">{locShort}</span>
             </div>
             
             {/* 🚀 ÍCONE DA CARTEIRA NO CELULAR 3D */}
             {user && (
               <Link href="/carteira" className="text-amber-500 bg-gradient-to-b from-amber-50 to-amber-100 border-2 border-b-[4px] border-amber-200 active:border-b-2 active:translate-y-[2px] p-2 rounded-xl transition-all shadow-sm outline-none">
                 <Coins size={20} strokeWidth={2.5} />
               </Link>
             )}

             {/* SINO DE NOTIFICAÇÕES 3D */}
             <Link href="/notificacoes" className="relative text-gray-500 bg-gray-50 border-2 border-b-[4px] border-gray-200 active:border-b-2 active:translate-y-[2px] p-2 rounded-xl transition-all shadow-sm outline-none">
                <Bell size={20} strokeWidth={2.5} />
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white"></span>
                </span>
             </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}