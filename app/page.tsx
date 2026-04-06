'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, MapPin, ShoppingBag, Car, Home as HomeIcon, Smartphone, Watch, Zap, Sparkles, Loader2 } from 'lucide-react'

// Categorias com a nova identidade visual (cores dinâmicas) e mantendo os seus slugs!
const CATEGORIAS_OLX = [
  { nome: 'Imóveis', icon: <HomeIcon size={28} strokeWidth={2.5} />, slug: 'Imóveis', cor: "bg-blue-100 text-blue-600" },
  { nome: 'Veículos', icon: <Car size={28} strokeWidth={2.5} />, slug: 'Veículos', cor: "bg-orange-100 text-orange-600" },
  { nome: 'Celulares', icon: <Smartphone size={28} strokeWidth={2.5} />, slug: 'Eletrônicos', cor: "bg-purple-100 text-purple-600" },
  { nome: 'Casa', icon: <Zap size={28} strokeWidth={2.5} />, slug: 'Para Casa', cor: "bg-amber-100 text-amber-600" },
  { nome: 'Moda', icon: <Watch size={28} strokeWidth={2.5} />, slug: 'Moda e Beleza', cor: "bg-pink-100 text-pink-600" },
  { nome: 'Outros', icon: <ShoppingBag size={28} strokeWidth={2.5} />, slug: 'Outros', cor: "bg-gray-100 text-gray-600" },
]

export default function Home() {
  const [ads, setAds] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [userCity, setUserCity] = useState('sua região') 
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // MÁGICA DE PERFORMANCE: Verifica se a cidade já está salva no telemóvel para a mensagem de Boas Vindas
  useEffect(() => {
    async function fetchCity() {
      const cachedCity = localStorage.getItem('user_city');
      if (cachedCity) {
        setUserCity(cachedCity);
        return;
      }

      try {
        const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=pt');
        const data = await res.json();
        const city = data.city || data.locality || 'Teresina';
        
        setUserCity(city);
        localStorage.setItem('user_city', city);
      } catch (error) {
        setUserCity('Teresina');
      }
    }
    fetchCity();
  }, []);

  // Lógica inteligente de busca e verificação de expiração
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

          if (data.expiraEm) {
            const dataExpiracao = new Date(data.expiraEm);
            if (dataExpiracao < agora && statusFinal === 'ativo') {
               statusFinal = 'expirado';
               updateDoc(doc(db, 'anuncios', document.id), { status: 'expirado' }).catch(console.error);
            }
          }

          if (statusFinal === 'ativo') {
            list.push({ id: document.id, ...data })
          }
        }
        
        // Puxa os destaques (Planos pagos) para cima
        list.sort((a, b) => (b.planoId || 0) - (a.planoId || 0))
        
        setAds(list.slice(0, 8))
      } catch (error) {
        console.error("Erro ao buscar anúncios recentes:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecentAds()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (busca.trim()) router.push(`/todos-anuncios?q=${encodeURIComponent(busca)}`)
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10">
      
      {/* HERO SECTION PREMIUM */}
      <div className="bg-primary pt-12 pb-24 px-4 rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            O que você está procurando no <span className="text-accent underline decoration-4 underline-offset-4">Piauí?</span>
          </h1>
          {/* AQUI DEIXAMOS O userCity PARA A MENSAGEM DO BANNER (Ex: "Compre e venda em Timon") */}
          <p className="text-primary-100 font-medium mb-8 text-sm md:text-lg">Compre e venda de forma rápida, fácil e segura em {userCity}.</p>
          
          <form onSubmit={handleSearch} className="flex bg-white p-2 md:p-2 rounded-full md:rounded-2xl shadow-xl max-w-2xl mx-auto focus-within:ring-4 focus-within:ring-accent/50 transition-all">
            <div className="hidden md:flex items-center pl-4 text-gray-400"><Search size={24} /></div>
            <input 
              type="text" 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder={`Buscar em ${userCity}...`} 
              className="w-full py-3 md:py-4 px-6 md:px-4 outline-none text-gray-800 font-medium text-base md:text-lg bg-transparent rounded-l-full md:rounded-l-none"
            />
            <button type="submit" className="bg-accent hover:bg-accent-dark text-white font-black px-6 md:px-10 py-3 md:py-4 rounded-full md:rounded-xl transition-colors shadow-sm flex items-center gap-2">
              <Search className="md:hidden" size={20} /> <span className="hidden md:inline">Pesquisar</span>
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
        
        {/* CATEGORIAS FLUTUANTES */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-10 overflow-x-auto scrollbar-hide">
          <div className="flex md:grid md:grid-cols-6 gap-4 min-w-max md:min-w-0 px-2 justify-between">
            {CATEGORIAS_OLX.map(cat => (
              <Link href={`/todos-anuncios?categoria=${cat.slug}`} key={cat.nome} className="flex flex-col items-center gap-2 group cursor-pointer w-20 md:w-auto">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${cat.cor} group-hover:scale-110 transition-transform shadow-sm`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-gray-700 text-center">{cat.nome}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* VITRINE DE ANÚNCIOS */}
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              <Sparkles className="text-accent hidden md:block"/> Destaques
           </h2>
           <Link href="/todos-anuncios" className="text-primary font-bold hover:underline text-sm md:text-base bg-primary/10 px-4 py-2 rounded-full transition-colors hover:bg-primary/20">
             Ver todos
           </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={48} /></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium text-lg bg-white rounded-2xl border border-gray-100 shadow-sm">
             <ShoppingBag size={48} className="mx-auto mb-3 opacity-30 text-primary" />
             Nenhum anúncio encontrado.<br/>
             <Link href="/anunciar" className="text-primary hover:underline font-bold mt-2 inline-block">Seja o primeiro a anunciar!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {ads.map((ad) => (
              <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group bg-white rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col shadow-sm relative">
                
                {/* Selo de Destaque para quem pagou */}
                {ad.planoId > 0 && (
                  <div className="absolute top-2 left-2 bg-accent text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-md z-10 flex items-center gap-1">
                    <Sparkles size={10}/> Destaque
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
                  
                  {/* AQUI FOI CORRIGIDO! Trocamos {userCity} pela localização real do anúncio */}
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
  )
}