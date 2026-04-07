'use client'
import { useState, useEffect, Suspense } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, ShoppingBag, SlidersHorizontal, ChevronLeft, Sparkles, X, Loader2 } from 'lucide-react'

const CATEGORIAS = ["Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Puxa o que foi digitado na Home
  const queryBusca = searchParams.get('q') || ''
  const queryCategoria = searchParams.get('categoria') || ''

  const [ads, setAds] = useState<any[]>([])
  const [filteredAds, setFilteredAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Estados dos Filtros
  const [busca, setBusca] = useState(queryBusca)
  const [categoria, setCategoria] = useState(queryCategoria)
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [ordenacao, setOrdenacao] = useState('recentes')
  
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  useEffect(() => {
    async function fetchAds() {
      try {
        // Busca todos os anúncios ATIVOS
        const q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'))
        const snap = await getDocs(q)
        const list: any[] = []
        
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() })
        })
        
        setAds(list)
      } catch (error) {
        console.error("Erro ao buscar anúncios:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAds()
  }, [])

  // MÁGICA DOS FILTROS (Roda automaticamente sempre que o usuário mexe em algo)
  useEffect(() => {
    let result = [...ads]

    if (busca.trim()) {
      const termo = busca.toLowerCase()
      result = result.filter(ad => 
        ad.titulo.toLowerCase().includes(termo) || 
        ad.descricao.toLowerCase().includes(termo)
      )
    }

    if (categoria) {
      result = result.filter(ad => ad.categoria === categoria)
    }

    if (precoMin) {
      result = result.filter(ad => ad.preco >= parseFloat(precoMin))
    }
    if (precoMax) {
      result = result.filter(ad => ad.preco <= parseFloat(precoMax))
    }

    // Ordenação Inteligente
    result.sort((a, b) => {
      if (ordenacao === 'recentes') {
        // Fura-fila para os VIPs
        if ((b.planoId || 0) !== (a.planoId || 0)) return (b.planoId || 0) - (a.planoId || 0);
        return (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0)
      }
      if (ordenacao === 'menor_preco') return a.preco - b.preco
      if (ordenacao === 'maior_preco') return b.preco - a.preco
      return 0
    })

    setFilteredAds(result)
  }, [ads, busca, categoria, precoMin, precoMax, ordenacao])

  const clearFilters = () => {
    setBusca('')
    setCategoria('')
    setPrecoMin('')
    setPrecoMax('')
    setOrdenacao('recentes')
    router.push('/todos-anuncios')
  }

  const FiltrosComponent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center md:hidden mb-6 border-b pb-4">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><SlidersHorizontal size={20}/> Filtros</h2>
        <button onClick={() => setShowFiltersMobile(false)} className="bg-gray-100 p-2 rounded-full text-gray-600"><X size={20}/></button>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">O que procura?</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex: iPhone, Bicicleta..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium" />
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
          <option value="recentes">Mais Relevantes / Recentes</option>
          <option value="menor_preco">Menor Preço</option>
          <option value="maior_preco">Maior Preço</option>
        </select>
      </div>

      <button onClick={clearFilters} className="w-full py-3 bg-red-50 text-red-500 hover:bg-red-100 font-bold rounded-xl transition-colors">
        Limpar Filtros
      </button>
      
      {/* Botão de aplicar apenas no mobile */}
      <button onClick={() => setShowFiltersMobile(false)} className="w-full py-4 bg-primary text-white font-bold rounded-xl transition-colors md:hidden mt-4 shadow-lg">
        Ver {filteredAds.length} resultados
      </button>
    </div>
  )

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10">
      
      {/* CABEÇALHO MOBILE */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 p-3 flex justify-between items-center shadow-sm">
        <button onClick={() => router.push('/')} className="flex items-center gap-1 bg-gray-100 p-2 pr-4 rounded-full text-gray-800 font-bold text-sm">
          <ChevronLeft size={20} /> Voltar
        </button>
        <button onClick={() => setShowFiltersMobile(true)} className="flex items-center gap-2 bg-primary/10 text-primary p-2 px-4 rounded-full font-bold text-sm">
          <SlidersHorizontal size={18} /> Filtros
        </button>
      </div>

      {/* MODAL DE FILTROS MOBILE */}
      {showFiltersMobile && (
        <div className="md:hidden fixed inset-0 bg-white z-50 p-6 overflow-y-auto animate-in slide-in-from-bottom-full duration-300">
           <FiltrosComponent />
        </div>
      )}

      <div className="bg-primary pt-8 pb-16 px-4 rounded-b-[2rem] shadow-sm mb-8 hidden md:block relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-6xl mx-auto relative z-10 flex items-center gap-4">
           <button onClick={() => router.push('/')} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition"><ChevronLeft size={24}/></button>
           <h1 className="text-3xl font-black text-white tracking-tight">Encontre o que precisa</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8 relative z-20 md:-mt-10">
        
        {/* BARRA LATERAL (FILTROS DESKTOP) */}
        <div className="hidden md:block w-72 shrink-0">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 sticky top-24">
             <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
               <SlidersHorizontal className="text-primary" size={24} />
               <h2 className="text-xl font-black text-gray-900">Filtros</h2>
             </div>
             <FiltrosComponent />
          </div>
        </div>

        {/* ÁREA DE RESULTADOS */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-end px-2 md:px-0">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">Resultados da busca</h2>
              <p className="text-gray-500 font-medium text-sm mt-1">{filteredAds.length} anúncios encontrados</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
          ) : filteredAds.length === 0 ? (
            <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100">
               <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4"><Search size={40} /></div>
               <h3 className="text-xl font-black text-gray-800 mb-2">Nenhum resultado</h3>
               <p className="text-gray-500 mb-6 max-w-md mx-auto">Não encontramos anúncios com os filtros selecionados. Tente usar termos diferentes ou limpar os filtros.</p>
               <button onClick={clearFilters} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition shadow-md">
                  Limpar todos os filtros
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              {filteredAds.map((ad) => (
                <Link href={`/anuncio/${ad.id}`} key={ad.id} className={`group bg-white rounded-xl md:rounded-2xl border hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col shadow-sm relative ${ad.planoId > 0 ? 'border-primary/30 shadow-[0_4px_20px_rgba(76,29,149,0.05)]' : 'border-gray-100'}`}>
                  
                  {ad.planoId > 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-md z-10 flex items-center gap-1">
                      <Sparkles size={10}/> Patrocinado
                    </div>
                  )}

                  <div className="aspect-square bg-gray-50 overflow-hidden relative border-b border-gray-50">
                     {ad.imagemUrl ? (
                        <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
                     )}
                  </div>
                  
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded w-fit mb-2">
                      {ad.categoria}
                    </span>
                    <h3 className="text-xs md:text-sm text-gray-700 line-clamp-2 mb-1.5 md:mb-2 h-8 md:h-10 font-bold group-hover:text-primary transition-colors leading-snug">{ad.titulo}</h3>
                    
                    <p className="text-lg md:text-xl font-black text-primary mt-auto">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                    </p>
                    
                    <div className="mt-2 md:mt-3 pt-2 text-[9px] md:text-[10px] text-gray-400 flex justify-between uppercase font-black tracking-wider border-t border-gray-50">
                      <span>Hoje</span>
                      <span className="flex items-center gap-0.5 truncate max-w-[60%]">
                         <MapPin size={10} className="text-accent shrink-0"/> 
                         <span className="truncate">{ad.cidade || ad.localizacao || 'Piauí'}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// O Next.js exige que qualquer página que leia a URL (useSearchParams) seja empacotada no Suspense
export default function TodosAnunciosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <SearchContent />
    </Suspense>
  )
}