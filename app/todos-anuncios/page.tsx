'use client'
import { useState, useEffect, Suspense } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, MapPin, X, ShoppingBag, ChevronDown, Loader2 } from 'lucide-react'

const CATEGORIAS = ["Todas", "Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]
const ITENS_POR_PAGINA = 8 

function ConteudoAnuncios() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const queryBusca = searchParams.get('q')
  const queryCategoria = searchParams.get('cat')

  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null) 
  const [hasMore, setHasMore] = useState(true) 
  
  const [busca, setBusca] = useState(queryBusca || '')
  const [categoria, setCategoria] = useState(queryCategoria || 'Todas')
  const [userCity, setUserCity] = useState('sua região') // Localização dinâmica

  // Pega a cidade de forma invisível
  useEffect(() => {
    async function fetchCity() {
      try {
        const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=pt');
        const data = await res.json();
        setUserCity(data.city || data.locality || 'Teresina');
      } catch (error) {
        setUserCity('Teresina');
      }
    }
    fetchCity();
  }, []);

  useEffect(() => {
    if (queryBusca) setBusca(queryBusca)
    if (queryCategoria) setCategoria(queryCategoria)
  }, [queryBusca, queryCategoria])

  const fetchAds = async (isFirstLoad = true) => {
    if (isFirstLoad) setLoading(true)
    else setLoadingMore(true)

    try {
      let q;

      if (categoria !== 'Todas') {
         if (!isFirstLoad && lastDoc) {
             q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'), where('categoria', '==', categoria), orderBy('criadoEm', 'desc'), startAfter(lastDoc), limit(ITENS_POR_PAGINA));
         } else {
             q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'), where('categoria', '==', categoria), orderBy('criadoEm', 'desc'), limit(ITENS_POR_PAGINA));
         }
      } else {
         if (!isFirstLoad && lastDoc) {
             q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'), orderBy('criadoEm', 'desc'), startAfter(lastDoc), limit(ITENS_POR_PAGINA));
         } else {
             q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'), orderBy('criadoEm', 'desc'), limit(ITENS_POR_PAGINA));
         }
      }

      const snapshot = await getDocs(q)
      const data: any[] = []
      
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }))

      if (isFirstLoad) {
        setAds(data)
      } else {
        setAds(prev => [...prev, ...data])
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      
      if (snapshot.docs.length < ITENS_POR_PAGINA) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

    } catch (error) {
      console.error("Erro ao carregar anúncios:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchAds(true)
  }, [categoria]) 

  const filteredAds = ads.filter(ad => 
    ad.titulo.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-10">
      
      {/* BARRA SUPERIOR E FILTROS */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
              <input 
                type="text" 
                placeholder={`Buscar em ${userCity}...`} 
                className="w-full pl-12 pr-10 py-3 md:py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-full outline-none transition-all font-medium text-gray-800"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2.5 mt-4 overflow-x-auto pb-2 no-scrollbar scrollbar-hide items-center">
            {CATEGORIAS.map((cat) => (
              <button key={cat} onClick={() => setCategoria(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] md:text-sm font-bold transition-all ${
                  categoria === cat 
                    ? 'bg-primary text-white shadow-md scale-105' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <h1 className="text-lg md:text-xl font-black text-gray-800 mb-4 md:mb-6 uppercase tracking-tight ml-1">
          {loading ? 'Buscando...' : `Explorar ${categoria === 'Todas' ? 'Anúncios' : categoria}`}
        </h1>

        {loading ? (
           // SKELETON (Carregamento animado agora com 2 colunas no mobile)
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
             {[1,2,3,4,5,6,7,8].map(i => (
               <div key={i} className="bg-white rounded-xl md:rounded-2xl h-60 md:h-80 animate-pulse border border-gray-100">
                 <div className="h-32 md:h-48 bg-gray-100 rounded-t-xl md:rounded-t-2xl"></div>
                 <div className="p-3 md:p-4 space-y-3">
                   <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                   <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                 </div>
               </div>
             ))}
           </div>
        ) : filteredAds.length === 0 ? (
           <div className="text-center py-16 md:py-20 bg-white rounded-2xl shadow-sm border border-gray-100 mt-4">
             <ShoppingBag size={56} className="mx-auto text-primary/30 mb-4" />
             <h3 className="text-xl font-black text-gray-800">Nenhum anúncio encontrado</h3>
             <p className="text-gray-500 mt-2 font-medium px-4">Tente buscar por outras palavras ou mude a categoria.</p>
             <button onClick={() => {setBusca(''); setCategoria('Todas');}} className="mt-6 text-primary font-bold hover:underline bg-primary/10 px-6 py-2 rounded-full">Limpar Filtros</button>
           </div>
        ) : (
          <>
            {/* GRID DE ANÚNCIOS (2 colunas no celular, 4 no PC) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {filteredAds.map((ad) => (
                <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group flex flex-col h-full bg-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
                  
                  <div className="h-32 md:h-52 overflow-hidden bg-gray-50 relative border-b border-gray-50">
                     {ad.imagemUrl ? (
                        <img src={ad.imagemUrl} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
                     )}
                  </div>
                  
                  <div className="p-3 md:p-4 flex flex-col flex-1">
                    <h3 className="text-xs md:text-sm text-gray-800 font-bold line-clamp-2 mb-1.5 md:mb-2 group-hover:text-primary transition-colors leading-snug">
                      {ad.titulo}
                    </h3>
                    <div className="mt-auto pt-2 md:pt-4 border-t border-gray-50">
                      <p className="text-base md:text-xl font-black text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] md:text-xs text-gray-400 mt-1.5 md:mt-2 font-bold uppercase tracking-wider">
                         <MapPin size={10} className="text-accent shrink-0" /> <span className="truncate">{userCity}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* BOTÃO CARREGAR MAIS */}
            {hasMore && (
              <div className="mt-8 md:mt-12 flex justify-center">
                <button 
                  onClick={() => fetchAds(false)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 bg-white border-2 border-primary text-primary px-8 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-all shadow-sm disabled:opacity-50 transform hover:-translate-y-0.5"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Carregar mais
                      <ChevronDown size={20} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function TodosAnunciosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary font-bold animate-pulse text-lg">Preparando vitrine...</div>}>
      <ConteudoAnuncios />
    </Suspense>
  )
}