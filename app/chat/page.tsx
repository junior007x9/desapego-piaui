'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { app, auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { getMessaging, getToken } from 'firebase/messaging'
import { Send, ArrowLeft, Loader2, MessageCircle, ShoppingBag, ShieldAlert } from 'lucide-react'
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
  const [isSending, setIsSending] = useState(false)
  
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100)
  }

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

  // 🚀 MÁGICA 1: PEDIR PERMISSÃO PARA NOTIFICAÇÕES (PUSH) COM A SUA CHAVE
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user) {
      try {
        const messaging = getMessaging(app);
        
        getToken(messaging, { vapidKey: "BBE4apa4GG0lTsWHJvcHH85tbob3OMDHS5ZNEwLlVG2YIr2Vrj_Bgj0nEN-LxPKiXgvHoIN8Mz0Xax_E9vz7XAY" })
          .then((currentToken) => {
            if (currentToken) {
              updateDoc(doc(db, 'users', user.uid), { 
                fcmToken: currentToken 
              }).catch(console.error);
            }
          }).catch((err) => {
            console.log('Permissão de notificação negada ou erro:', err);
          });
      } catch (error) {
        console.log("Erro ao inicializar o messaging", error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'chats'),
      where('participantes', 'array-contains', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaChats: any[] = []
      snapshot.forEach((doc) => {
        listaChats.push({ id: doc.id, ...doc.data() })
      })
      
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

  useEffect(() => {
    if (!user || !activeChatId) return

    const chatAtual = chats.find(c => c.id === activeChatId)
    if (chatAtual && chatAtual.ultimoRemetenteId !== user.uid && chatAtual.lido === false) {
      updateDoc(doc(db, 'chats', activeChatId), { lido: true }).catch(console.error)
    }

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
      scrollToBottom()
    })

    return () => unsubscribe()
  }, [activeChatId, user, chats])

  const analisarMensagemSuspeita = (texto: string) => {
    const textoMin = texto.toLowerCase();
    
    const contemLink = /http|www\.|\.com|\.br/i.test(textoMin);
    const contemPix = textoMin.includes('pix') || textoMin.includes('chave pix') || textoMin.includes('sinal') || textoMin.includes('cpf');
    const contemContato = textoMin.includes('me chama no zap') || textoMin.includes('whatsapp') || /\d{8,11}/.test(textoMin);

    if (contemLink) {
      return "⚠️ ALERTA DE SEGURANÇA: O Desapego Piauí nunca pede pagamentos por links externos. Não clique em links suspeitos que peçam dados ou senhas.";
    }
    if (contemPix) {
      return "🚨 DICA DE SEGURANÇA: Nunca faça transferências ou PIX antecipado (sinal) para reservar um produto. Só pague no momento da entrega presencial.";
    }
    if (contemContato && !contemPix) {
      return "💡 DICA: Mantenha a negociação dentro do nosso chat para a sua segurança. Evite partilhar dados pessoais com desconhecidos.";
    }

    return null;
  }

  const activeChatDetails = chats.find(c => c.id === activeChatId)

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newMessage.trim() || !user || !activeChatId || isSending) return

    const text = newMessage.trim()
    setNewMessage('') 
    setIsSending(true)
    scrollToBottom()

    try {
      await addDoc(collection(db, `chats/${activeChatId}/mensagens`), {
        texto: text,
        remetenteId: user.uid,
        criadoEm: serverTimestamp()
      })

      const avisoSeguranca = analisarMensagemSuspeita(text);
      if (avisoSeguranca) {
        await addDoc(collection(db, `chats/${activeChatId}/mensagens`), {
          texto: avisoSeguranca,
          remetenteId: 'SISTEMA',
          criadoEm: serverTimestamp()
        })
      }

      await updateDoc(doc(db, 'chats', activeChatId), {
        ultimaMensagem: text,
        ultimoRemetenteId: user.uid,
        lido: false,
        atualizadoEm: serverTimestamp()
      })

      // 🚀 MÁGICA 2: DISPARAR NOTIFICAÇÕES (E-MAIL E PUSH)
      const destinatarioId = activeChatDetails?.participantes.find((id: string) => id !== user.uid);
      
      fetch('/api/notificacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remetenteId: user.uid,
          destinatarioId: destinatarioId,
          mensagem: text,
          tituloAnuncio: activeChatDetails?.anuncioTitulo,
          chatId: activeChatId
        })
      }).catch(err => console.error("Erro ao chamar API de notificação:", err));

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      alert("Falha ao enviar mensagem. Se o erro persistir, verifique as regras do Firebase.")
    } finally {
      setIsSending(false)
    }
  }

  const getOtherParticipantName = (chat: any) => {
    if (!chat || !user) return 'Usuário'
    const otherId = chat.participantes.find((id: string) => id !== user.uid)
    return chat.nomes ? chat.nomes[otherId] : 'Usuário'
  }

  if (loadingChats) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>
  }

  return (
    <div className="bg-gray-50 h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex shadow-sm border-x border-gray-200 bg-white">
        
        {/* BARRA LATERAL */}
        <div className={`w-full md:w-1/3 flex flex-col border-r border-gray-100 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <MessageCircle className="text-primary" /> Minhas Conversas
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-gray-400 mt-10">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50 text-gray-300" />
                <p className="font-medium">Você ainda não tem nenhuma conversa.</p>
              </div>
            ) : (
              chats.map(chat => {
                const isUnread = chat.ultimoRemetenteId && chat.ultimoRemetenteId !== user?.uid && chat.lido === false
                return (
                  <Link 
                    key={chat.id} 
                    href={`/chat?id=${chat.id}`}
                    className={`block p-4 border-b border-gray-50 hover:bg-primary/5 transition cursor-pointer ${activeChatId === chat.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold truncate pr-2 ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                        {getOtherParticipantName(chat)}
                      </h3>
                      {isUnread && <span className="w-3 h-3 bg-red-500 rounded-full shrink-0 mt-1.5 shadow-sm"></span>}
                    </div>
                    <p className="text-xs text-accent font-bold truncate mb-1">{chat.anuncioTitulo}</p>
                    <p className={`text-sm truncate ${isUnread ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>
                      {chat.ultimaMensagem || 'Inicie a conversa!'}
                    </p>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* ÁREA DE MENSAGENS */}
        <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 relative ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={64} className="mb-4 opacity-30 text-primary" />
              <p className="text-lg font-medium">Selecione uma conversa para negociar</p>
            </div>
          ) : (
            <>
              {/* CABEÇALHO */}
              <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <Link href="/chat" className="md:hidden p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full transition">
                    <ArrowLeft size={20} />
                  </Link>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black shrink-0 border border-primary/20">
                     {getOtherParticipantName(activeChatDetails).charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-gray-900 leading-tight">{getOtherParticipantName(activeChatDetails)}</h3>
                    <p className="text-xs text-accent font-bold truncate w-48 sm:w-auto">{activeChatDetails?.anuncioTitulo}</p>
                  </div>
                </div>
                
                {activeChatDetails?.anuncioId && (
                  <Link href={`/anuncio/${activeChatDetails.anuncioId}`} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary bg-gray-100 hover:bg-primary/10 px-4 py-2 rounded-full transition-all">
                    <ShoppingBag size={14} strokeWidth={2.5}/> Ver Anúncio
                  </Link>
                )}
              </div>

              {/* LISTA DE MENSAGENS */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/90 bg-blend-overlay scroll-smooth">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-10 text-sm bg-white py-2 px-4 rounded-full w-fit mx-auto shadow-sm border border-gray-100 font-medium">
                    Mande a primeira mensagem!
                  </div>
                ) : (
                  messages.map((msg) => {
                    if (msg.remetenteId === 'SISTEMA') {
                      return (
                        <div key={msg.id} className="flex justify-center my-4">
                           <div className="max-w-[90%] md:max-w-[70%] bg-orange-50 border border-orange-200 text-orange-800 text-xs md:text-sm px-4 py-3 rounded-2xl shadow-sm text-center font-bold">
                             {msg.texto}
                           </div>
                        </div>
                      )
                    }

                    const isMe = msg.remetenteId === user?.uid
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                          <p className="text-sm md:text-base break-words leading-snug">{msg.texto}</p>
                          <span className={`text-[10px] mt-1.5 block text-right font-medium ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            {msg.criadoEm?.toDate ? msg.criadoEm.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Agora'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* INPUT */}
              <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-gray-200 flex gap-2 items-end">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 max-h-32 min-h-[48px] bg-gray-100 border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl px-4 py-3 resize-none outline-none transition text-sm md:text-base scrollbar-hide"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || isSending}
                  className="bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3.5 md:p-4 rounded-xl transition-all shadow-sm flex-shrink-0"
                >
                  {isSending ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary"><Loader2 className="animate-spin" size={40} /></div>}>
      <ChatConteudo />
    </Suspense>
  )
}