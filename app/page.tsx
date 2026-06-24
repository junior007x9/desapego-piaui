'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, MapPin, ShoppingBag, Car, Home as HomeIcon, Smartphone, 
  Zap, Sparkles, Wrench, Baby, Bike, Briefcase, Shirt, ChevronRight, Heart, Rocket, Flame, Download, X, Coins
} from 'lucide-react'
import ContadorEstatisticas from '@/components/ContadorEstatisticas'
// import AdBanner from '@/components/AdBanner' // 🚀 ADSENSE REMOVIDO TEMPORARIAMENTE

const CATEGORIAS_HOME = [
  { nome: 'Imóveis', slug: 'Imóveis', icon: <HomeIcon size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-blue-50 to-blue-100 border-blue-200 text-blue-600" },
  { nome: 'Veículos', slug: 'Veículos', icon: <Car size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-orange-50 to-orange-100 border-orange-200 text-orange-600" },
  { nome: 'Celulares', slug: 'Eletrônicos', icon: <Smartphone size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-purple-50 to-purple-100 border-purple-200 text-purple-600" },
  { nome: 'Casa', slug: 'Para Casa', icon: <Zap size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-amber-50 to-amber-100 border-amber-200 text-amber-600" },
  { nome: 'Moda', slug: 'Moda e Beleza', icon: <Shirt size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-pink-50 to-pink-100 border-pink-200 text-pink-600" },
  { nome: 'Serviços', slug: 'Serviços', icon: <Wrench size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600" },
  { nome: 'Bebês', slug: 'Bebês e Crianças', icon: <Baby size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-rose-50 to-rose-100 border-rose-200 text-rose-600" },
  { nome: 'Esportes', slug: 'Esportes', icon: <Bike size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-teal-50 to-teal-100 border-teal-200 text-teal-600" },
  { nome: 'Empregos', slug: 'Vagas de Emprego', icon: <Briefcase size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-600" },
  { nome: 'Outros', slug: 'Outros', icon: <ShoppingBag size={24} strokeWidth={2.5} />, cores: "bg-gradient-to-b from-gray-50 to-gray-100 border-gray-300 text-gray-600" },
]

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

export default function Home() {
  const [ads, setAds] = useState<any[]>([])
  const [vipAds, setVipAds] = useState<any[]>([]) 
  const [storiesAds, setStoriesAds] = useState<any[]>([]) 
  const [busca, setBusca] = useState('')
  const [userCity, setUserCity] = useState('sua região') 
  const [loading, setLoading] = useState(true)
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const router = useRouter()

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

    const bannerClosed = localStorage.getItem('app_banner_closed');
    if (!bannerClosed) {
       setShowInstallBanner(true); 
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!bannerClosed) setShowInstallBanner(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        localStorage.setItem('app_banner_closed', 'true');
      }
      setDeferredPrompt(null);
    } else {
      alert("Para instalar:\n\n📱 No Android: Clique nos 3 pontinhos no navegador e escolha 'Adicionar à tela inicial'.\n\n🍏 No iPhone: Toque no botão de Compartilhar (quadrado com seta para cima) e selecione 'Adicionar à Tela de Início'.");
    }
  };

  const closeBanner = () => {
     setShowInstallBanner(false);
     localStorage.setItem('app_banner_closed', 'true');
  };

  useEffect(() => {
    async function fetchRecentAds() {
      try {
        const q = query(collection(db, 'anuncios'), orderBy('criadoEm', 'desc'), limit(300))
        const snap = await getDocs(q)
        
        const listGeral: any[] = []
        const listCarrosselOuro: any[] = []
        const listStoriesTurbo: any[] = []
        const agora = new Date()

        for (const document of snap.docs) {
          const data = document.data()
          let statusFinal = data.status
          let isExpired = false;
          const plano = Number(data.planoId) || 0;

          if (data.expiraEm) {
            const dataExpiracao = new Date(data.expiraEm);
            if (dataExpiracao < agora) isExpired = true;
          }

          if (isExpired && statusFinal === 'ativo') {
             statusFinal = 'expirado';
             updateDoc(doc(db, 'anuncios', document.id), { status: 'expirado' }).catch(console.error);
          }

          if (statusFinal === 'ativo') {
            const adFinal = { id: document.id, ...data, planoId: plano }
            
            listGeral.push(adFinal)

            if (plano === 3) {
              listCarrosselOuro.push(adFinal)
            } else if (plano === 2) {
              listStoriesTurbo.push(adFinal)
            }
          }
        }

        const getTempo = (ad: any) => ad.pagoEm ? new Date(ad.pagoEm).getTime() : (ad.criadoEm?.seconds * 1000 || 0);

        listCarrosselOuro.sort((a, b) => getTempo(b) - getTempo(a));
        listStoriesTurbo.sort((a, b) => getTempo(b) - getTempo(a));
        
        listGeral.sort((a, b) => {
          const planoA = Number(a.planoId) || 0;
          const planoB = Number(b.planoId) || 0;
          
          const pesoA = planoA === 3 ? 4 : (planoA === 2 ? 3 : (planoA === 1 ? 2 : 1));
          const pesoB = planoB === 3 ? 4 : (planoB === 2 ? 3 : (planoB === 1 ? 2 : 1));

          if (pesoA !== pesoB) {
             return pesoB - pesoA; 
          }
          return getTempo(b) - getTempo(a); 
        });
        
        setVipAds(listCarrosselOuro.slice(0, 15)) 
        setStoriesAds(listStoriesTurbo.slice(0, 20))
        setAds(listGeral.slice(0, 80)) 
      } catch (error) {
        console.error("Erro ao buscar anúncios:", error)
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

  // 🚀 COMPONENTE DE CARD ATUALIZADO (AGORA MOSTRA A DESCRIÇÃO!)
  const renderAdCard = (ad: any) => {
    const plano = Number(ad.planoId) || 0;
    const isOuro = plano === 3;
    const isTurbo = plano === 2; 
    const isSobe = plano === 1;

    return (
      <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group relative outline-none h-full flex flex-col">
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

            <div className="absolute top-2 right-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors shadow-sm">
              <Heart size={16} strokeWidth={2.5} />
            </div>

            <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative border-b border-gray-100">
               {ad.imagemUrl ? (
                  <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ad.titulo} />
               ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
               )}
            </div>
            
            <div className="p-3 md:p-4 flex flex-col flex-1">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mb-2">
                {ad.categoria}
              </span>
              <h3 className="text-xs md:text-sm text-gray-800 line-clamp-2 mb-1 font-semibold group-hover:text-primary transition-colors leading-snug">
                {ad.titulo}
              </h3>
              
              {/* 🚀 AQUI ENTRA O TEXTO DA DESCRIÇÃO PARA O GOOGLE LER! */}
              {ad.descricao && (
                <p className="text-[10px] md:text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed flex-1">
                  {ad.descricao}
                </p>
              )}
              
              <p className={`text-lg md:text-xl font-black mt-auto ${isOuro ? 'text-amber-600' : isTurbo ? 'text-purple-600' : isSobe ? 'text-blue-600' : 'text-gray-900'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
              </p>
              
              <div className="mt-3 pt-3 text-[10px] text-gray-400 flex justify-between font-medium border-t border-gray-50">
                <span>{ad.pagoEm ? formatTimeAgo(new Date(ad.pagoEm).getTime() / 1000) : (ad.criadoEm ? formatTimeAgo(ad.criadoEm.seconds) : 'Hoje')}</span>
                <span className="flex items-center gap-1 truncate max-w-[60%]">
                   <MapPin size={10} className="text-gray-300 shrink-0"/> 
                   <span className="truncate">{ad.cidade || ad.localizacao || 'Piauí'}</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </Link>
    )
  }

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse flex flex-col h-full">
      <div className="aspect-[4/3] bg-gray-200"></div>
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="h-3 bg-gray-200 rounded-full w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded-full w-full"></div>
        <div className="h-4 bg-gray-200 rounded-full w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded-md w-1/2 mt-auto"></div>
      </div>
    </div>
  )

  const adsOuro = ads.filter(a => Number(a.planoId) === 3);
  const adsTurbo = ads.filter(a => Number(a.planoId) === 2);
  const adsGerais = ads.filter(a => Number(a.planoId) !== 3 && Number(a.planoId) !== 2);

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10 font-sans">
      
      <div className="bg-gradient-to-br from-primary to-primary/90 pt-6 pb-24 md:pb-32 px-4 rounded-b-[2rem] md:rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          <ContadorEstatisticas />

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-3 md:mb-4 tracking-tight leading-tight mt-2">
            O que você está procurando no <span className="text-accent underline decoration-4 underline-offset-4">Piauí?</span>
          </h1>
          <p className="text-primary-100 font-medium mb-6 md:mb-8 text-sm md:text-lg px-2">
            O maior marketplace local. Compre e venda de forma segura em {userCity}.
          </p>
          
          <form onSubmit={handleSearch} className="flex bg-white p-1.5 md:p-2 rounded-2xl shadow-xl max-w-2xl mx-auto focus-within:ring-4 focus-within:ring-accent/50 transition-all border border-white mb-0">
            <div className="hidden md:flex items-center pl-4 text-gray-400">
              <Search size={24} />
            </div>
            <input 
              type="text" 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder={`Buscar carros, imóveis...`} 
              className="w-full py-3 px-3 md:py-4 md:px-4 outline-none text-gray-800 font-medium text-sm md:text-lg bg-transparent placeholder:text-sm md:placeholder:text-lg"
            />
            <button type="submit" className="bg-accent hover:bg-accent-dark text-white font-black px-4 md:px-10 py-3 md:py-4 rounded-xl transition-transform active:scale-95 shadow-sm flex items-center gap-2 outline-none">
              <Search className="md:hidden" size={20} /> <span className="hidden md:inline">Pesquisar</span>
            </button>
          </form>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 md:px-4 -mt-14 relative z-20">
        
        <div className="mb-8 px-2 md:px-0">
          <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORIAS_HOME.map(cat => (
              <Link 
                href={`/todos-anuncios?categoria=${cat.slug}`} 
                key={cat.nome} 
                className="snap-start shrink-0 flex flex-col items-center gap-2 group cursor-pointer w-20 md:w-24 outline-none"
              >
                <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:shadow-md border-2 border-b-[4px] md:border-b-[6px] active:border-b-2 active:translate-y-[2px] transition-all duration-150 bg-white ${cat.cores}`}>
                  <div className="scale-90 md:scale-100">{cat.icon}</div>
                </div>
                <span className="text-[11px] md:text-sm font-black text-gray-700 text-center tracking-tight leading-tight group-active:text-primary transition-colors">
                  {cat.nome}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {showInstallBanner && (
          <div className="bg-gradient-to-r from-[#4c1d95] to-[#7c3aed] mx-4 md:mx-0 rounded-[1.5rem] p-4 mb-8 shadow-xl border border-white/10 flex items-center justify-between relative overflow-hidden animate-in fade-in slide-in-from-bottom-5">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none"></div>
             <div className="flex items-center gap-3 md:gap-4 relative z-10">
                <div className="bg-white rounded-xl p-2.5 shadow-sm text-[#7c3aed] shrink-0">
                   <Download size={24} strokeWidth={2.5} />
                </div>
                <div>
                   <h3 className="text-white font-black text-sm md:text-lg leading-tight">Baixe nosso App!</h3>
                   <p className="text-purple-100 text-[10px] md:text-sm font-medium mt-0.5 leading-snug">Rápido, leve e não gasta memória.</p>
                </div>
             </div>
             <div className="flex items-center gap-1 sm:gap-2 relative z-10 shrink-0 ml-2">
                <button onClick={closeBanner} className="text-white/60 hover:text-white p-1 sm:p-2 outline-none">
                   <X size={20} />
                </button>
                <button onClick={handleInstallClick} className="bg-white text-[#7c3aed] font-black text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl shadow-md active:scale-95 transition-transform outline-none">
                   Instalar
                </button>
             </div>
          </div>
        )}

        <div className="px-4 md:px-0 mt-4 mb-10">
          <Link href="/carteira" className="block bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all outline-none group relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
             <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                   <Coins size={24} />
                </div>
                <div className="flex-1">
                   <h3 className="text-amber-900 font-black text-base md:text-lg leading-tight">Central de Recompensas</h3>
                   <p className="text-amber-700 text-[11px] md:text-sm font-medium leading-snug mt-0.5">Cumpra missões, acumule moedas virtuais e troque por destaques grátis!</p>
                </div>
                <div className="hidden sm:flex shrink-0">
                   <span className="bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm">Ver Missões <ChevronRight size={16}/></span>
                </div>
             </div>
          </Link>
        </div>

        {/* 🚀 COMPONENTE DO BANNER ADSENSE FOI REMOVIDO DAQUI TEMPORARIAMENTE */}

        {!loading && vipAds.length > 0 && (
          <div className="mb-6 mt-4 px-4 md:px-0">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight mb-4">
              <Sparkles className="text-amber-500"/> Ouro Urgente
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {vipAds.map(ad => (
                <Link href={`/anuncio/${ad.id}`} key={`vip-${ad.id}`} className="snap-start shrink-0 w-[240px] md:w-[260px] bg-white rounded-2xl border-2 border-amber-400 hover:border-amber-500 shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:shadow-[0_8px_25px_rgba(251,191,36,0.5)] hover:-translate-y-1 transition-all overflow-hidden flex flex-col group relative outline-none">
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-md shadow-md z-10 flex items-center gap-1">
                    <Sparkles size={10}/> Ouro
                  </div>
                  <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                     {ad.imagemUrl ? (
                        <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.titulo} />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
                     )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 bg-gradient-to-b from-amber-50/40 to-white">
                    <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 font-bold group-hover:text-amber-600 transition-colors h-10">{ad.titulo}</h3>
                    {/* 🚀 DESCRIÇÃO NO OURO TAMBÉM */}
                    {ad.descricao && (
                      <p className="text-[10px] text-gray-500 line-clamp-2 mb-2 leading-relaxed flex-1">
                        {ad.descricao}
                      </p>
                    )}
                    <p className="text-xl font-black text-amber-600 mt-auto">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && storiesAds.length > 0 && (
          <div className="mb-8 mt-2 px-4 md:px-0">
            <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2 tracking-tight mb-4">
              <Flame className="text-purple-500"/> Destaque Turbo
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {storiesAds.map(ad => (
                <Link href={`/anuncio/${ad.id}`} key={`story-${ad.id}`} className="snap-start shrink-0 flex flex-col items-center gap-2 outline-none w-[76px] md:w-[86px] group">
                  <div className="w-[76px] h-[76px] md:w-[86px] md:h-[86px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-md group-active:scale-95 transition-transform">
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-gray-50 relative">
                      {ad.imagemUrl ? (
                         <img src={ad.imagemUrl} className="w-full h-full object-cover" alt={ad.titulo} />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={24}/></div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-700 text-center line-clamp-2 leading-tight w-full px-1">
                    {ad.titulo}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 px-4 md:px-0 mt-8">
           <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Anúncios Recentes
           </h2>
        </div>

        <div className="px-4 md:px-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-20 px-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
               <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6 text-primary/40">
                  <ShoppingBag size={48} strokeWidth={1.5} />
               </div>
               <h3 className="text-xl font-black text-gray-900 mb-2">Nenhum anúncio por aqui (ainda!)</h3>
               <p className="text-gray-500 font-medium max-w-sm mb-6">Que tal ser o primeiro a faturar vendendo algo que você não usa mais?</p>
               <Link href="/anunciar" className="bg-accent hover:bg-accent-dark text-white font-black px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95">
                  Anunciar Grátis Agora
               </Link>
            </div>
          ) : (
            <div className="space-y-12">
              
              {adsOuro.length > 0 && (
                <div>
                  <h3 className="text-lg md:text-xl font-black text-amber-500 flex items-center gap-2 mb-4"><Sparkles size={20}/> Vitrine Ouro</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {adsOuro.map(ad => renderAdCard(ad))}
                  </div>
                </div>
              )}

              {adsTurbo.length > 0 && (
                <div>
                  <h3 className="text-lg md:text-xl font-black text-purple-600 flex items-center gap-2 mb-4"><Flame size={20}/> Vitrine Turbo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {adsTurbo.map(ad => renderAdCard(ad))}
                  </div>
                </div>
              )}

              {adsGerais.length > 0 && (
                <div>
                  {(adsOuro.length > 0 || adsTurbo.length > 0) && (
                     <h3 className="text-lg md:text-xl font-black text-gray-800 mb-4">Mais Anúncios</h3>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                    {adsGerais.map(ad => renderAdCard(ad))}
                  </div>
                </div>
              )}

              <div className="mt-12 hidden md:flex justify-center">
                <Link 
                  href="/todos-anuncios" 
                  className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 text-base outline-none"
                >
                  Explorar Todos os Anúncios <ChevronRight size={20} />
                </Link>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 md:hidden z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <Link 
                  href="/todos-anuncios" 
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg active:scale-95 transition-all outline-none"
                >
                  Explorar Todos os Anúncios <ChevronRight size={20} />
                </Link>
              </div>
            </div>
          )}
        </div>

        <section className="mt-20 px-4 md:px-0">
          <div className="bg-white rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-600 font-medium text-sm md:text-base leading-relaxed">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                  Classificados Online com Planos de Destaque no Piauí
                </h2>
                <p className="mb-4">
                  O <strong>Desapego Piauí</strong> é um portal de classificados focado em aproximar compradores e vendedores em todo o estado. Se você possui itens em casa que não utiliza mais, a nossa plataforma oferece o espaço ideal para criar anúncios e fechar negócios de forma direta, sem taxas de comissão.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                  Como Comprar e Vender com Segurança?
                </h3>
                <p className="mb-4">
                  Recomendamos sempre que os usuários realizem as suas negociações em locais públicos e movimentados, como praças, shopping centers ou postos de atendimento. Evite fazer depósitos antecipados sem antes verificar o estado real do produto.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}