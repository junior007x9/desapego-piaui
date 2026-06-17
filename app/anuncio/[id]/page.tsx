'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { MapPin, AlertTriangle, ChevronLeft, ChevronRight, Heart, Eye, Flag, X, Maximize2, Share2, CheckCircle2, BadgeCheck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function DetalhesAnuncio() {
  const params = useParams()
  const router = useRouter()
  const [ad, setAd] = useState<any>(null)
  const [vendedor, setVendedor] = useState<any>(null)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Estados do Sistema de Denúncia
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
          const vendedorDoc = await getDoc(doc(db, 'usuarios', adData.vendedorId));
          if (vendedorDoc.exists()) {
            setVendedor(vendedorDoc.data());
          } else {
             // Tenta buscar em 'users' como fallback
             const vendedorFallback = await getDoc(doc(db, 'users', adData.vendedorId));
             if (vendedorFallback.exists()) setVendedor(vendedorFallback.data());
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

  // 🚀 Função para enviar denúncia ao banco de dados
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportMotivo.trim()) return;
    setIsReporting(true);
    try {
      await addDoc(collection(db, 'denuncias'), {
        anuncioId: ad.id,
        tituloAnuncio: ad.titulo,
        vendedorId: ad.vendedorId,
        denuncianteId: user?.uid || 'Nao_Logado',
        motivo: reportMotivo,
        criadoEm: serverTimestamp()
      });
      alert("Denúncia enviada com sucesso! Nossa equipe vai analisar e tomar as providências.");
      setIsReportModalOpen(false);
      setReportMotivo('');
    } catch (error) {
      console.error("Erro ao denunciar:", error);
      alert("Erro ao enviar denúncia. Tente novamente mais tarde.");
    } finally {
      setIsReporting(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (!user) {
      alert("🔒 Segurança: Para ver o número do vendedor e evitar fraudes, faça login na sua conta.");
      router.push('/login');
      return;
    }
    if (vendedor?.telefone) {
      const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco);
      const linkAnuncio = window.location.href;
      const mensagem = `Olá! 👋 Vim do site *Desapego Piauí* 🚀\n\nTenho interesse no seu anúncio:\n📦 *${ad.titulo}*\n💰 *${precoFormatado}*\n\n🔗 Link do anúncio:\n${linkAnuncio}\n\nAinda está disponível?`;
      const textoCodificado = encodeURIComponent(mensagem);
      window.open(`https://wa.me/55${vendedor.telefone.replace(/\D/g, '')}?text=${textoCodificado}`, '_blank');
    } else {
      alert("Este vendedor ainda não cadastrou um número de WhatsApp.");
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ad.titulo} - Desapego Piauí`,
          text: `Olha o que encontrei no Desapego Piauí: ${ad.titulo} por apenas R$ ${ad.preco}`,
          url: window.location.href,
        });
      } catch (error) { console.log('Compartilhamento cancelado', error); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link do anúncio copiado! Cole no WhatsApp ou Instagram para enviar aos amigos.");
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === ad.fotos.length - 1 ? 0 : prev + 1)
  }

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? ad.fotos.length - 1 : prev - 1)
  }

  if (!ad) return <div className="min-h-screen flex items-center justify-center text-primary animate-pulse font-bold text-xl">Carregando detalhes...</div>

  const ContactButtons = () => {
    if (ad.status === 'vendido') {
        return (
          <div className="bg-gray-100 border border-gray-200 p-4 rounded-xl text-center flex flex-col items-center justify-center gap-2">
             <CheckCircle2 size={32} className="text-gray-400" />
             <p className="text-gray-600 font-bold text-sm uppercase tracking-widest">Produto já vendido</p>
             <Link href="/" className="text-primary font-bold text-sm hover:underline mt-2">Buscar outros produtos parecidos</Link>
          </div>
        )
    }

    if (user?.uid === ad.vendedorId) {
        return <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center text-gray-600 font-bold text-sm uppercase tracking-widest">Este é o seu anúncio</div>
    }

    return (
      <div className="flex w-full">
        <button onClick={handleWhatsAppClick} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-[15px] md:text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          Chamar no WhatsApp
        </button>
      </div>
    );
  };

  const anoRegistro = vendedor?.criadoEm?.toDate ? vendedor.criadoEm.toDate().getFullYear() : '2024';

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      
      {/* 🚀 MODAL DE DENÚNCIA */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
           <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 outline-none">
                 <X size={24} />
              </button>
              <div className="flex items-center gap-3 mb-4 text-red-500">
                 <AlertTriangle size={28} />
                 <h2 className="text-xl font-black text-gray-900">Denunciar Anúncio</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4 font-medium">
                 Encontrou algo errado? Ajude-nos a manter a plataforma segura. Descreva o motivo da sua denúncia abaixo.
              </p>
              <form onSubmit={handleReportSubmit}>
                 <textarea
                   required
                   value={reportMotivo}
                   onChange={(e) => setReportMotivo(e.target.value)}
                   rows={4}
                   className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-4 text-gray-800 resize-none font-medium text-sm"
                   placeholder="Ex: É um golpe, produto falso, categoria errada, fotos impróprias..."
                 ></textarea>
                 <button
                   type="submit"
                   disabled={isReporting || !reportMotivo.trim()}
                   className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {isReporting ? 'Enviando...' : 'Enviar Denúncia'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL DE ZOOM DE FOTOS */}
      {isZoomOpen && (
        <div className="fixed inset-0 bg-black z-[99990] flex flex-col">
          <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50">
            <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {ad.fotos.length}
            </span>
            <button onClick={() => setIsZoomOpen(false)} className="text-white bg-black/60 p-3 rounded-full hover:bg-black/80 transition outline-none">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 w-full h-full flex items-center justify-center overflow-auto p-2">
             <img src={ad.fotos[currentImageIndex]} className="max-w-full max-h-full object-contain" alt="Zoom do produto" />
          </div>
          {ad.fotos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 md:p-4 rounded-full z-50 hover:bg-black/80 outline-none">
                <ChevronLeft size={32}/>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-black/60 text-white p-3 md:p-4 rounded-full z-50 hover:bg-black/80 outline-none">
                <ChevronRight size={32}/>
              </button>
            </>
          )}
        </div>
      )}

      {/* NAVBAR MOBILE DO ANÚNCIO */}
      <div className="md:hidden sticky top-0 w-full z-40 bg-white border-b border-gray-100 p-3 flex justify-between items-center shadow-sm">
        <button onClick={() => router.back()} className="flex items-center gap-1 bg-gray-100 p-2 pr-4 rounded-full text-primary font-bold text-sm outline-none">
          <ChevronLeft size={20} /> Voltar
        </button>
        <div className="flex gap-2">
          <button onClick={handleShare} className="p-2.5 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition outline-none"><Share2 size={20} /></button>
          <button onClick={toggleFavorite} className="p-2.5 bg-gray-100 rounded-full outline-none">
            <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"} size={20} />
          </button>
        </div>
      </div>

      {ad.status === 'vendido' && (
        <div className="bg-gray-800 text-white text-center py-3 font-black tracking-widest uppercase shadow-md relative z-10 flex items-center justify-center gap-2">
           <CheckCircle2 size={18} /> Produto já vendido
        </div>
      )}

      <div className="container mx-auto px-0 md:px-4 pt-0 md:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-8">
          
          <div className="lg:col-span-2 space-y-0 md:space-y-4">
            
            <div className={`bg-black md:rounded-3xl relative h-[350px] sm:h-[450px] md:h-[550px] flex items-center justify-center ${ad.status === 'vendido' ? 'opacity-80 grayscale' : ''}`}>
              {ad.fotos && ad.fotos.length > 0 ? (
                <>
                  <img src={ad.fotos[currentImageIndex]} className="w-full h-full object-contain cursor-zoom-in" alt={ad.titulo} onClick={() => setIsZoomOpen(true)} />
                  <button onClick={() => setIsZoomOpen(true)} className="absolute bottom-4 right-4 bg-black/60 text-white p-3 rounded-full flex items-center justify-center hover:bg-black/80 transition outline-none">
                    <Maximize2 size={20} />
                  </button>
                  {ad.fotos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest">
                      {currentImageIndex + 1} / {ad.fotos.length}
                    </div>
                  )}
                  {ad.fotos.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full transition outline-none"><ChevronLeft size={24}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2.5 rounded-full transition outline-none"><ChevronRight size={24}/></button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-gray-500 font-medium">Sem fotos cadastradas</div>
              )}
            </div>

            <div className="md:hidden bg-white p-5 rounded-t-3xl -mt-6 relative z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] border-t border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full inline-block">
                  {ad.categoria}
                </span>
                <span className="text-gray-400 text-xs font-bold">{ad.visualizacoes || 1} visualizações</span>
              </div>
              <h1 className={`text-2xl font-black leading-tight mb-2 ${ad.status === 'vendido' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{ad.titulo}</h1>
              <span className={`text-3xl font-black block mb-4 ${ad.status === 'vendido' ? 'text-gray-400' : 'text-primary'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </span>
              
              <div className="flex items-center justify-between text-gray-500 text-xs mt-3 font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <span className="flex items-center gap-1.5 text-gray-700 font-bold"><MapPin size={16} className="text-accent" /> {ad.cidade || ad.localizacao || 'Piauí'}</span>
                 <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold uppercase tracking-widest text-[10px] outline-none">
                    <Flag size={12}/> Denunciar
                 </button>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 md:rounded-3xl shadow-sm md:border border-gray-100 mt-2 md:mt-0">
              <h2 className="text-xl font-black text-gray-800 mb-4 border-b border-gray-100 pb-3">Detalhes do Anúncio</h2>
              <p className="whitespace-pre-wrap text-gray-600 text-base leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100">{ad.descricao}</p>
              
              {ad.status !== 'vendido' && (
                <div className="mt-6 bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex gap-4 text-sm text-blue-900 shadow-sm">
                  <AlertTriangle className="shrink-0 text-blue-500 mt-0.5" size={24} />
                  <div>
                    <h3 className="font-black mb-1">Dica de Segurança</h3>
                    <p className="font-medium text-blue-800/80">Evite golpes! Nunca faça depósitos ou transferências antecipadas. Sempre negocie o pagamento pessoalmente, em locais públicos e movimentados no momento da entrega do produto.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 md:space-y-6 px-4 md:px-0 mb-6 mt-4 md:mt-0">
            <div className="hidden md:block bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                 <span className="text-xs font-black uppercase tracking-wider text-accent bg-accent/10 px-3 py-1.5 rounded-full inline-block">
                   {ad.categoria}
                 </span>
                 <div className="flex gap-2">
                   <button onClick={handleShare} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition outline-none"><Share2 size={20} /></button>
                   <button onClick={toggleFavorite} className="p-2 bg-gray-50 hover:bg-red-50 rounded-full transition outline-none">
                     <Heart className={isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"} size={20} />
                   </button>
                 </div>
              </div>

              <h1 className={`text-2xl font-bold mb-3 ${ad.status === 'vendido' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{ad.titulo}</h1>
              <div className={`text-4xl font-black mb-6 ${ad.status === 'vendido' ? 'text-gray-400' : 'text-primary'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </div>
              
              <div className="flex items-center justify-between text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100 font-medium">
                 <div className="flex gap-4">
                   <span className="flex items-center gap-1 font-bold text-gray-700"><MapPin size={16} className="text-accent" /> {ad.cidade || ad.localizacao || 'Piauí'}</span>
                   <span className="flex items-center gap-1"><Eye size={16} className="text-accent" /> {ad.visualizacoes || 1} visitas</span>
                 </div>
                 <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider outline-none">
                    <Flag size={14}/> Denunciar
                 </button>
              </div>

              <ContactButtons />
            </div>

            {/* 👇 CORREÇÃO: title colocado em uma tag span para não gerar erro no TypeScript 👇 */}
            <div className="bg-white md:rounded-3xl rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
               <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-primary/10 to-transparent"></div>
               <Link href={`/vendedor/${ad.vendedorId}`} className="p-5 md:p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer relative z-10 outline-none">
                  
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary font-black text-2xl shrink-0 overflow-hidden border-4 border-white shadow-md">
                    {vendedor?.fotoPerfil ? (
                      <img src={vendedor.fotoPerfil} alt={vendedor?.nome} className="w-full h-full object-cover" />
                    ) : (
                      vendedor?.nome?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-black text-gray-900 text-lg truncate max-w-[150px] md:max-w-[180px]">{vendedor?.nome || "Vendedor"}</p>
                      <span title="Usuário Verificado" className="flex shrink-0">
                         <BadgeCheck size={20} className="text-blue-500" />
                      </span>
                    </div>
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1 bg-green-50 w-fit px-2 py-0.5 rounded-md border border-green-100">
                      <ShieldCheck size={14} />
                      Ativo desde {anoRegistro}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors text-gray-400">
                     <ChevronRight size={20} />
                  </div>
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