"use client";

import Link from 'next/link';
import { MapPin, Bell, PlusCircle } from 'lucide-react';
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
      alert("Você saiu com sucesso!");
      router.push('/');
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LADO ESQUERDO: Localização e Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl md:text-2xl font-black text-purple-600 tracking-tighter italic">
                Desapego<span className="text-gray-900">PI</span>
              </span>
            </Link>
            
            <div className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-purple-600 cursor-pointer transition">
              <MapPin size={18} />
              <span className="text-sm font-bold">Teresina, PI</span>
            </div>
          </div>

          {/* LADO DIREITO: Apenas visível no Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/chat" className="text-gray-600 hover:text-purple-600 font-medium">Chat</Link>
            <Link href="/favoritos" className="text-gray-600 hover:text-purple-600 font-medium">Favoritos</Link>
            
            {user ? (
              <div className="flex items-center gap-4">
                {/* NOVO: Link para Meus Anúncios */}
                <Link href="/meus-anuncios" className="text-gray-600 hover:text-purple-600 font-medium text-sm">Meus Anúncios</Link>
                <Link href="/perfil" className="text-gray-600 hover:text-purple-600 font-medium text-sm">Minha Conta</Link>
                <button onClick={handleLogout} className="text-red-500 font-bold text-sm">Sair</button>
              </div>
            ) : (
              <Link href="/login" className="text-purple-600 font-bold">Entrar</Link>
            )}

            <Link 
              href={user ? "/anunciar" : "/login"} 
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-bold transition-all shadow-md"
            >
              Anunciar
            </Link>
          </div>

          {/* ICONES MOBILE (Sininho e Localização simplificada) */}
          <div className="flex md:hidden items-center gap-4">
             <div className="flex items-center gap-1 text-gray-800 font-bold text-sm">
                <MapPin size={18} className="text-purple-600" />
                <span>Teresina</span>
             </div>
             <button className="text-gray-500">
                <Bell size={24} />
             </button>
          </div>

        </div>
      </div>
    </nav>
  );
}