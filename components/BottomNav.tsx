'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let unsubscribeChats: () => void; // Variável para guardar a função que limpa a busca de chats

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Se o utilizador está logado, procuramos mensagens não lidas
        const q = query(
          collection(db, 'chats'), 
          where('participantes', 'array-contains', currentUser.uid)
        );
        
        unsubscribeChats = onSnapshot(q, (snapshot) => {
          let unread = false;
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.ultimoRemetenteId !== currentUser.uid && data.lido === false) unread = true;
          });
          setHasUnread(unread);
        });
      } else {
        // Se o utilizador saiu da conta, paramos de buscar as mensagens e zeramos a notificação
        if (unsubscribeChats) unsubscribeChats();
        setHasUnread(false);
      }
    });

    // Função de limpeza quando o componente é destruído
    return () => {
      unsubscribeAuth();
      if (unsubscribeChats) unsubscribeChats();
    };
  }, []);

  const navItems = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Explorar', icon: Search, href: '/todos-anuncios' },
    { label: 'Anunciar', icon: PlusCircle, href: user ? '/anunciar' : '/login', special: true },
    { label: 'Chat', icon: MessageCircle, href: '/chat', badge: hasUnread },
    { label: 'Menu', icon: User, href: '/perfil' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-safe z-50">
      <div className="flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center flex-1 relative">
              <div className={`p-1 rounded-full transition-colors ${item.special ? 'text-purple-600' : ''}`}>
                <item.icon size={24} className={isActive && !item.special ? 'text-purple-600' : 'text-gray-500'} />
                {item.badge && (
                  <span className="absolute top-2 right-1/2 translate-x-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}