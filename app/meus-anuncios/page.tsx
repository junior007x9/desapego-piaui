'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Loader2, Eye, Trash2, Edit, ShoppingBag, Sparkles, PlusCircle, 
  Calendar, CheckCircle, Rocket, Flame, BarChart3, Activity, ChevronLeft, Package 
} from 'lucide-react'

function calcularDiasVenda(criadoEm: any, vendidoEm: any) {
  if (!criadoEm) return "Vendido!";
  if (!vendidoEm) return "Vendido com sucesso!";
  const dataCriacao = criadoEm.seconds ? new Date(criadoEm.seconds * 1000) : new Date(criadoEm);
  const dataVenda = vendidoEm.seconds ? new Date(vendidoEm.seconds * 1000) : new Date(vendidoEm);
  const diffTime = Math.abs(dataVenda.getTime() - dataCriacao.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Vendido no mesmo dia!";
  if (diffDays === 1) return "Vendido em 1 dia no site";
  return `Vendido em ${diffDays} dias no site`;
}

export default function MeusAnunciosPage() {
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [totalViews, setTotalViews] = useState(0)
  const [activeAds, setActiveAds] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchMyAds(currentUser.uid)
      } else {
        router.push('/login')
      }
    })
    return () => unsubscribe()
  }, [router])

  async function fetchMyAds(userId: string) {
    try {
      const q = query(collection(db, 'anuncios'), where('vendedorId', '==', userId))
      const snap = await getDocs(q)
      const list: any[] = []
      let views = 0
      let ativos = 0
      const agora = new Date()

      for (const document of snap.docs) {
        const data = document.data()
        let statusFinal = data.status
        if (data.expiraEm) {
          const dataExpiracao = new Date(data.expiraEm);
          if (dataExpiracao < agora && statusFinal === 'ativo') {
             statusFinal = 'expirado';
             updateDoc(doc(db, 'anuncios', document.id), { status: 'expirado' }).catch(console.error);
          }
        }
        list.push({ id: document.id, ...data, status: statusFinal })
        views += (data.visualizacoes || 0)
        if (statusFinal === 'ativo') ativos++
      }

      list.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setAds(list)
      setTotalViews(views)
      setActiveAds(ativos)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Aviso: Excluir este anúncio fará com que você perca todas as visualizações. Deseja excluir mesmo assim?")) return;
    try {
      const adToLog = ads.find(a => a.id === id);
      await deleteDoc(doc(db, 'anuncios', id))
      setAds(ads.filter(ad => ad.id !== id))
      if (user) { try { await addDoc(collection(db, 'logs'), { usuarioId: user.uid, acao: 'EXCLUIU', tituloAnuncio: adToLog?.titulo || "Anúncio Removido", criadoEm: new Date() }); } catch (logError) {} }
    } catch (error) { alert("Ocorreu um erro ao excluir.") }
  }

  const handleMarkAsSold = async (id: string) => {
    if (!confirm("Marcar anúncio como VENDIDO?")) return;
    try {
      const adToLog = ads.find(a => a.id === id);
      const agora = new Date(); 
      await updateDoc(doc(db, 'anuncios', id), { status: 'vendido', vendidoEm: serverTimestamp() })
      setAds(ads.map(ad => ad.id === id ? { ...ad, status: 'vendido', vendidoEm: agora } : ad))
      alert("Parabéns pela venda! 🎉")
      if (user) { try { await addDoc(collection(db, 'logs'), { usuarioId: user.uid, acao: 'EDITOU', tituloAnuncio: adToLog?.titulo ? `${adToLog.titulo} (Vendido)` : "Marcado como Vendido", criadoEm: new Date() }); } catch (logError) {} }
    } catch (error) { alert("Erro ao atualizar o anúncio.") }
  }

  const handleImpulsionar = async (id: string, tipoPlano: number) => {
    try {
      if (!user) return;
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData) {
         await updateDoc(doc(db, 'anuncios', id), { planoId: tipoPlano });
         router.push(`/pagamento/${id}`);
         return;
      }

      let usouCredito = false;
      if (tipoPlano === 1 && userData.creditosTopo > 0) {
         if (confirm("Você tem um crédito 'Sobe pro Topo' na sua carteira! Deseja usá-lo agora gratuitamente?")) {
            await updateDoc(userRef, { creditosTopo: userData.creditosTopo - 1 });
            usouCredito = true;
         }
      } else if (tipoPlano === 2 && userData.creditosTurbo > 0) {
         if (confirm("Você tem um crédito 'Destaque Turbo' na sua carteira! Deseja usá-lo agora gratuitamente?")) {
            await updateDoc(userRef, { creditosTurbo: userData.creditosTurbo - 1 });
            usouCredito = true;
         }
      } else if (tipoPlano === 3 && userData.creditosOuro > 0) {
         if (confirm("Você tem um crédito 'Ouro' na sua carteira! Deseja usá-lo agora gratuitamente?")) {
            await updateDoc(userRef, { creditosOuro: userData.creditosOuro - 1 });
            usouCredito = true;
         }
      }

      if (usouCredito) {
         const dataExp = new Date();
         dataExp.setDate(dataExp.getDate() + 20); 

         await updateDoc(doc(db, 'anuncios', id), {
           planoId: tipoPlano,
           status: 'ativo',
           expiraEm: dataExp.toISOString(),
           pagoEm: new Date().toISOString(),
           criadoEm: serverTimestamp() 
         });
         
         alert("🚀 Sucesso! Seu anúncio foi impulsionado gratuitamente usando seus créditos.");
         fetchMyAds(user.uid); 
         return;
      }

      await updateDoc(doc(db, 'anuncios', id), { planoId: tipoPlano });
      router.push(`/pagamento/${id}`);

    } catch (error) {
      alert("Ocorreu um erro ao tentar impulsionar.");
    }
  }

  // Lógica das Cores da Barrinha de Performance
  const getPerformanceColor = (views: number) => {
    if (views > 100) return 'bg-green-500'
    if (views > 30) return 'bg-amber-500'
    return 'bg-blue-500'
  }

  const getPerformanceText = (views: number) => {
    if (views > 100) return 'Alta (Bombando!)'
    if (views > 30) return 'Média'
    return 'Baixa (Precisa de Destaque)'
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10 font-sans">
      
      {/* 🚀 NOVO CABEÇALHO DASHBOARD */}
      <div className="bg-primary pt-8 pb-24 px-4 rounded-b-[2.5rem] md:rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <button onClick={() => router.push('/')} className="bg-white/20 hover:bg-white/30 text-white p-2 md:p-2.5 pr-4 rounded-full transition mb-6 flex items-center gap-1 text-xs md:text-sm font-bold w-fit outline-none">
            <ChevronLeft size={18}/> Início
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <BarChart3 size={32} className="hidden md:block"/> Meu Painel
              </h1>
              <p className="text-primary-100 font-medium mt-1 text-sm md:text-base">Gerencie seu estoque e acompanhe seus resultados.</p>
            </div>
            <Link href="/anunciar" className="bg-white text-primary hover:bg-gray-50 px-6 py-3 rounded-xl font-black transition flex items-center justify-center gap-2 shadow-md outline-none active:scale-95 text-sm md:text-base">
              <PlusCircle size={20} /> Novo Anúncio
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-20 space-y-6">
        
        {/* 🚀 NOVOS CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <Eye size={26} />
            </div>
            <p className="text-2xl md:text-4xl font-black text-gray-900 leading-none">{totalViews}</p>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Visitas Totais</p>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
              <Activity size={26} />
            </div>
            <p className="text-2xl md:text-4xl font-black text-gray-900 leading-none">{activeAds}</p>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Anúncios Ativos</p>
          </div>

          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 md:p-6 rounded-3xl shadow-md text-white flex flex-col items-center text-center col-span-2 md:col-span-1 justify-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
             <Sparkles size={28} className="mb-2 relative z-10 animate-pulse" />
             <p className="font-black text-base md:text-lg relative z-10 leading-tight">Venda mais rápido!</p>
             <Link href="/carteira" className="bg-white text-orange-600 text-[10px] md:text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl mt-3 active:scale-95 transition-transform relative z-10 shadow-sm group-hover:shadow-md">
               Usar Moedas VIP
             </Link>
          </div>
        </div>

        {/* LISTA DE ANÚNCIOS */}
        <div className="pt-6">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2 mb-6 ml-2 md:ml-0">
            <Package className="text-primary" size={24}/> Vitrine de Produtos
          </h2>

          {ads.length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100">
               <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"><ShoppingBag size={40} /></div>
               <h3 className="text-xl font-black text-gray-800 mb-2">Sua vitrine está vazia</h3>
               <p className="text-gray-500 mb-6 max-w-md mx-auto">Você ainda não publicou nenhum anúncio. Comece a desapegar agora mesmo e ganhe dinheiro!</p>
               <Link href="/anunciar" className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-bold transition shadow-md inline-block">Anunciar meu primeiro produto</Link>
            </div>
          ) : (
            <div className="space-y-6">
               {ads.map((ad) => {
                // Cálculo da barra de performance
                const views = ad.visualizacoes || 0;
                const barWidth = Math.min((views / 200) * 100, 100);

                return (
                  <div key={ad.id} className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center relative overflow-hidden">
                    <Link href={`/anuncio/${ad.id}`} className="shrink-0 relative w-full md:w-32 h-48 md:h-32 bg-gray-50 rounded-2xl overflow-hidden block group">
                      {ad.imagemUrl ? <img src={ad.imagemUrl} className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${ad.status === 'vendido' ? 'grayscale opacity-70' : ''}`} /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={24}/></div>}
                      {ad.planoId > 0 && ad.status === 'ativo' && (<div className="absolute top-2 left-2 bg-accent text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-md flex items-center gap-1"><Sparkles size={10}/> VIP</div>)}
                      {ad.status === 'vendido' && (<div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-black text-xs tracking-widest uppercase rotate-[-15deg] border-2 border-white px-2 py-1">Vendido</span></div>)}
                    </Link>

                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">{ad.categoria}</span>
                        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded tracking-wider ${ad.status === 'ativo' ? 'bg-green-100 text-green-700' : ad.status === 'vendido' ? 'bg-gray-200 text-gray-700' : ad.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{ad.status}</span>
                      </div>
                      <Link href={`/anuncio/${ad.id}`}>
                        <h3 className={`text-lg font-bold leading-tight mb-1 transition-colors line-clamp-2 ${ad.status === 'vendido' ? 'text-gray-500 line-through' : 'text-gray-900 hover:text-primary'}`}>{ad.titulo}</h3>
                      </Link>
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                           <Calendar size={12} /><span>{ad.criadoEm ? `Criado em ${new Date(ad.criadoEm.seconds ? ad.criadoEm.seconds * 1000 : ad.criadoEm).toLocaleDateString('pt-BR')}` : 'Data não disponível'}</span>
                        </div>
                        {ad.status === 'vendido' && (
                           <div className="flex items-center gap-1.5 text-[11px] text-green-600 font-black uppercase tracking-wider bg-green-50 w-fit px-2 py-1 rounded-md mt-1">
                              <CheckCircle size={12} /><span>{calcularDiasVenda(ad.criadoEm, ad.vendidoEm)}</span>
                           </div>
                        )}
                      </div>
                      
                      <div className="flex items-end justify-between mt-2">
                        <p className={`text-2xl font-black ${ad.status === 'vendido' ? 'text-gray-400' : 'text-primary'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco || 0)}</p>
                      </div>

                      {/* 🚀 NOVA BARRINHA DE PERFORMANCE INSERIDA AQUI */}
                      <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                         <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 mb-2 tracking-wider">
                           <span className="flex items-center gap-1"><Eye size={12}/> {views} Visitas</span>
                           <span>{getPerformanceText(views)}</span>
                         </div>
                         <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                           <div className={`h-2 rounded-full transition-all duration-1000 ${getPerformanceColor(views)}`} style={{ width: `${barWidth}%` }}></div>
                         </div>
                      </div>

                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                      {ad.status === 'ativo' && (
                         <>
                            <button onClick={() => handleImpulsionar(ad.id, 1)} className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition shadow-md flex justify-center items-center gap-1 hover:animate-none outline-none"><Rocket size={14} className="shrink-0"/> Topo (R$ 5)</button>
                            <button onClick={() => handleImpulsionar(ad.id, 2)} className="w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition shadow-md flex justify-center items-center gap-1 outline-none"><Flame size={14} className="shrink-0"/> Turbo (R$ 9,90)</button>
                            <button onClick={() => handleImpulsionar(ad.id, 3)} className="w-full text-center bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider px-3 py-2 rounded-xl transition shadow-md flex justify-center items-center gap-1 outline-none"><Sparkles size={14} className="shrink-0"/> Ouro (R$ 19,90)</button>
                            <button onClick={() => handleMarkAsSold(ad.id)} className="mt-2 w-full text-center bg-green-100 hover:bg-green-200 text-green-700 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition shadow-sm flex justify-center items-center gap-2 outline-none"><CheckCircle size={16}/> Já Vendi!</button>
                         </>
                      )}
                      {(ad.status === 'expirado' || ad.status === 'pendente') && (
                         <>
                            <p className="text-[10px] text-gray-500 font-bold uppercase text-center mb-1">Renove seu Anúncio:</p>
                            <button onClick={() => handleImpulsionar(ad.id, 1)} className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-3 py-2.5 rounded-xl transition shadow-md flex justify-center items-center gap-1 outline-none"><Rocket size={14} className="shrink-0"/> Topo (R$ 5)</button>
                            <button onClick={() => handleImpulsionar(ad.id, 2)} className="w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider px-3 py-2.5 rounded-xl transition shadow-md flex justify-center items-center gap-1 outline-none"><Flame size={14} className="shrink-0"/> Turbo (R$ 9,90)</button>
                         </>
                      )}
                      <div className="flex gap-2 w-full mt-2">
                        {ad.status !== 'vendido' && <Link href={`/editar-anuncio/${ad.id}`} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs px-3 py-2 rounded-xl transition outline-none"><Edit size={14}/> Editar</Link>}
                        <button onClick={() => handleDelete(ad.id)} className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 font-bold text-xs px-3 py-2 rounded-xl transition outline-none"><Trash2 size={14}/> Excluir</button>
                      </div>
                    </div>

                  </div>
                )
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}