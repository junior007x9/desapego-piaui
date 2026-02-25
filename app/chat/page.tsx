'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { Send, ArrowLeft, Loader2, MessageCircle, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

function ChatConteudo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeChatId = searchParams.get('id')

  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [chats, setChats] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingChats, setLoadingChats] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Verificar Login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
      }
    })
    return () => unsubscribe()
  }, [router])

  // 2. Carregar Lista de Chats (Em tempo real com ordenação local)
  useEffect(() => {
    if (!user) return

    // CORREÇÃO: Removemos o orderBy para evitar o Erro de Index do Firebase.
    const q = query(
      collection(db, 'chats'),
      where('participantes', 'array-contains', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaChats: any[] = []
      snapshot.forEach((doc) => {
        listaChats.push({ id: doc.id, ...doc.data() })
      })
      
      // Ordenamos os chats aqui no navegador (do mais recente para o mais antigo)
      listaChats.sort((a, b) => {
        const timeA = a.atualizadoEm?.seconds || 0;
        const timeB = b.atualizadoEm?.seconds || 0;
        return timeB - timeA;
      });

      setChats(listaChats)
      setLoadingChats(false)
    })

    return () => unsubscribe()
  }, [user])

  // 3. Carregar Mensagens do Chat Ativo & Marcar como Lido
  useEffect(() => {
    if (!user || !activeChatId) return

    // Marcar como lido ao abrir o chat
    const chatAtual = chats.find(c => c.id === activeChatId)
    if (chatAtual && chatAtual.ultimoRemetenteId !== user.uid && chatAtual.lido === false) {
      updateDoc(doc(db, 'chats', activeChatId), { lido: true }).catch(console.error)
    }

    // Aqui podemos usar orderBy normalmente pois não há um "where" antes
    const q = query(
      collection(db, `chats/${activeChatId}/mensagens`),
      orderBy('criadoEm', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaMensagens: any[] = []
      snapshot.forEach((doc) => {
        listaMensagens.push({ id: doc.id, ...doc.data() })
      })
      setMessages(listaMensagens)
      
      // Fazer scroll para o fim quando chegam novas mensagens
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    })

    return () => unsubscribe()
  }, [activeChatId, user, chats])

  // 4. Enviar nova mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !activeChatId) return

    const text = newMessage.trim()
    setNewMessage('') // Limpa o input imediatamente

    try {
      // Adiciona a mensagem na subcoleção
      await addDoc(collection(db, `chats/${activeChatId}/mensagens`), {
        texto: text,
        remetenteId: user.uid,
        criadoEm: serverTimestamp()
      })

      // Atualiza o documento principal do chat (Gatilho da Bolinha Vermelha!)
      await updateDoc(doc(db, 'chats', activeChatId), {
        ultimaMensagem: text,
        ultimoRemetenteId: user.uid,
        lido: false,
        atualizadoEm: serverTimestamp()
      })
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      alert("Erro ao enviar. Tente novamente.")
    }
  }

  // Obter detalhes do chat ativo para o cabeçalho
  const activeChatDetails = chats.find(c => c.id === activeChatId)
  
  // Encontrar o nome do outro participante
  const getOtherParticipantName = (chat: any) => {
    if (!chat || !user) return 'Usuário'
    const otherId = chat.participantes.find((id: string) => id !== user.uid)
    return chat.nomes ? chat.nomes[otherId] : 'Usuário'
  }

  if (loadingChats) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-purple-600" size={40} /></div>
  }

  return (
    <div className="bg-gray-50 h-[calc(100vh-64px)] overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex shadow-sm border-x border-gray-200 bg-white">
        
        {/* --- BARRA LATERAL (LISTA DE CHATS) --- */}
        <div className={`w-full md:w-1/3 flex flex-col border-r border-gray-100 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="text-purple-600" /> Minhas Conversas
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Você ainda não tem nenhuma conversa.</p>
              </div>
            ) : (
              chats.map(chat => {
                const isUnread = chat.ultimoRemetenteId && chat.ultimoRemetenteId !== user?.uid && chat.lido === false
                return (
                  <Link 
                    key={chat.id} 
                    href={`/chat?id=${chat.id}`}
                    className={`block p-4 border-b border-gray-50 hover:bg-purple-50 transition cursor-pointer ${activeChatId === chat.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold truncate pr-2 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {getOtherParticipantName(chat)}
                      </h3>
                      {isUnread && <span className="w-3 h-3 bg-red-500 rounded-full shrink-0 mt-1.5"></span>}
                    </div>
                    <p className="text-xs text-purple-600 font-medium truncate mb-1">{chat.anuncioTitulo}</p>
                    <p className={`text-sm truncate ${isUnread ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                      {chat.ultimaMensagem || 'Inicie a conversa!'}
                    </p>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* --- ÁREA DE MENSAGENS (DIREITA) --- */}
        <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={64} className="mb-4 opacity-50" />
              <p className="text-lg">Selecione uma conversa para começar a negociar</p>
            </div>
          ) : (
            <>
              {/* CABEÇALHO DO CHAT */}
              <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <Link href="/chat" className="md:hidden p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition">
                    <ArrowLeft size={20} />
                  </Link>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">
                     {getOtherParticipantName(activeChatDetails).charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-gray-900 leading-tight">{getOtherParticipantName(activeChatDetails)}</h3>
                    <p className="text-xs text-purple-600 font-medium truncate w-48 sm:w-auto">{activeChatDetails?.anuncioTitulo}</p>
                  </div>
                </div>
                
                {activeChatDetails?.anuncioId && (
                  <Link href={`/anuncio/${activeChatDetails.anuncioId}`} className="hidden sm:flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 px-3 py-1.5 rounded-full transition">
                    <ShoppingBag size={14}/> Ver Anúncio
                  </Link>
                )}
              </div>

              {/* LISTA DE MENSAGENS */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/90 bg-blend-overlay">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10 text-sm bg-white py-2 px-4 rounded-full w-fit mx-auto shadow-sm border border-gray-100">
                    Mande a primeira mensagem!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.remetenteId === user?.uid
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                          <p className="text-sm md:text-base break-words">{msg.texto}</p>
                          <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-purple-200' : 'text-gray-400'}`}>
                            {msg.criadoEm?.toDate ? msg.criadoEm.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Agora'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT DE MENSAGEM */}
              <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex gap-2 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 max-h-32 min-h-[44px] bg-gray-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl px-4 py-3 resize-none outline-none transition text-sm md:text-base scrollbar-hide"
                  rows={1}
                  onKeyDown={(e) => {
                    // Envia com Enter (sem shift) no computador
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 md:p-4 rounded-xl transition shadow-sm flex-shrink-0"
                >
                  <Send size={20} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

// O Suspense é obrigatório no Next.js quando usamos useSearchParams na build
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-purple-600"><Loader2 className="animate-spin" size={40} /></div>}>
      <ChatConteudo />
    </Suspense>
  )
}