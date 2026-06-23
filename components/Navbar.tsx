'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bell, BookOpen, Coins, Plus, HelpCircle, Heart } from 'lucide-react';
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
    <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Cabeçalho Compacto: h-14 no mobile, h-20 no PC */}
        <div className="flex justify-between items-center h-14 md:h-20 gap-2">
          
          {/* LOGO */}
          <div className="flex items-center shrink-0">
            <Link href="/" title="Ir para a Página Inicial" className="flex items-center gap-2 group outline-none">
              <div className="w-8 h-8 md:w-12 md:h-12 rounded-[0.6rem] md:rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex items-center justify-center bg-gray-50">
                <Image 
                  src="/logo.jpeg" 
                  alt="Logo" 
                  width={48}
                  height={48}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-primary font-black text-[1.1rem] md:text-2xl tracking-tighter leading-none flex items-center">
                Desapego<span className="text-accent">Piauí</span>
              </span>
            </Link>
          </div>

          {/* MENU DESKTOP (Invisível no Celular) */}
          <div className="hidden md:flex items-center justify-end gap-5 flex-1">
            <div title="Sua localização atual" className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm mr-2 cursor-help whitespace-nowrap">
              <MapPin size={16} className="text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">{locFull}</span>
            </div>

            <Link href="/tutorial" className="flex items-center gap-1.5 text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none whitespace-nowrap">
              <HelpCircle size={18} /> Tutorial
            </Link>
            <Link href="/blog" className="flex items-center gap-1.5 text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none whitespace-nowrap">
              <BookOpen size={18} /> Dicas
            </Link>
            <Link href="/favoritos" className="flex items-center gap-1.5 text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none whitespace-nowrap">
              <Heart size={18} /> Favoritos
            </Link>
            
            {user ? (
              <div className="flex items-center gap-4 border-l border-gray-200 pl-4 ml-2">
                <Link href="/carteira" className="flex items-center gap-1.5 bg-amber-50 text-amber-600 hover:text-amber-700 font-black text-sm px-4 py-2 rounded-xl border border-amber-200 transition-all shadow-sm outline-none whitespace-nowrap">
                  <Coins size={18} /> Carteira
                </Link>
                <Link href="/meus-anuncios" className="text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none whitespace-nowrap">
                  Meus Anúncios
                </Link>
                <Link href="/perfil" className="text-gray-500 hover:text-primary font-bold text-sm transition-colors outline-none whitespace-nowrap">
                  Minha Conta
                </Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 font-bold text-sm transition-colors outline-none whitespace-nowrap">
                  Sair
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-gray-200 pl-4 ml-2">
                <Link href="/login" className="text-primary hover:text-primary-dark font-black text-sm transition-colors outline-none whitespace-nowrap">
                  Entrar
                </Link>
              </div>
            )}

            <Link href={user ? "/anunciar" : "/login"} className="bg-accent hover:bg-[#d97706] text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-md ml-2 outline-none whitespace-nowrap">
              <Plus size={18} strokeWidth={3} /> Anunciar Grátis
            </Link>
          </div>

          {/* MENU MOBILE COMPACTO (Aparece só no Celular) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
             <div className="flex items-center gap-1 text-gray-600 font-bold text-[9px] uppercase tracking-wider bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                <MapPin size={12} className="text-accent" />
                <span className="truncate max-w-[60px]">{locShort}</span>
             </div>
             
             {user && (
               <Link href="/carteira" className="text-amber-500 bg-amber-50 border border-amber-200 w-8 h-8 rounded-full flex items-center justify-center shadow-sm outline-none">
                 <Coins size={16} strokeWidth={2.5} />
               </Link>
             )}

             <Link href="/notificacoes" className="relative text-gray-500 bg-gray-50 border border-gray-200 w-8 h-8 rounded-full flex items-center justify-center shadow-sm outline-none">
                <Bell size={16} strokeWidth={2.5} />
                <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                </span>
             </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}