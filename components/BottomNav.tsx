'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let unsubscribeChats: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, 'chats'), where('participantes', 'array-contains', currentUser.uid));
        unsubscribeChats = onSnapshot(q, (snapshot) => {
          let unread = false;
          snapshot.forEach(doc => {
            if (doc.data().ultimoRemetenteId !== currentUser.uid && doc.data().lido === false) unread = true;
          });
          setHasUnread(unread);
        });
      } else {
        if (unsubscribeChats) unsubscribeChats();
        setHasUnread(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, []);

  const navItems = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Buscar', icon: Search, href: '/todos-anuncios' },
    { label: 'Anunciar', icon: Plus, href: user ? '/anunciar' : '/login', special: true },
    { label: 'Chat', icon: MessageCircle, href: '/chat', badge: hasUnread },
    { label: 'Conta', icon: User, href: '/perfil' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] h-16">
      <div className="flex justify-between items-center h-full relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          // ESTILO DO BOTÃO CENTRAL ANUNCIAR (Estilo App)
          if (item.special) {
            return (
              <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center flex-1 relative -top-4">
                <div className="bg-accent shadow-lg shadow-accent/40 rounded-full p-3 text-white flex items-center justify-center transform active:scale-95 transition-transform">
                  <item.icon size={28} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] mt-1 text-gray-500 font-semibold">{item.label}</span>
              </Link>
            )
          }

          // ITENS NORMAIS
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center flex-1 relative h-full">
              <div className="relative">
                <item.icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-primary' : 'text-gray-400'} 
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'text-primary font-bold' : 'text-gray-400 font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}