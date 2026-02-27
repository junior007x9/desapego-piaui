"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bell } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
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
        {/* Altura menor no mobile (h-14) e normal no PC (md:h-16) */}
        <div className="flex justify-between h-14 md:h-16 items-center">
          
          {/* LADO ESQUERDO: Logo Redonda e Nome */}
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="rounded-full overflow-hidden border border-gray-100 shadow-sm w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-gray-50">
                <Image 
                  src="/logo.jpeg" 
                  alt="Logo" 
                  width={40}
                  height={40}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-primary font-extrabold text-lg md:text-xl tracking-tighter group-hover:text-primary-dark transition">
                Desapego <span className="text-accent">Piauí</span>
              </span>
            </Link>
          </div>

          {/* LADO DIREITO: Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center gap-1 text-gray-500 hover:text-primary cursor-pointer transition mr-2">
              <MapPin size={18} />
              <span className="text-sm font-medium">Teresina, PI</span>
            </div>
            <Link href="/chat" className="text-gray-600 hover:text-primary font-medium transition">Chat</Link>
            <Link href="/favoritos" className="text-gray-600 hover:text-primary font-medium transition">Favoritos</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/meus-anuncios" className="text-gray-600 hover:text-primary font-medium text-sm transition">Meus Anúncios</Link>
                <Link href="/perfil" className="text-gray-600 hover:text-primary font-medium text-sm transition">Minha Conta</Link>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-600 font-bold text-sm transition">Sair</button>
              </div>
            ) : (
              <Link href="/login" className="text-primary hover:text-primary-dark font-bold transition">Entrar</Link>
            )}

            <Link 
              href={user ? "/anunciar" : "/login"} 
              className="bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-full font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Anunciar
            </Link>
          </div>

          {/* ICONES MOBILE (Apenas localização curta e sino) */}
          <div className="flex md:hidden items-center gap-3">
             <div className="flex items-center gap-1 text-gray-800 font-bold text-xs bg-gray-100 px-2 py-1.5 rounded-full">
                <MapPin size={14} className="text-accent" />
                <span>Teresina</span>
             </div>
             <button className="text-gray-500 hover:text-primary transition">
                <Bell size={20} />
             </button>
          </div>

        </div>
      </div>
    </nav>
  );
}