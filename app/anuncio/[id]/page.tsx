'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc, arrayUnion, arrayRemove, updateDoc, increment } from 'firebase/firestore'
import { MapPin, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight, Heart, Eye, Ban, Flag, X, Loader2 } from 'lucide-react'
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

  // Estados da Denúncia
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportMotivo, setReportMotivo] = useState('')
  const [isReporting, setIsReporting] = useState(false)

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

        const agora = new Date();
        if (adData.expiraEm) {
          const dataExpiracao = new Date(adData.expiraEm);
          if (dataExpiracao < agora && adData.status === 'ativo') {
             await updateDoc(adDocRef, { status: 'expirado' });
             adData.status = 'expirado';
          }
        }

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
      alert("Faça login no site para iniciar uma negociação de forma segura!")
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

  // PROTEÇÃO ANTI-SCRAPING: Tranca o WhatsApp para visitantes anônimos
  const handleWhatsAppClick = () => {
    if (!user) {
      alert("🔒 Segurança: Para ver o número do vendedor e evitar fraudes, você precisa fazer login no site.");
      router.push('/login');
      return;
    }

    if (vendedor?.telefone) {
      window.open(`https://wa.me/55${vendedor.telefone}?text=Olá! Tenho interesse no anúncio "${ad.titulo}" que vi no Desapego Piauí.`, '_blank');
    } else {
      alert("Este vendedor ainda não cadastrou um número de WhatsApp. Por favor, utilize o Chat Interno!");
    }
  }

  // SISTEMA DE DENÚNCIAS
  const handleReportarAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Faça login para denunciar um anúncio.");
      router.push('/login');
      return;
    }
    if (!reportMotivo) return;

    setIsReporting(true);
    try {
      await addDoc(collection(db, 'denuncias'), {
        anuncioId: ad.id,
        anuncioTitulo: ad.titulo,
        vendedorId: ad.vendedorId,
        denuncianteId: user.uid,
        motivo: reportMotivo,
        status: 'pendente', // pendente, analisado, resolvido
        criadoEm: serverTimestamp()
      });

      alert("Denúncia enviada com sucesso! A nossa equipa de moderação vai analisar este anúncio.");
      setIsReportModalOpen(false);
      setReportMotivo('');
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      alert("Ocorreu um erro. Tente novamente mais tarde.");
    } finally {
      setIsReporting(false);
    }
  }

  if (!ad) return <div className="min-h-screen flex items-center justify-center text-primary animate-pulse font-bold text-xl">Carregando detalhes...</div>

  const ContactButtons = () => {
    if (user?.uid === ad.vendedorId) {
       if (ad.status === 'expirado') {
         return (
           <Link href={`/pagamento/${ad.id}`} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-lg">
              Renovar Plano do Anúncio
           </Link>
         );
       }
       return (
         <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-gray-600 font-bold">
           Este é o seu anúncio
         </div>
       );
    }

    if (ad.status !== 'ativo') {
       return (
         <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-center gap-2 text-red-600 font-bold">
           <Ban size={20} />
           {ad.status === 'expirado' ? 'Este anúncio expirou.' : 'Anúncio indisponível no momento.'}
         </div>
       );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={handleWhatsAppClick} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-[15px] md:text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          WhatsApp
        </button>
        
        <button onClick={handleStartChat} disabled={loadingChat} className="flex-1 bg-accent hover:bg-accent-dark text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-[15px] md:text-lg">
          <MessageCircle size={22} strokeWidth={2.5} />
          {loadingChat ? "Abrindo..." : "Chat Interno"}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      
      {/* MODAL DE DENÚNCIA */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-red-100 text-red-600 p-3 rounded-full"><Flag size={24}/></div>
               <h2 className="text-xl font-black text-gray-900">Denunciar Anúncio</h2>
            </div>
            <form onSubmit={handleReportarAnuncio} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Qual é o problema com este anúncio?</label>
                <select required value={reportMotivo} onChange={(e) => setReportMotivo(e.target.value)} className="w-full p-4 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition">
                  <option value="">Selecione um motivo...</option>
                  <option value="Suspeita de Fraude / Golpe">Suspeita de Fraude / Golpe</option>
                  <option value="Produto Falsificado / Ilegal">Produto Falsificado / Ilegal</option>
                  <option value="Conteúdo Ofensivo ou Impróprio">Conteúdo Ofensivo ou Impróprio</option>
                  <option value="Preço Irreal (Falso)">Preço Irreal (Falso)</option>
                  <option value="Outro Motivo">Outro Motivo</option>
                </select>
              </div>
              <button type="submit" disabled={isReporting || !reportMotivo} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-4">
                {isReporting ? <Loader2 className="animate-spin" /> : 'Enviar Denúncia Segura'}
              </button>
            </form>
          </div>
        </div>
      )}

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
          
          <div className="lg:col-span-2 space-y-2 md:space-y-4">
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
              <button onClick={toggleFavorite} className="hidden md:flex absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-500"} size={24} />
              </button>
            </div>

            <div className="md:hidden bg-white p-5 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full inline-block">
                {ad.categoria}
              </span>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{ad.titulo}</h1>
              <span className="text-3xl font-black text-primary block mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </span>
              <div className="flex items-center justify-between text-gray-500 text-xs mt-3 font-medium">
                 <div className="flex gap-4">
                   {/* CORRIGIDO AQUI (MOBILE): Mostrando a cidade do Anúncio */}
                   <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {ad.cidade || ad.localizacao || 'Piauí'}</span>
                   <span className="flex items-center gap-1"><Eye size={14} className="text-accent" /> {ad.visualizacoes || 1} visitas</span>
                 </div>
                 <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1 text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition-colors font-bold">
                    <Flag size={12}/> Denunciar
                 </button>
              </div>
              
              <div className="pt-4 border-t border-gray-100 mt-4">
                 <ContactButtons />
              </div>
            </div>

            <div className="bg-white p-5 md:p-8 md:rounded-2xl shadow-sm md:border border-gray-100">
              <h2 className="text-lg md:text-xl font-black text-gray-800 mb-4 border-b pb-3">Descrição</h2>
              <p className="whitespace-pre-wrap text-gray-600 text-sm md:text-base leading-relaxed">{ad.descricao}</p>
              
              <div className="mt-8 bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-sm text-orange-800">
                <AlertTriangle className="shrink-0 text-orange-500" size={20} />
                <p><strong>Dica de Segurança:</strong> Nunca faça pagamentos antecipados sem ver o produto pessoalmente.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6 px-0 md:px-0">
            <div className="hidden md:block bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full mb-4 inline-block">
                {ad.categoria}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{ad.titulo}</h1>
              <div className="text-4xl font-black text-primary mb-6">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </div>
              
              <div className="flex items-center justify-between text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100 font-medium">
                 <div className="flex gap-4">
                   {/* CORRIGIDO AQUI (DESKTOP): Mostrando a cidade do Anúncio */}
                   <span className="flex items-center gap-1"><MapPin size={16} className="text-accent" /> {ad.cidade || ad.localizacao || 'Piauí'}</span>
                   <span className="flex items-center gap-1"><Eye size={16} className="text-accent" /> {ad.visualizacoes || 1} visitas</span>
                 </div>
                 <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-bold bg-red-50 px-3 py-1.5 rounded-lg">
                    <Flag size={14}/> Denunciar
                 </button>
              </div>

              <ContactButtons />
            </div>

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
    </div>
  )
}