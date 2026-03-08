'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ShoppingBag, Car, Home as HomeIcon, Smartphone, Watch, Zap } from 'lucide-react'

const CATEGORIAS_OLX = [
  { nome: 'Imóveis', icon: <HomeIcon size={24} />, slug: 'Imóveis' },
  { nome: 'Veículos', icon: <Car size={24} />, slug: 'Veículos' },
  { nome: 'Celulares', icon: <Smartphone size={24} />, slug: 'Eletrônicos' },
  { nome: 'Casa', icon: <Zap size={24} />, slug: 'Para Casa' },
  { nome: 'Moda', icon: <Watch size={24} />, slug: 'Moda e Beleza' },
  { nome: 'Outros', icon: <ShoppingBag size={24} />, slug: 'Outros' },
]

export default function Home() {
  const [ads, setAds] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [userCity, setUserCity] = useState('sua região') 
  const router = useRouter()

  // MÁGICA: Pega a cidade para exibir nas buscas e anúncios
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
    async function fetchRecentAds() {
      try {
        const q = query(collection(db, 'anuncios'), orderBy('criadoEm', 'desc'), limit(20))
        const snap = await getDocs(q)
        const list: any[] = []
        const agora = new Date()

        for (const document of snap.docs) {
          const data = document.data()
          let statusFinal = data.status

          // LÓGICA DE EXPIRAÇÃO AUTOMÁTICA NA HOME
          if (data.expiraEm) {
            const dataExpiracao = new Date(data.expiraEm);
            if (dataExpiracao < agora && statusFinal === 'ativo') {
               statusFinal = 'expirado';
               updateDoc(doc(db, 'anuncios', document.id), { status: 'expirado' }).catch(console.error);
            }
          }

          // Só adiciona na lista se estiver ativo!
          if (statusFinal === 'ativo') {
            list.push({ id: document.id, ...data })
          }
        }
        
        // Pega apenas os 8 primeiros ativos para a vitrine
        setAds(list.slice(0, 8))
      } catch (error) {
        console.error("Erro ao buscar anúncios recentes:", error)
      }
    }
    fetchRecentAds()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (busca.trim()) router.push(`/todos-anuncios?q=${busca}`)
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-10">
      
      {/* BARRA DE BUSCA */}
      <div className="bg-white md:bg-primary px-4 py-3 md:py-10 border-b md:border-none shadow-sm md:shadow-none">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="hidden md:block text-white text-3xl md:text-4xl font-black mb-6">O que você está procurando hoje?</h1>
          <form onSubmit={handleSearch} className="relative w-full">
            <input 
              type="text" 
              placeholder={`Buscar em ${userCity}...`} 
              className="w-full p-3 md:p-5 bg-gray-100 md:bg-white rounded-full md:shadow-xl outline-none text-base pl-12 md:pl-14 pr-4 md:pr-40 text-gray-800 focus:ring-2 focus:ring-accent md:focus:ring-primary/50 transition-all font-medium"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-primary/40 md:text-primary" size={24} />
            <button type="submit" className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-accent text-white px-6 py-2 md:py-3 rounded-full font-bold hover:bg-accent-dark transition-colors hidden md:block shadow-md">
              Pesquisar
            </button>
          </form>
        </div>
      </div>

      {/* CATEGORIAS */}
      <div className="bg-white pb-6 pt-4 w-full border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-2">
          <div className="flex overflow-x-auto gap-3 md:gap-6 px-2 no-scrollbar scrollbar-hide items-start md:justify-center">
            {CATEGORIAS_OLX.map((cat) => (
              <Link key={cat.nome} href={`/todos-anuncios?cat=${cat.slug}`} className="flex flex-col items-center group shrink-0 w-[68px] md:w-[80px]">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all mb-1.5 shadow-sm transform group-hover:scale-105">
                  {cat.icon}
                </div>
                <span className="text-[11px] md:text-sm font-bold text-gray-500 text-center leading-tight group-hover:text-primary transition-colors">{cat.nome}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ANÚNCIOS RECENTES */}
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-12">
        <div className="flex justify-between items-end mb-4 md:mb-8 px-1">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight uppercase">Destaques</h2>
          <Link href="/todos-anuncios" className="text-accent text-[13px] md:text-base font-bold hover:text-accent-dark hover:underline transition-colors">Ver todos</Link>
        </div>

        {ads.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium text-lg bg-white rounded-2xl border border-gray-100 shadow-sm">
             <ShoppingBag size={48} className="mx-auto mb-3 opacity-30 text-primary" />
             Nenhum anúncio encontrado.<br/>
             <Link href="/anunciar" className="text-primary hover:underline font-bold mt-2 inline-block">Seja o primeiro a anunciar!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {ads.map((ad) => (
              <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group bg-white rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col shadow-sm">
                
                <div className="aspect-square bg-gray-50 overflow-hidden relative border-b border-gray-50">
                   {ad.imagemUrl ? (
                      <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
                   )}
                </div>
                
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <h3 className="text-xs md:text-sm text-gray-700 line-clamp-2 mb-1.5 md:mb-2 h-8 md:h-10 font-bold group-hover:text-primary transition-colors leading-snug">{ad.titulo}</h3>
                  <p className="text-lg md:text-xl font-black text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                  </p>
                  
                  <div className="mt-auto pt-2 md:pt-3 text-[9px] md:text-[10px] text-gray-400 flex justify-between uppercase font-black tracking-wider border-t border-gray-50">
                    <span>Hoje</span>
                    <span className="flex items-center gap-0.5 truncate max-w-[60%]">
                       <MapPin size={10} className="text-accent shrink-0"/> <span className="truncate">{userCity}</span>
                    </span>
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