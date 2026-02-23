"use client";

import Link from 'next/link';
import { PlusCircle, User, LogOut, MessageCircle, ShoppingBag, Heart } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [hasUnread, setHasUnread] = useState(false); // NOVO: Estado para a bolinha vermelha
  const router = useRouter();

  useEffect(() => {
    let unsubscribeChats: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // NOVO: Fica a escutar os chats deste utilizador em tempo real
        const q = query(
          collection(db, 'chats'), 
          where('participantes', 'array-contains', currentUser.uid)
        );
        
        unsubscribeChats = onSnapshot(q, (snapshot) => {
          let unread = false;
          snapshot.forEach(doc => {
            const data = doc.data();
            // Se o último a enviar mensagem NÃO foi o utilizador atual, e a mensagem NÃO foi lida
            if (data.ultimoRemetenteId && data.ultimoRemetenteId !== currentUser.uid && data.lido === false) {
              unread = true;
            }
          });
          setHasUnread(unread);
        });
      } else {
        setHasUnread(false);
        if (unsubscribeChats) unsubscribeChats();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-purple-600 tracking-tight">
              Desapego<span className="text-gray-900">PI</span>
            </span>
          </Link>

          <div className="flex items-center space-x-4 sm:space-x-6">
            
            {user ? (
              <>
                <Link href="/chat" className="text-gray-600 hover:text-purple-600 transition-colors flex flex-col items-center relative group">
                  <div className="relative">
                    <MessageCircle className="w-6 h-6" />
                    {/* NOVO: Bolinha Vermelha com animação de pulso */}
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] hidden sm:block mt-1 font-medium group-hover:text-purple-600">Chat</span>
                </Link>

                <Link href="/favoritos" className="text-gray-600 hover:text-red-500 transition-colors flex flex-col items-center">
                  <Heart className="w-6 h-6" />
                  <span className="text-[10px] hidden sm:block mt-1 font-medium">Favoritos</span>
                </Link>

                <Link href="/meus-anuncios" className="text-gray-600 hover:text-purple-600 transition-colors flex flex-col items-center">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-[10px] hidden sm:block mt-1 font-medium">Anúncios</span>
                </Link>

                <Link href="/perfil" className="text-gray-600 hover:text-purple-600 transition-colors flex flex-col items-center">
                  <User className="w-6 h-6" />
                  <span className="text-[10px] hidden sm:block mt-1 font-medium">Perfil</span>
                </Link>

                <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors flex flex-col items-center">
                  <LogOut className="w-6 h-6" />
                  <span className="text-[10px] hidden sm:block mt-1 font-medium">Sair</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-purple-600 transition-colors font-medium text-sm sm:text-base">
                Entrar
              </Link>
            )}

            <Link 
              href={user ? "/anunciar" : "/login"} 
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-semibold flex items-center space-x-2 transition-colors shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Anunciar</span>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
}