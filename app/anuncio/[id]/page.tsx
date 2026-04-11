'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc, increment } from 'firebase/firestore'
import { MapPin, MessageCircle, AlertTriangle, ChevronLeft, ChevronRight, Heart, Eye, Flag, X, Maximize2, Share2 } from 'lucide-react'
import Link from 'next/link'

export default function DetalhesAnuncio() {
  const params = useParams()
  const router = useRouter()
  const [ad, setAd] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false) // Controla a tela cheia
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

        if (adData.vendedorId) {
          const vendedorDoc = await getDoc(doc(db, 'users', adData.vendedorId));
          if (vendedorDoc.exists()) {
            setVendedor(vendedorDoc.data());
          }
        }

        setAd(adData);

        if (!sessionStorage.getItem(`viewed_${params.id}`)) {
          await updateDoc(adDocRef, { visualizacoes: increment(1) }).catch(console.error);
          sessionStorage.setItem(`viewed_${params.id}`, 'true');
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
    } catch (error) { console.error(error) }
  }

  const handleWhatsAppClick = () => {
    if (!user) {
      alert("🔒 Segurança: Para ver o número do vendedor e evitar fraudes, faça login na sua conta.");
      router.push('/login');
      return;
    }
    if (vendedor?.telefone) {
      window.open(`https://wa.me/55${vendedor.telefone}?text=Olá! Tenho interesse no anúncio "${ad.titulo}" que vi no Desapego Piauí.`, '_blank');
    } else {
      alert("Este vendedor ainda não cadastrou um número de WhatsApp.");
    }
  }

  // 🚀 FUNÇÃO MÁGICA DE COMPARTILHAMENTO NATIVO
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ad.titulo} - Desapego Piauí`,
          text: `Olha o que encontrei no Desapego Piauí: ${ad.titulo} por apenas R$ ${ad.preco}`,
          url: window.location.href, // Pega o link exato da página
        });
      } catch (error) {
        console.log('Compartilhamento cancelado', error);
      }
    } else {
      // Fallback para quem está no computador ou navegador antigo
      navigator.clipboard.writeText(window.location.href);
      alert("Link do anúncio copiado! Cole no WhatsApp ou Instagram para enviar aos amigos.");
    }
  };

  // Funções das Setinhas
  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === ad.fotos.length - 1 ? 0 : prev + 1)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? ad.fotos.length - 1 : prev - 1)
  }

  if (!ad) return <div className="min-h-screen flex items-center justify-center text-primary animate-pulse font-bold text-xl">Carregando detalhes...</div>

  const ContactButtons = () => {
    if (user?.uid === ad.vendedorId) {
       return <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-gray-600 font-bold text-sm uppercase tracking-widest">Este é o seu anúncio</div>
    }

    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={handleWhatsAppClick} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-[15px] md:text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          WhatsApp
        </button>
        <button onClick={() => router.push(`/chat?id=new&ad=${ad.id}`)} className="flex-1 bg-accent hover:bg-accent-dark text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-[15px] md:text-lg">
          <MessageCircle size={22} strokeWidth={2.5} /> Chat Interno
        </button>
      </div>
    );
  };

  const anoRegistro = vendedor?.criadoEm?.toDate ? vendedor.criadoEm.toDate().getFullYear() : '2024';

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      
      {/* 🔍 TELA CHEIA (LIGHTBOX) - TOTALMENTE CORRIGIDA E LIMPA */}
      {isZoomOpen && (
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col">
          
          {/* Barra Superior do Zoom */}
          <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50">
            <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {ad.fotos.length}
            </span>
            <button onClick={() => setIsZoomOpen(false)} className="text-white bg-black/60 p-3 rounded-full hover:bg-black/80 transition">
              <X size={24} />
            </button>
          </div>

          {/* Área da Imagem - Permite Zoom de Pinça (overflow-auto) */}
          <div className="flex-1 w-full h-full flex items-center justify-center overflow-auto p-2">
             <img 
               src={ad.fotos[currentImageIndex]} 
               className="max-w-full max-h-full object-contain"
               alt="Zoom do produto"
             />
          </div>

          {/* Setas do Zoom (Sempre visíveis se houver >1 foto) */}
          {ad.fotos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 md:p-4 rounded-full z-50 hover:bg-black/80">
                <ChevronLeft size={32}/>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 md:p-4 rounded-full z-50 hover:bg-black/80">
                <ChevronRight size={32}/>
              </button>
            </>
          )}
        </div>
      )}

      {/* CABEÇALHO MOBILE (Fixo e Limpo) */}
      <div className="md:hidden sticky top-0 w-full z-40 bg-white border-b border-gray-100 p-3 flex justify-between items-center shadow-sm">
        <button onClick={() => router.back()} className="flex items-center gap-1 bg-gray-100 p-2 pr-4 rounded-full text-primary font-bold text-sm">
          <ChevronLeft size={20} /> Voltar
        </button>
        <div className="flex gap-2">
          {/* 🚀 BOTÃO DE COMPARTILHAR MOBILE */}
          <button onClick={handleShare} className="p-2.5 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition"><Share2 size={20} /></button>
          <button onClick={toggleFavorite} className="p-2.5 bg-gray-100 rounded-full">
            <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"} size={20} />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-0 md:px-4 pt-0 md:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-8">
          
          <div className="lg:col-span-2 space-y-0 md:space-y-4">
            
            {/* 📸 GALERIA PRINCIPAL DO ANÚNCIO */}
            <div className="bg-black md:rounded-3xl relative h-[350px] sm:h-[450px] md:h-[550px] flex items-center justify-center">
              {ad.fotos && ad.fotos.length > 0 ? (
                <>
                  <img 
                    src={ad.fotos[currentImageIndex]} 
                    className="w-full h-full object-contain cursor-zoom-in" 
                    alt={ad.titulo}
                    onClick={() => setIsZoomOpen(true)}
                  />
                  
                  {/* Botão de Maximizar Canto Inferior */}
                  <button 
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute bottom-4 right-4 bg-black/60 text-white p-3 rounded-full flex items-center justify-center hover:bg-black/80 transition"
                  >
                    <Maximize2 size={20} />
                  </button>

                  {/* Contador Base */}
                  {ad.fotos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest">
                      {currentImageIndex + 1} / {ad.fotos.length}
                    </div>
                  )}

                  {/* Setas da Galeria Padrão */}
                  {ad.fotos.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full transition"><ChevronLeft size={24}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full transition"><ChevronRight size={24}/></button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-gray-500 font-medium">Sem fotos cadastradas</div>
              )}
            </div>

            {/* CONTEÚDO NO CELULAR (Faz sobreposição redondinha na foto) */}
            <div className="md:hidden bg-white p-5 rounded-t-3xl -mt-6 relative z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] border-t border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full inline-block">
                  {ad.categoria}
                </span>
                <span className="text-gray-400 text-xs font-bold">{ad.visualizacoes || 1} visualizações</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">{ad.titulo}</h1>
              <span className="text-3xl font-black text-primary block mb-4">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </span>
              
              <div className="flex items-center justify-between text-gray-500 text-xs mt-3 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <span className="flex items-center gap-1.5 text-gray-700 font-bold"><MapPin size={16} className="text-accent" /> {ad.cidade || ad.localizacao || 'Piauí'}</span>
                 <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold uppercase tracking-widest text-[10px]">
                    <Flag size={12}/> Denunciar
                 </button>
              </div>
            </div>

            {/* DESCRIÇÃO E DICA */}
            <div className="bg-white p-6 md:p-8 md:rounded-3xl shadow-sm md:border border-gray-100 mt-2 md:mt-0">
              <h2 className="text-xl font-black text-gray-800 mb-4 border-b border-gray-100 pb-3">Detalhes</h2>
              <p className="whitespace-pre-wrap text-gray-600 text-base leading-relaxed bg-gray-50 p-4 rounded-2xl">{ad.descricao}</p>
              
              <div className="mt-6 bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-sm text-orange-800">
                <AlertTriangle className="shrink-0 text-orange-500" size={20} />
                <p><strong>Dica de Segurança:</strong> Não faça pagamentos antecipados sem conferir o produto pessoalmente.</p>
              </div>
            </div>
          </div>

          {/* BARRA LATERAL (DESKTOP) E VENDEDOR */}
          <div className="space-y-4 md:space-y-6 px-4 md:px-0 mb-6 mt-4 md:mt-0">
            <div className="hidden md:block bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-xs font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full inline-block">
                   {ad.categoria}
                 </span>
                 <div className="flex gap-2">
                   {/* 🚀 BOTÃO DE COMPARTILHAR DESKTOP */}
                   <button onClick={handleShare} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition"><Share2 size={20} /></button>
                   <button onClick={toggleFavorite} className="p-2 bg-gray-50 hover:bg-red-50 rounded-full transition">
                     <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"} size={20} />
                   </button>
                 </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">{ad.titulo}</h1>
              <div className="text-4xl font-black text-primary mb-6">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </div>
              
              <div className="flex items-center justify-between text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100 font-medium">
                 <div className="flex gap-4">
                   <span className="flex items-center gap-1 font-bold"><MapPin size={16} className="text-accent" /> {ad.cidade || ad.localizacao || 'Piauí'}</span>
                   <span className="flex items-center gap-1"><Eye size={16} className="text-accent" /> {ad.visualizacoes || 1} visitas</span>
                 </div>
                 <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-bold bg-red-50 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider">
                    <Flag size={14}/> Denunciar
                 </button>
              </div>

              <ContactButtons />
            </div>

            {/* CARD DO VENDEDOR */}
            <div className="bg-white md:rounded-3xl rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-16 bg-primary/10"></div>
               <Link href={`/vendedor/${ad.vendedorId}`} className="p-5 md:p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer relative z-10">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary font-black text-2xl shrink-0 overflow-hidden border-4 border-white shadow-md">
                    {vendedor?.fotoPerfil ? (
                      <img src={vendedor.fotoPerfil} alt={vendedor?.nome} className="w-full h-full object-cover" />
                    ) : (
                      vendedor?.nome?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-lg">{vendedor?.nome || "Vendedor"}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">No site desde {anoRegistro}</p>
                  </div>
                  <ChevronRight className="text-gray-300" />
               </Link>
            </div>
            
            <div className="md:hidden mt-4 pb-20">
               <ContactButtons />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}