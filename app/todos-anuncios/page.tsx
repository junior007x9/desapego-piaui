'use client'
import { useState, useEffect, Suspense } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, MapPin, X, ShoppingBag } from 'lucide-react'

const CATEGORIAS = ["Todas", "Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]

function ConteudoAnuncios() {
  const searchParams = useSearchParams()
  // Pega o termo "q" ou a categoria "cat" que vieram da Home
  const queryBusca = searchParams.get('q')
  const queryCategoria = searchParams.get('cat')

  const [allAds, setAllAds] = useState<any[]>([])
  const [filteredAds, setFilteredAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [busca, setBusca] = useState(queryBusca || '')
  const [categoria, setCategoria] = useState(queryCategoria || 'Todas')
  const [ordem, setOrdem] = useState('recentes')

  // Se a URL mudar de repente, atualizamos o estado
  useEffect(() => {
    if (queryBusca) setBusca(queryBusca)
    if (queryCategoria) setCategoria(queryCategoria)
  }, [queryBusca, queryCategoria])

  useEffect(() => {
    async function fetchAds() {
      try {
        const q = query(collection(db, 'anuncios'), where('status', 'in', ['ativo', 'pagamento_pendente'])); 
        const snapshot = await getDocs(q);
        
        const data: any[] = [];
        snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        
        setAllAds(data);
      } catch (error) {
        console.error("Erro ao carregar anúncios:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAds()
  }, [])

  useEffect(() => {
    let result = [...allAds];

    if (busca.trim()) {
      result = result.filter(ad => ad.titulo.toLowerCase().includes(busca.toLowerCase()));
    }

    if (categoria !== 'Todas') {
      result = result.filter(ad => ad.categoria === categoria);
    }

    if (ordem === 'menor_preco') {
      result.sort((a, b) => a.preco - b.preco);
    } else if (ordem === 'maior_preco') {
      result.sort((a, b) => b.preco - a.preco);
    } else {
      result.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
    }

    setFilteredAds(result);
  }, [busca, categoria, ordem, allAds])

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
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <select 
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-full outline-none text-sm font-bold text-gray-700 cursor-pointer focus:border-purple-500"
                value={ordem}
                onChange={(e) => setOrdem(e.target.value)}
              >
                <option value="recentes">Mais Recentes</option>
                <option value="menor_preco">Menor Preço</option>
                <option value="maior_preco">Maior Preço</option>
              </select>
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
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          {loading ? 'Buscando...' : `${filteredAds.length} resultados encontrados`}
        </h1>

        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => (
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
             <Filter size={48} className="mx-auto text-purple-300 mb-4" />
             <h3 className="text-xl font-bold text-gray-800">Nenhum anúncio encontrado</h3>
             <p className="text-gray-500 mt-2">Tente mudar os termos da busca ou a categoria.</p>
             <button onClick={() => {setBusca(''); setCategoria('Todas'); router.replace('/todos-anuncios')}} className="mt-4 text-purple-600 font-bold hover:underline">
               Limpar filtros
             </button>
           </div>
        ) : (
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
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">
                         {ad.categoria}
                       </span>
                    </div>
                    <h3 className="text-gray-800 font-medium line-clamp-2 mb-2 group-hover:text-purple-600 transition leading-tight">
                      {ad.titulo}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <p className="text-xl font-bold text-purple-600">
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
        )}
      </div>
    </div>
  )
}

// O componente de Suspense exigido pela Vercel para ler a URL
export default function TodosAnunciosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-purple-600 font-bold animate-pulse">Carregando...</div>}>
      <ConteudoAnuncios />
    </Suspense>
  )
}