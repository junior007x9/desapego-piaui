"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Bell } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  const [locFull, setLocFull] = useState('Carregando...');
  const [locShort, setLocShort] = useState('...');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const q = query(
          collection(db, 'chats'),
          where('participantes', 'array-contains', currentUser.uid)
        );

        const unsubscribeChats = onSnapshot(q, (snapshot) => {
          let naoLidas = 0;
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.lido === false && data.ultimoRemetenteId && data.ultimoRemetenteId !== currentUser.uid) {
              naoLidas++;
            }
          });
          setUnreadCount(naoLidas);
        });

        return () => unsubscribeChats();
      } else {
        setUnreadCount(0);
      }
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
              <span className="text-sm font-medium">{locFull}</span>
            </div>
            
            <Link href="/chat" className="relative flex items-center gap-1 text-gray-600 hover:text-primary font-medium transition">
              Chat
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount}
                </span>
              )}
            </Link>

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

          {/* ICONES MOBILE (Sem o chat, apenas a localização e o sino original) */}
          <div className="flex md:hidden items-center gap-3">
             <div className="flex items-center gap-1 text-gray-800 font-bold text-xs bg-gray-100 px-2 py-1.5 rounded-full">
                <MapPin size={14} className="text-accent" />
                <span className="truncate max-w-[100px]">{locShort}</span>
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