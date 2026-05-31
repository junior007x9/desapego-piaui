"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bell, BookOpen } from 'lucide-react';
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
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LOGO */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="rounded-full overflow-hidden border border-gray-100 shadow-sm w-9 h-9 md:w-11 md:h-11 flex items-center justify-center bg-gray-50">
                <Image 
                  src="/logo.jpeg" 
                  alt="Logo Desapego Piauí" 
                  width={44}
                  height={44}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-primary font-black text-xl tracking-tighter group-hover:text-primary-dark transition-colors">
                Desapego <span className="text-accent">Piauí</span>
              </span>
            </Link>
          </div>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full mr-2">
              <MapPin size={16} className="text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider">{locFull}</span>
            </div>

            {/* 🚀 LINK DO BLOG ADICIONADO AQUI */}
            <Link href="/blog" className="flex items-center gap-1 text-gray-600 hover:text-primary font-bold text-sm transition-colors">
              <BookOpen size={16} /> Dicas
            </Link>

            <Link href="/favoritos" className="text-gray-600 hover:text-primary font-bold text-sm transition-colors">Favoritos</Link>
            
            {user ? (
              <div className="flex items-center gap-5 border-l border-gray-200 pl-6 ml-2">
                <Link href="/meus-anuncios" className="text-gray-600 hover:text-primary font-bold text-sm transition-colors">Meus Anúncios</Link>
                <Link href="/perfil" className="text-gray-600 hover:text-primary font-bold text-sm transition-colors">Minha Conta</Link>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 font-bold text-sm transition-colors">Sair</button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-gray-200 pl-6 ml-2">
                <Link href="/login" className="text-primary hover:text-primary-dark font-black text-sm transition-colors">Entrar</Link>
              </div>
            )}

            <Link 
              href={user ? "/anunciar" : "/login"} 
              className="bg-accent hover:bg-accent-dark text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ml-2"
            >
              + Anunciar Grátis
            </Link>
          </div>

          {/* MENU MOBILE (Minimalista, o resto fica no BottomNav) */}
          <div className="flex md:hidden items-center gap-3">
             <div className="flex items-center gap-1 text-gray-800 font-black text-[10px] uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-full">
                <MapPin size={12} className="text-accent" />
                <span className="truncate max-w-[90px]">{locShort}</span>
             </div>
             <button className="text-gray-500 hover:text-primary transition-colors bg-gray-50 p-2 rounded-full">
                <Bell size={18} />
             </button>
          </div>

        </div>
      </div>
    </nav>
  );
}