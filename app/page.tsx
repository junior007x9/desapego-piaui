'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ShoppingBag, Car, Home as HomeIcon, Smartphone, Watch, Laptop, Zap } from 'lucide-react'

const CATEGORIAS_OLX = [
  { nome: 'Imóveis', icon: <HomeIcon size={28} />, slug: 'Imóveis' },
  { nome: 'Veículos', icon: <Car size={28} />, slug: 'Veículos' },
  { nome: 'Eletrônicos', icon: <Smartphone size={28} />, slug: 'Eletrônicos' },
  { nome: 'Casa', icon: <Zap size={28} />, slug: 'Para Casa' },
  { nome: 'Moda', icon: <Watch size={28} />, slug: 'Moda e Beleza' },
  { nome: 'Outros', icon: <ShoppingBag size={28} />, slug: 'Outros' },
]

export default function Home() {
  const [ads, setAds] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchRecentAds() {
      try {
        const q = query(collection(db, 'anuncios'), orderBy('criadoEm', 'desc'), limit(20))
        const snap = await getDocs(q)
        
        const list: any[] = []
        snap.forEach(doc => {
          const data = doc.data()
          if (data.status === 'ativo') {
            list.push({ id: doc.id, ...data })
          }
        })
        
        setAds(list.slice(0, 8))
      } catch (error) {
        console.error("Erro ao carregar os anúncios na Home:", error)
      }
    }
    fetchRecentAds()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (busca.trim()) router.push(`/todos-anuncios?q=${busca}`)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* HEADER DE BUSCA - Fundo Roxo Escuro */}
      <div className="bg-primary py-10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-white text-3xl md:text-4xl font-black mb-6">O que você está procurando hoje?</h1>
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Ex: iPhone, Carro, Casa..." 
              className="w-full p-4 md:p-5 rounded-full shadow-xl outline-none text-lg pl-14 text-gray-800"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={28} />
            {/* Botão de Pesquisar - Roxo Claro */}
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent text-white px-6 py-2 rounded-full font-bold hover:bg-accent-dark transition hidden md:block">
              Pesquisar
            </button>
          </form>
        </div>
      </div>

      {/* CATEGORIAS */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="container mx-auto px-4 py-8 flex justify-between gap-6 min-w-max">
          {CATEGORIAS_OLX.map((cat) => (
            <Link key={cat.nome} href={`/todos-anuncios?cat=${cat.slug}`} className="flex flex-col items-center group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-all mb-2 border border-transparent group-hover:border-primary/20">
                {cat.icon}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary">{cat.nome}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ANÚNCIOS RECENTES */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">Destaques em Teresina</h2>
          {/* Link Ver Todos - Roxo Claro */}
          <Link href="/todos-anuncios" className="text-accent font-bold hover:text-accent-dark hover:underline">Ver todos</Link>
        </div>

        {ads.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Nenhum anúncio ativo encontrado. Crie um anúncio e confirme o pagamento para aparecer aqui!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {ads.map((ad) => (
              <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden flex flex-col">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="text-sm text-gray-700 line-clamp-2 mb-2 h-10 font-medium group-hover:text-primary transition-colors">{ad.titulo}</h3>
                  <p className="text-xl font-black text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                  </p>
                  <div className="mt-auto pt-3 text-[10px] text-gray-400 flex justify-between uppercase font-bold tracking-widest">
                    <span>Hoje</span>
                    <span className="flex items-center gap-1"><MapPin size={10} className="text-accent"/> Teresina</span>
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