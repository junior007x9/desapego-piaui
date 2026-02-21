'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { Send, ShoppingBag, ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'

// Definição das interfaces para o TypeScript
interface Chat {
  id: string;
  anuncioId: string;
  anuncioTitulo: string;
  anuncioImagemUrl: string;
  participantes: string[]; // Array com os IDs do comprador e vendedor
  nomes: Record<string, string>; // Dicionário com os nomes dos participantes
  atualizadoEm: any;
}

interface Mensagem {
  id: string;
  remetenteId: string;
  texto: string;
  criadoEm: any;
}

function ChatContent() {
  const searchParams = useSearchParams()
  const initialChatId = searchParams.get('id')
  
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId)
  const [messages, setMessages] = useState<Mensagem[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Carregar Usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // 2. Carregar Lista de Chats em Tempo Real
  useEffect(() => {
    if (!user) return;

    // Busca os chats onde o usuário logado está na lista de "participantes"
    const q = query(
      collection(db, 'chats'),
      where('participantes', 'array-contains', user.uid),
      orderBy('atualizadoEm', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaChats: Chat[] = [];
      snapshot.forEach((doc) => {
        listaChats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setChats(listaChats);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Carregar Mensagens do Chat Selecionado em Tempo Real
  useEffect(() => {
    if (!activeChatId) return;

    const q = query(
      collection(db, 'chats', activeChatId, 'mensagens'),
      orderBy('criadoEm', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaMensagens: Mensagem[] = [];
      snapshot.forEach((doc) => {
        listaMensagens.push({ id: doc.id, ...doc.data() } as Mensagem);
      });
      setMessages(listaMensagens);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  // 4. Enviar Mensagem
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !activeChatId) return

    const texto = newMessage
    setNewMessage('') 

    try {
      // Adiciona a mensagem na subcoleção 'mensagens' do chat atual
      await addDoc(collection(db, 'chats', activeChatId, 'mensagens'), {
        remetenteId: user.uid,
        texto: texto,
        criadoEm: serverTimestamp()
      });

      // Atualiza a data de última modificação do chat (para ele subir na lista)
      await updateDoc(doc(db, 'chats', activeChatId), {
        atualizadoEm: serverTimestamp()
      });

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  }

  // Descobre o nome da outra pessoa da conversa
  const getOtherUserName = (chat: Chat) => {
    if (!user || !chat.nomes) return 'Usuário';
    const outroId = chat.participantes.find(id => id !== user.uid);
    return outroId ? chat.nomes[outroId] || 'Usuário' : 'Usuário';
  }

  // Formata a hora das mensagens de forma segura (lidando com delay do serverTimestamp)
  const formatarHora = (timestamp: any) => {
    if (!timestamp) return 'Agora'; // Enquanto a data oficial do servidor não retorna
    return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)] p-4">
      <div className="container mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[80vh] flex flex-col md:flex-row">
        
        {/* LISTA DE CHATS */}
        <div className={`w-full md:w-1/3 border-r border-gray-100 bg-gray-50 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="font-bold text-xl text-purple-600">Suas Conversas</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="p-8 text-center text-gray-500">Nenhuma negociação ainda.</p>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-white transition flex gap-3 ${activeChatId === chat.id ? 'bg-white border-l-4 border-l-purple-500' : ''}`}
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                    {chat.anuncioImagemUrl ? (
                      <img src={chat.anuncioImagemUrl} alt="Produto" className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="m-3 text-gray-400" />
                    )}
                  </div>
                  <div className="overflow-hidden flex flex-col justify-center">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{getOtherUserName(chat)}</h3>
                    <p className="text-xs text-gray-500 truncate">{chat.anuncioTitulo}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ÁREA DE MENSAGENS */}
        <div className={`w-full md:w-2/3 flex flex-col bg-white ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {activeChatId ? (
            <>
              {/* Cabeçalho da Conversa */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white">
                <button onClick={() => setActiveChatId(null)} className="md:hidden text-gray-600 p-2 hover:bg-gray-100 rounded-full transition">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                   <h3 className="font-bold text-gray-800">
                     {getOtherUserName(chats.find(c => c.id === activeChatId)!)}
                   </h3>
                </div>
                <Link 
                  href={`/anuncio/${chats.find(c => c.id === activeChatId)?.anuncioId}`} 
                  className="text-sm text-purple-600 font-medium hover:underline bg-purple-50 px-3 py-1 rounded-full"
                >
                  Ver Anúncio
                </Link>
              </div>

              {/* Balões de Mensagem */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/50">
                {messages.map((msg) => {
                  const isMe = msg.remetenteId === user?.uid
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                        isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}>
                        <p className="text-sm">{msg.texto}</p>
                        <span className={`text-[10px] block text-right mt-1 ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                          {formatarHora(msg.criadoEm)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Campo de Digitação */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white flex gap-2 items-center">
                <input 
                  type="text" 
                  className="flex-1 border border-gray-200 bg-gray-50 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  placeholder="Escreva sua mensagem..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white p-3 rounded-full transition shadow-sm"
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <MessageCircle size={64} className="mb-4 opacity-20 text-purple-600" />
              <p className="text-gray-500 font-medium">Selecione uma conversa para começar</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// O Componente Principal com SUSPENSE
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-purple-600 font-bold animate-pulse">Carregando Chat...</div>}>
      <ChatContent />
    </Suspense>
  )
}