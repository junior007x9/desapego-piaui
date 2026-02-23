'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, ShoppingBag, Car, Home as HomeIcon, Smartphone, ChevronRight, Search } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'

interface Ad {
  id: string
  titulo: string
  preco: number
  categoria: string
  imagemUrl?: string
  criadoEm?: any
}

export default function Home() {
  const router = useRouter()
  const [recentAds, setRecentAds] = useState<Ad[]>([])
  const [location, setLocation] = useState<string>("Localizando...")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("") // NOVO: Guarda o que o usuário digita

  // NOVO: Função que dispara ao apertar Enter na pesquisa
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/todos-anuncios?q=${encodeURIComponent(searchTerm)}`)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
      const timeStr = now.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })
      setCurrentTime(`${dateStr} • ${timeStr}`)
    }, 1000)

    async function fetchAds() {
      try {
        const q = query(
          collection(db, 'anuncios'), 
          orderBy('criadoEm', 'desc'), 
          limit(6)
        );
        
        const querySnapshot = await getDocs(q);
        const data: Ad[] = [];
        
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as Ad);
        });

        setRecentAds(data);
      } catch (error) {
        console.error("Erro ao carregar anúncios:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAds()
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await res.json()
          const city = data.address.city || data.address.town || "Piauí"
          setLocation(city)
        } catch { setLocation("Teresina") }
      }, () => setLocation("Piauí"))
    }
  }, [])

  return (
    <div className="flex flex-col w-full">
      
      {/* --- SEÇÃO HERO --- */}
      <section className="relative h-[650px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600">
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <video autoPlay loop muted className="w-full h-full object-cover">
            <source src="/video/videodesa.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-4 border border-white/30">
            O MAIOR CLASSIFICADO DO PIAUÍ
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-xl leading-tight">
            Desapega que vem<br />
            <span className="text-yellow-300">Outro e Pega!</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
            Compre, venda e negocie com facilidade.
          </p>

          {/* NOVA BARRA DE PESQUISA */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8 relative">
            <input 
              type="text" 
              placeholder="O que você está procurando? (Ex: iPhone, Carro...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-6 pr-16 py-4 rounded-full text-gray-900 focus:outline-none shadow-2xl focus:ring-4 focus:ring-yellow-400 text-lg"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full transition shadow-md">
              <Search size={24} />
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/anunciar" className="w-full sm:w-auto px-8 py-4 bg-yellow-400 text-purple-900 rounded-full font-bold hover:bg-yellow-300 transition shadow-lg transform hover:-translate-y-1">
              Quero Anunciar Grátis
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 inline-flex flex-wrap gap-6 justify-center text-sm">
             <div className="flex items-center gap-2">
               <MapPin className="text-yellow-400 w-4 h-4" /> {location}
             </div>
             <div className="hidden md:flex items-center gap-2 border-l border-white/20 pl-6">
               <Clock className="text-yellow-400 w-4 h-4" /> {currentTime}
             </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg className="relative block w-[calc(100%+1.3px)] h-[50px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-gray-100"></path>
          </svg>
        </div>
      </section>

      {/* --- SEÇÃO CATEGORIAS --- */}
      <section className="py-10 bg-gray-100 -mt-2 relative z-20">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { name: 'Imóveis', icon: HomeIcon, color: 'bg-blue-100 text-blue-600' },
                    { name: 'Veículos', icon: Car, color: 'bg-orange-100 text-orange-600' },
                    { name: 'Eletrônicos', icon: Smartphone, color: 'bg-purple-100 text-purple-600' },
                    { name: 'Para Casa', icon: ShoppingBag, color: 'bg-green-100 text-green-600' },
                ].map((cat) => (
                    <div key={cat.name} onClick={() => router.push(`/todos-anuncios?cat=${cat.name}`)} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-lg ${cat.color} group-hover:scale-110 transition`}>
                                <cat.icon size={24} />
                            </div>
                            <span className="font-bold text-gray-700">{cat.name}</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-purple-600" />
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- SEÇÃO ANÚNCIOS RECENTES --- */}
      <section id="recent-ads" className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-3xl font-bold text-purple-900">Destaques Recentes</h2>
                <p className="text-gray-500">O que o pessoal está desapegando hoje.</p>
            </div>
            <Link href="/todos-anuncios" className="hidden md:flex text-purple-600 font-bold hover:underline items-center gap-1">
                Ver tudo <ChevronRight size={16}/>
            </Link>
          </div>

          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAds.length > 0 ? (
                recentAds.map((ad) => (
                  <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group">
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col">
                      <div className="h-56 overflow-hidden bg-gray-200 relative">
                         {ad.imagemUrl ? (
                            <img src={ad.imagemUrl} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                <ShoppingBag size={40} opacity={0.2} />
                            </div>
                         )}
                         <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4">
                             <span className="text-white font-bold text-lg">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                             </span>
                         </div>
                      </div>
                      
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-gray-800 font-medium line-clamp-2 mb-2 group-hover:text-purple-600 transition">{ad.titulo}</h3>
                        <div className="mt-auto flex justify-between items-center text-xs text-gray-400">
                            <span>{ad.categoria}</span>
                            <span>Recente</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Ainda não temos anúncios hoje.</p>
                  <Link href="/anunciar" className="text-purple-600 font-bold hover:underline mt-2 inline-block">Seja o primeiro!</Link>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/todos-anuncios" className="w-full py-3 rounded-lg block bg-purple-600 hover:bg-purple-700 text-white font-bold transition">Ver Tudo</Link>
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-20 bg-purple-800 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cube-coat.png')] opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
              <h2 className="text-3xl font-bold mb-4">Tem algo parado em casa?</h2>
              <p className="mb-8 text-purple-200">Transforme coisas que você não usa mais em dinheiro no bolso agora mesmo.</p>
              <Link href="/anunciar" className="inline-flex items-center gap-2 bg-white text-purple-800 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
                  <ShoppingBag size={20}/> Começar a Vender
              </Link>
          </div>
      </section>
    </div>
  )
}