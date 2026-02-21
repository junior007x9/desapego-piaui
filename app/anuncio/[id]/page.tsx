'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { MapPin, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

export default function DetalhesAnuncio() {
  const params = useParams()
  const router = useRouter()
  const [ad, setAd] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loadingChat, setLoadingChat] = useState(false)

  useEffect(() => {
    // 1. Escuta o usuário logado
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    // 2. Busca o anúncio e o vendedor
    async function getData() {
      if (!params.id) return;
      
      try {
        const adDocRef = doc(db, 'anuncios', params.id as string);
        const adSnapshot = await getDoc(adDocRef);

        if (!adSnapshot.exists()) {
          alert('Anúncio não encontrado ou removido.')
          router.push('/')
          return;
        }

        // CORREÇÃO: Usamos o ': any' para o TypeScript não bloquear a compilação no Vercel
        const adData: any = { id: adSnapshot.id, ...adSnapshot.data() };
        setAd(adData);

        // Busca os dados do vendedor na coleção 'users'
        if (adData.vendedorId) {
          const vendedorDoc = await getDoc(doc(db, 'users', adData.vendedorId));
          if (vendedorDoc.exists()) {
            setVendedor(vendedorDoc.data());
          }
        }
      } catch (error) {
        console.error("Erro ao buscar anúncio:", error);
      }
    }
    
    getData()
    return () => unsubscribe()
  }, [params.id, router])

  // --- FUNÇÃO PARA INICIAR CHAT NO FIREBASE ---
  const handleStartChat = async () => {
    if (!user) {
      alert("Faça login para negociar!")
      router.push(`/login`)
      return
    }

    setLoadingChat(true)
    try {
      // 1. Verifica se o chat já existe para este anúncio e estes 2 usuários
      const q = query(
        collection(db, 'chats'), 
        where('anuncioId', '==', ad.id),
        where('participantes', 'array-contains', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      let existingChatId = null;
      querySnapshot.forEach((doc) => {
        if (doc.data().participantes.includes(ad.vendedorId)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        router.push(`/chat?id=${existingChatId}`)
        return
      }

      // 2. Se não existe, busca o nome do usuário logado e cria um novo Chat
      const meuPerfilDoc = await getDoc(doc(db, 'users', user.uid));
      
      // CORREÇÃO: Usamos o 'as any' para ler o 'nome' sem erros no Build
      const meuNome = meuPerfilDoc.exists() ? (meuPerfilDoc.data() as any).nome : 'Comprador';
      const nomeVendedor = vendedor?.nome || 'Vendedor';

      const novoChatRef = await addDoc(collection(db, 'chats'), {
        anuncioId: ad.id,
        anuncioTitulo: ad.titulo,
        anuncioImagemUrl: ad.imagemUrl || '',
        participantes: [user.uid, ad.vendedorId],
        nomes: {
          [user.uid]: meuNome,
          [ad.vendedorId]: nomeVendedor
        },
        atualizadoEm: serverTimestamp()
      });

      router.push(`/chat?id=${novoChatRef.id}`)

    } catch (error: any) {
      console.error(error)
      alert("Erro ao abrir chat.")
    } finally {
      setLoadingChat(false)
    }
  }

  if (!ad) return <div className="p-10 text-center text-purple-600 animate-pulse font-bold">Carregando detalhes...</div>

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="bg-white p-4 shadow-sm md:hidden mb-4">
        <button onClick={() => router.back()} className="flex items-center text-gray-600 font-medium">
          <ChevronLeft /> Voltar
        </button>
      </div>

      <div className="container mx-auto px-4 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- GALERIA DE FOTOS --- */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative h-[400px] md:h-[500px] bg-black">
              {ad.fotos && ad.fotos.length > 0 ? (
                <>
                  <img 
                    src={ad.fotos[currentImageIndex]} 
                    className="w-full h-full object-contain" 
                    alt={ad.titulo} 
                  />
                  {ad.fotos.length > 1 && (
                    <>
                      <button 
                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? ad.fotos.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/40 transition"
                      >
                        <ChevronLeft />
                      </button>
                      <button 
                         onClick={() => setCurrentImageIndex(prev => prev === ad.fotos.length - 1 ? 0 : prev + 1)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/40 transition"
                      >
                        <ChevronRight />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-medium">
                    {currentImageIndex + 1} / {ad.fotos.length}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Sem fotos</div>
              )}
            </div>

            {/* Descrição */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-4">Descrição</h2>
              <p className="whitespace-pre-wrap text-gray-600 leading-relaxed">
                {ad.descricao}
              </p>
              
              <div className="mt-8 bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex gap-3 text-sm text-yellow-800">
                <AlertTriangle className="shrink-0 text-yellow-500" />
                <p>
                  <strong>Dica de Segurança:</strong> Nunca faça pagamentos antecipados sem ver o produto pessoalmente.
                </p>
              </div>
            </div>
          </div>

          {/* --- INFORMAÇÕES (DIREITA) --- */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-4 inline-block">
                {ad.categoria}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{ad.titulo}</h1>
              <div className="flex justify-between items-end mb-6">
                <span className="text-4xl font-extrabold text-purple-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-8 pb-6 border-b border-gray-100">
                 <MapPin size={18} className="text-purple-400" />
                 <span>Teresina, Piauí</span>
              </div>

              {user?.uid === ad.vendedorId ? (
                 <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-gray-600 font-bold">
                    Este é o seu anúncio
                 </div>
              ) : (
                <button 
                  onClick={handleStartChat}
                  disabled={loadingChat}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-lg"
                >
                  <MessageCircle />
                  {loadingChat ? "Abrindo..." : "Chamar no Chat"}
                </button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
               <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl shrink-0">
                 {vendedor?.nome ? vendedor.nome.charAt(0).toUpperCase() : 'U'}
               </div>
               <div>
                 <p className="font-bold text-gray-900 text-lg">{vendedor?.nome || "Usuário"}</p>
                 <p className="text-sm text-gray-500">No DesapegoPI desde 2024</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}