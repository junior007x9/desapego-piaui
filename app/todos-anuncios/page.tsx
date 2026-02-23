'use client'
import { useState, useEffect, Suspense } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Filter, MapPin, X, ShoppingBag, ChevronDown, Loader2 } from 'lucide-react'

const CATEGORIAS = ["Todas", "Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]
const ITENS_POR_PAGINA = 8 // Definimos um limite pequeno para testar o botão facilmente

function ConteudoAnuncios() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const queryBusca = searchParams.get('q')
  const queryCategoria = searchParams.get('cat')

  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null) // Guarda a posição do último anúncio carregado
  const [hasMore, setHasMore] = useState(true) // Indica se ainda há anúncios para carregar
  
  const [busca, setBusca] = useState(queryBusca || '')
  const [categoria, setCategoria] = useState(queryCategoria || 'Todas')
  const [ordem, setOrdem] = useState('recentes')

  useEffect(() => {
    if (queryBusca) setBusca(queryBusca)
    if (queryCategoria) setCategoria(queryCategoria)
  }, [queryBusca, queryCategoria])

  // Função para buscar anúncios (Inicial ou Próxima Página)
  const fetchAds = async (isFirstLoad = true) => {
    if (isFirstLoad) setLoading(true)
    else setLoadingMore(true)

    try {
      let q = query(
        collection(db, 'anuncios'),
        where('status', '==', 'ativo'),
        orderBy('criadoEm', 'desc'),
        limit(ITENS_POR_PAGINA)
      )

      // Se não for a primeira carga, começa depois do último documento
      if (!isFirstLoad && lastDoc) {
        q = query(q, startAfter(lastDoc))
      }

      const snapshot = await getDocs(q)
      const data: any[] = []
      
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }))

      if (isFirstLoad) {
        setAds(data)
      } else {
        setAds(prev => [...prev, ...data])
      }

      // Atualiza o último documento para a próxima busca
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
      
      // Se vieram menos itens que o limite, significa que acabou
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

  // Carrega os anúncios ao iniciar ou mudar filtros
  useEffect(() => {
    fetchAds(true)
  }, [categoria]) // Recarrega quando a categoria muda

  // Filtro de busca local (para não gastar leituras de banco em cada letra digitada)
  const filteredAds = ads.filter(ad => 
    ad.titulo.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
              <input 
                type="text" 
                placeholder="O que você está procurando?" 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-full outline-none transition"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIAS.map((cat) => (
              <button key={cat} onClick={() => setCategoria(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition ${
                  categoria === cat 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-600 hover:text-purple-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-tight">
          {loading ? 'Buscando...' : `Explorar Anúncios`}
        </h1>

        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1,2,3,4,5,6,7,8].map(i => (
               <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100">
                 <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                 <div className="p-4 space-y-3">
                   <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                   <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                 </div>
               </div>
             ))}
           </div>
        ) : filteredAds.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
             <ShoppingBag size={48} className="mx-auto text-purple-300 mb-4" />
             <h3 className="text-xl font-bold text-gray-800">Nenhum anúncio aqui ainda</h3>
             <p className="text-gray-500 mt-2">Seja o primeiro a anunciar nesta categoria!</p>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAds.map((ad) => (
                <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group">
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col">
                    <div className="h-52 overflow-hidden bg-gray-100 relative">
                       {ad.imagemUrl ? (
                          <img src={ad.imagemUrl} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={40}/></div>
                       )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-gray-800 font-bold line-clamp-2 mb-2 group-hover:text-purple-600 transition leading-tight">
                        {ad.titulo}
                      </h3>
                      <div className="mt-auto pt-4 border-t border-gray-50">
                        <p className="text-xl font-black text-purple-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                           <MapPin size={12} /> Teresina, PI
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* BOTÃO CARREGAR MAIS */}
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => fetchAds(false)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 bg-white border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-purple-600 hover:text-white transition-all shadow-md disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Carregar mais anúncios
                      <ChevronDown size={20} />
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-purple-600 font-bold animate-pulse">Carregando...</div>}>
      <ConteudoAnuncios />
    </Suspense>
  )
}