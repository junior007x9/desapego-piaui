'use client'
import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, doc, updateDoc, limit, startAfter, orderBy } from 'firebase/firestore'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, ShoppingBag, SlidersHorizontal, ChevronLeft, Sparkles, X, Loader2, Flame, Rocket, Heart } from 'lucide-react'

const CATEGORIAS = ["Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Serviços", "Bebês e Crianças", "Esportes", "Vagas de Emprego", "Outros"]

function formatTimeAgo(timestampSeconds: number) {
  if (!timestampSeconds) return 'Data desconhecida';
  const now = new Date();
  const date = new Date(timestampSeconds * 1000);
  const diffInTime = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays < 7) return `Há ${diffInDays} dias`;
  if (diffInDays < 30) return `Há ${Math.floor(diffInDays / 7)} sem.`;
  return date.toLocaleDateString('pt-BR');
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const queryBusca = searchParams.get('q') || ''
  const queryCategoria = searchParams.get('categoria') || ''

  const [ads, setAds] = useState<any[]>([])
  const [filteredAds, setFilteredAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastVisible, setLastVisible] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)

  const [busca, setBusca] = useState(queryBusca)
  const [categoria, setCategoria] = useState(queryCategoria)
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [ordenacao, setOrdenacao] = useState('recentes')
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  const fetchAds = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true)
      else setLoading(true)

      const agora = new Date()
      let q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'), orderBy('criadoEm', 'desc'), limit(12))

      if (isLoadMore && lastVisible) {
        q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'), orderBy('criadoEm', 'desc'), startAfter(lastVisible), limit(12))
      }

      const snap = await getDocs(q)
      const list: any[] = []

      if (snap.empty) {
        setHasMore(false)
      } else {
        setLastVisible(snap.docs[snap.docs.length - 1])
        for (const document of snap.docs) {
          const data = document.data()
          let isExpired = false;
          if (data.expiraEm && new Date(data.expiraEm) < agora) isExpired = true;
          
          if (!isExpired) list.push({ id: document.id, ...data })
        }
      }
      
      setAds(prev => isLoadMore ? [...prev, ...list] : list)
      setHasMore(snap.docs.length === 12)
    } catch (error) { console.error(error) } 
    finally { setLoading(false); setLoadingMore(false) }
  }

  useEffect(() => { fetchAds() }, [])

  const observer = useRef<IntersectionObserver | null>(null)
  const lastAdElementRef = useCallback((node: any) => {
    if (loading || loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) fetchAds(true)
    })
    if (node) observer.current.observe(node)
  }, [loading, loadingMore, hasMore])

  useEffect(() => {
    let result = [...ads]
    if (busca.trim()) result = result.filter(ad => ad.titulo.toLowerCase().includes(busca.toLowerCase()))
    if (categoria) result = result.filter(ad => ad.categoria === categoria)
    if (precoMin) result = result.filter(ad => ad.preco >= parseFloat(precoMin))
    if (precoMax) result = result.filter(ad => ad.preco <= parseFloat(precoMax))

    const getPeso = (planoId: number) => {
      if (planoId === 3) return 4;
      if (planoId === 2 || planoId === 0) return 3;
      if (planoId === 1) return 2;
      return 1;
    };

    const getTempo = (ad: any) => ad.pagoEm ? new Date(ad.pagoEm).getTime() : (ad.criadoEm?.seconds * 1000 || 0);

    result.sort((a, b) => {
      if (ordenacao === 'recentes') {
        const pesoA = getPeso(Number(a.planoId));
        const pesoB = getPeso(Number(b.planoId));
        if (pesoA !== pesoB) return pesoB - pesoA;
        return getTempo(b) - getTempo(a);
      }
      return ordenacao === 'menor_preco' ? a.preco - b.preco : b.preco - a.preco;
    })
    setFilteredAds(result)
  }, [ads, busca, categoria, precoMin, precoMax, ordenacao])

  const clearFilters = () => {
    setBusca(''); setCategoria(''); setPrecoMin(''); setPrecoMax(''); setOrdenacao('recentes'); router.push('/todos-anuncios');
  }

  const FiltrosComponent = () => (
    <div className="space-y-6 pb-28 md:pb-0">
      <div className="flex justify-between items-center md:hidden mb-6 border-b pb-4">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><SlidersHorizontal size={20}/> Filtros</h2>
        <button onClick={() => setShowFiltersMobile(false)} className="bg-gray-100 p-2 rounded-full text-gray-600"><X size={20}/></button>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">O que procura?</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex: iPhone..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoria</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium text-gray-700">
          <option value="">Todas as Categorias</option>
          {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Faixa de Preço (R$)</label>
        <div className="flex items-center gap-2">
          <input type="number" value={precoMin} onChange={e => setPrecoMin(e.target.value)} placeholder="Mín." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium" />
          <span className="text-gray-400 font-bold">-</span>
          <input type="number" value={precoMax} onChange={e => setPrecoMax(e.target.value)} placeholder="Máx." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ordenar por</label>
        <select value={ordenacao} onChange={e => setOrdenacao(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium text-gray-700">
          <option value="recentes">Mais Relevantes / VIPs</option>
          <option value="menor_preco">Menor Preço</option>
          <option value="maior_preco">Maior Preço</option>
        </select>
      </div>
      <button onClick={clearFilters} className="w-full py-3 bg-red-50 text-red-500 hover:bg-red-100 font-bold rounded-xl transition-colors">Limpar Filtros</button>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 md:hidden z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setShowFiltersMobile(false)} className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg active:scale-95 transition-all">Ver {filteredAds.length} resultados</button>
      </div>
    </div>
  )

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10">
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 p-3 flex justify-between items-center shadow-sm">
        <button onClick={() => router.push('/')} className="flex items-center gap-1 bg-gray-100 p-2 pr-4 rounded-full text-gray-800 font-bold text-sm"><ChevronLeft size={20} /> Voltar</button>
        <button onClick={() => setShowFiltersMobile(true)} className="flex items-center gap-2 bg-primary/10 text-primary p-2 px-4 rounded-full font-bold text-sm"><SlidersHorizontal size={18} /> Filtros</button>
      </div>
      {showFiltersMobile && <div className="md:hidden fixed inset-0 bg-white z-50 p-6 overflow-y-auto animate-in slide-in-from-bottom-full duration-300"><FiltrosComponent /></div>}
      <div className="bg-primary pt-8 pb-16 px-4 rounded-b-[2rem] shadow-sm mb-8 hidden md:block relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex items-center gap-4">
           <button onClick={() => router.push('/')} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition"><ChevronLeft size={24}/></button>
           <h1 className="text-3xl font-black text-white tracking-tight">Encontre o que precisa</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8 relative z-20 md:-mt-10">
        <div className="hidden md:block w-72 shrink-0">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 sticky top-24">
             <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4"><SlidersHorizontal className="text-primary" size={24} /><h2 className="text-xl font-black text-gray-900">Filtros</h2></div>
             <FiltrosComponent />
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-end px-2 md:px-0">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">Resultados da busca</h2>
              <p className="text-gray-500 font-medium text-sm mt-1">Navegando nos anúncios mais relevantes</p>
            </div>
          </div>
          {loading && ads.length === 0 ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : filteredAds.length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100">
               <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"><Search size={40} /></div>
               <h3 className="text-xl font-black text-gray-800 mb-2">Nenhum resultado</h3>
               <p className="text-gray-500 mb-6 max-w-md mx-auto">Não encontramos anúncios com os filtros selecionados ou não há mais anúncios.</p>
               <button onClick={clearFilters} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition shadow-md">Limpar todos os filtros</button>
            </div>
          ) : (
            <>
              {/* 🚀 CAIXAS COM CORES EXATAMENTE IGUAIS À HOME */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {filteredAds.map((ad, index) => {
                  const isLastElement = filteredAds.length === index + 1;
                  const plano = Number(ad.planoId) || 0;
                  const isOuro = plano === 3;
                  const isTurbo = plano === 2; 
                  const isSobe = plano === 1;

                  return (
                    <Link ref={isLastElement ? lastAdElementRef : null} href={`/anuncio/${ad.id}`} key={ad.id} className="group relative outline-none h-full flex flex-col">
                      <div className={`h-full flex flex-col overflow-hidden transition-all duration-300 ${
                        isOuro ? 'rounded-2xl p-[3px] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(251,191,36,0.5)]' :
                        isTurbo ? 'rounded-2xl p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-md hover:-translate-y-1 hover:shadow-lg' :
                        isSobe ? 'rounded-2xl border-[3px] border-blue-400 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md' :
                        'rounded-2xl border border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md'
                      }`}>
                        <div className="bg-white h-full flex flex-col rounded-xl overflow-hidden relative">
                          {isOuro && (<div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-md flex items-center gap-1"><Sparkles size={12}/> Ouro</div>)}
                          {isTurbo && (<div className="absolute top-2 left-2 z-20 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-md flex items-center gap-1"><Flame size={12}/> Turbo</div>)}
                          {isSobe && (<div className="absolute top-2 left-2 z-20 bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-md flex items-center gap-1"><Rocket size={12}/> Topo</div>)}
                          <div className="absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm"><Heart size={16} strokeWidth={2.5} /></div>
                          <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative border-b border-gray-100">
                             {ad.imagemUrl ? <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ad.titulo} /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>}
                          </div>
                          <div className="p-3 md:p-4 flex flex-col flex-1">
                            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mb-2">{ad.categoria}</span>
                            <h3 className="text-xs md:text-sm text-gray-800 line-clamp-2 mb-2 font-semibold group-hover:text-primary transition-colors leading-snug flex-1">{ad.titulo}</h3>
                            <p className={`text-lg md:text-xl font-black mt-2 ${isOuro ? 'text-amber-600' : isTurbo ? 'text-purple-600' : isSobe ? 'text-blue-600' : 'text-gray-900'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}</p>
                            <div className="mt-3 pt-3 text-[10px] text-gray-400 flex justify-between font-medium border-t border-gray-50">
                              <span>{ad.pagoEm ? formatTimeAgo(new Date(ad.pagoEm).getTime() / 1000) : (ad.criadoEm ? formatTimeAgo(ad.criadoEm.seconds) : 'Hoje')}</span>
                              <span className="flex items-center gap-1 truncate max-w-[60%]"><MapPin size={10} className="text-gray-300 shrink-0"/> <span className="truncate">{ad.cidade || ad.localizacao || 'Piauí'}</span></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {loadingMore && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TodosAnunciosPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}><SearchContent /></Suspense>
}