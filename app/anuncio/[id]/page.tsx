'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, arrayUnion, arrayRemove, updateDoc, increment } from 'firebase/firestore'
import { MapPin, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight, Heart, Eye } from 'lucide-react'
import Link from 'next/link'

export default function DetalhesAnuncio() {
  const params = useParams()
  const router = useRouter()
  const [ad, setAd] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loadingChat, setLoadingChat] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  // Estado para localização dinâmica
  const [locFull, setLocFull] = useState('Carregando...')

  useEffect(() => {
    // Busca a localização pela internet de forma invisível
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
      } catch (error) {
        setLocFull('Teresina, PI');
      }
    }
    fetchLocation();
  }, []);

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

        if (!sessionStorage.getItem(`viewed_${params.id}`)) {
          await updateDoc(adDocRef, { visualizacoes: increment(1) }).catch(console.error);
          sessionStorage.setItem(`viewed_${params.id}`, 'true');
          setAd((prev: any) => ({ ...prev, visualizacoes: (prev.visualizacoes || 0) + 1 }));
        }

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
      const q = query(collection(db, 'chats'), where('participantes', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);
      
      let existingChatId = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.anuncioId === ad.id && data.participantes.includes(ad.vendedorId)) {
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
        nomes: { [user.uid]: meuNome, [ad.vendedorId]: nomeVendedor },
        lido: true,
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

  if (!ad) return <div className="min-h-screen flex items-center justify-center text-primary animate-pulse font-bold text-xl">Carregando detalhes...</div>

  // Os botões de contato (WhatsApp e Chat)
  const ContactButtons = () => (
    user?.uid === ad.vendedorId ? (
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-gray-600 font-bold">
        Este é o seu anúncio
      </div>
    ) : (
      <div className="flex flex-col sm:flex-row gap-3">
        {vendedor?.telefone && (
          <a href={`https://wa.me/55${vendedor.telefone}?text=Olá! Tenho interesse no anúncio "${ad.titulo}" que vi no Desapego Piauí.`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-[15px] md:text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            WhatsApp
          </a>
        )}
        <button onClick={handleStartChat} disabled={loadingChat} className="flex-1 bg-accent hover:bg-accent-dark text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-[15px] md:text-lg">
          <MessageCircle size={22} strokeWidth={2.5} />
          {loadingChat ? "Abrindo..." : "Chat Interno"}
        </button>
      </div>
    )
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10">
      
      {/* Botão Voltar Mobile */}
      <div className="bg-white p-3 shadow-sm md:hidden sticky top-0 z-40 flex justify-between items-center">
        <button onClick={() => router.back()} className="flex items-center text-primary font-bold">
          <ChevronLeft size={24} /> Voltar
        </button>
        <button onClick={toggleFavorite} className="p-2">
          <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"} size={24} />
        </button>
      </div>

      <div className="container mx-auto px-0 md:px-4 pt-0 md:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-8">
          
          {/* FOTOS E DESCRIÇÃO */}
          <div className="lg:col-span-2 space-y-2 md:space-y-4">
            
            {/* CARROSSEL DE FOTOS */}
            <div className="bg-white md:rounded-2xl overflow-hidden shadow-sm md:border border-gray-100 relative h-[350px] sm:h-[400px] md:h-[500px] bg-black group">
              {ad.fotos && ad.fotos.length > 0 ? (
                <>
                  <img src={ad.fotos[currentImageIndex]} className="w-full h-full object-contain" alt={ad.titulo} />
                  {ad.fotos.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImageIndex(prev => prev === 0 ? ad.fotos.length - 1 : prev - 1)} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 md:p-3 rounded-full hover:bg-black/60 transition"><ChevronLeft /></button>
                      <button onClick={() => setCurrentImageIndex(prev => prev === ad.fotos.length - 1 ? 0 : prev + 1)} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 md:p-3 rounded-full hover:bg-black/60 transition"><ChevronRight /></button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold tracking-widest">
                    {currentImageIndex + 1} / {ad.fotos.length}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">Sem fotos</div>
              )}
              {/* Botão de favorito no PC */}
              <button onClick={toggleFavorite} className="hidden md:flex absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-500"} size={24} />
              </button>
            </div>

            {/* INFORMAÇÕES MOBILE (Aparecem embaixo da foto no celular) */}
            <div className="md:hidden bg-white p-5 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full inline-block">
                {ad.categoria}
              </span>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{ad.titulo}</h1>
              <span className="text-3xl font-black text-primary block mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </span>
              <div className="flex items-center gap-4 text-gray-500 text-xs mt-3 pt-3 border-t border-gray-100 font-medium">
                 <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {locFull}</span>
                 <span className="flex items-center gap-1"><Eye size={14} className="text-accent" /> {ad.visualizacoes || 1} visitas</span>
              </div>
            </div>

            {/* DESCRIÇÃO */}
            <div className="bg-white p-5 md:p-8 md:rounded-2xl shadow-sm md:border border-gray-100">
              <h2 className="text-lg md:text-xl font-black text-gray-800 mb-4 border-b pb-3">Descrição</h2>
              <p className="whitespace-pre-wrap text-gray-600 text-sm md:text-base leading-relaxed">{ad.descricao}</p>
              
              <div className="mt-8 bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-sm text-orange-800">
                <AlertTriangle className="shrink-0 text-orange-500" size={20} />
                <p><strong>Dica de Segurança:</strong> Nunca faça pagamentos antecipados sem ver o produto pessoalmente.</p>
              </div>
            </div>
          </div>

          {/* COLUNA LATERAL (PC) */}
          <div className="space-y-4 md:space-y-6 px-0 md:px-0">
            
            {/* CARD DE PREÇO (Escondido no mobile, pois já mostramos lá em cima) */}
            <div className="hidden md:block bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full mb-4 inline-block">
                {ad.categoria}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{ad.titulo}</h1>
              <div className="text-4xl font-black text-primary mb-6">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </div>
              
              <div className="flex items-center justify-between text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100 font-medium">
                 <span className="flex items-center gap-1"><MapPin size={16} className="text-accent" /> {locFull}</span>
                 <span className="flex items-center gap-1"><Eye size={16} className="text-accent" /> {ad.visualizacoes || 1} visitas</span>
              </div>

              {/* Botões no PC */}
              <ContactButtons />
            </div>

            {/* CARD DO VENDEDOR */}
            <div className="bg-white md:rounded-2xl shadow-sm border-t md:border border-gray-100 p-0 md:p-0 overflow-hidden">
               <Link href={`/vendedor/${ad.vendedorId}`} className="p-5 md:p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xl shrink-0 group-hover:bg-primary/20 transition-colors">
                    {vendedor?.nome ? vendedor.nome.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base md:text-lg group-hover:text-primary transition-colors">{vendedor?.nome || "Usuário"}</p>
                    <p className="text-xs md:text-sm text-gray-500 font-medium">No Desapego Piauí desde 2024</p>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
               </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES FIXOS NA BASE PARA MOBILE */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-50">
         <ContactButtons />
      </div>

    </div>
  )
}