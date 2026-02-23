'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { MapPin, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import Link from 'next/link' // Importação adicionada

export default function DetalhesAnuncio() {
  const params = useParams()
  const router = useRouter()
  const [ad, setAd] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loadingChat, setLoadingChat] = useState(false)
  
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser && params.id) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (userDoc.exists()) {
          const favoritos = userDoc.data().favoritos || []
          setIsFavorite(favoritos.includes(params.id as string))
        }
      }
    })

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

        const adData: any = { id: adSnapshot.id, ...adSnapshot.data() };
        setAd(adData);

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

  const toggleFavorite = async () => {
    if (!user) {
      alert("Faça login para salvar seus favoritos!")
      router.push('/login')
      return
    }

    try {
      const userRef = doc(db, 'users', user.uid)
      if (isFavorite) {
        await setDoc(userRef, { favoritos: arrayRemove(ad.id) }, { merge: true })
        setIsFavorite(false)
      } else {
        await setDoc(userRef, { favoritos: arrayUnion(ad.id) }, { merge: true })
        setIsFavorite(true)
      }
    } catch (error) {
      console.error("Erro ao favoritar:", error)
    }
  }

  const handleStartChat = async () => {
    if (!user) {
      alert("Faça login para negociar!")
      router.push(`/login`)
      return
    }

    setLoadingChat(true)
    try {
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

      const meuPerfilDoc = await getDoc(doc(db, 'users', user.uid));
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
          
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative h-[400px] md:h-[500px] bg-black group">
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

              <button 
                onClick={toggleFavorite}
                className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-500"} size={24} />
              </button>
            </div>

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
                <div className="flex flex-col gap-3">
                  {vendedor?.telefone && (
                    <a 
                      href={`https://wa.me/55${vendedor.telefone}?text=Olá! Tenho interesse no anúncio "${ad.titulo}" que vi no DesapegoPI.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      WhatsApp
                    </a>
                  )}

                  <button 
                    onClick={handleStartChat}
                    disabled={loadingChat}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-lg"
                  >
                    <MessageCircle />
                    {loadingChat ? "Abrindo..." : "Chat Interno"}
                  </button>
                </div>
              )}
            </div>

            {/* AQUI ESTÁ O NOVO LINK PARA O PERFIL DO VENDEDOR */}
            <Link href={`/vendedor/${ad.vendedorId}`} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
               <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl shrink-0 group-hover:bg-purple-200 transition-colors">
                 {vendedor?.nome ? vendedor.nome.charAt(0).toUpperCase() : 'U'}
               </div>
               <div className="flex-1">
                 <p className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">{vendedor?.nome || "Usuário"}</p>
                 <p className="text-sm text-gray-500">No DesapegoPI desde 2024</p>
               </div>
               <ChevronRight className="text-gray-300 group-hover:text-purple-600 transition-colors" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}