'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, MapPin, ShoppingBag, Car, Home as HomeIcon, Smartphone, 
  Zap, Sparkles, Wrench, Baby, Bike, Briefcase, Shirt, ChevronRight, Heart
} from 'lucide-react'
import ContadorEstatisticas from '@/components/ContadorEstatisticas'
import AdBanner from '@/components/AdBanner'

// 🚀 CATEGORIAS ATUALIZADAS (Cores mais modernas e ícones limpos)
const CATEGORIAS_HOME = [
  { nome: 'Imóveis', slug: 'Imóveis', icon: <HomeIcon size={26} strokeWidth={2} />, cor: "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100" },
  { nome: 'Veículos', slug: 'Veículos', icon: <Car size={26} strokeWidth={2} />, cor: "bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100" },
  { nome: 'Celulares', slug: 'Eletrônicos', icon: <Smartphone size={26} strokeWidth={2} />, cor: "bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100" },
  { nome: 'Casa', slug: 'Para Casa', icon: <Zap size={26} strokeWidth={2} />, cor: "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100" },
  { nome: 'Moda', slug: 'Moda e Beleza', icon: <Shirt size={26} strokeWidth={2} />, cor: "bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-100" },
  { nome: 'Serviços', slug: 'Serviços', icon: <Wrench size={26} strokeWidth={2} />, cor: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100" },
  { nome: 'Bebês', slug: 'Bebês e Crianças', icon: <Baby size={26} strokeWidth={2} />, cor: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100" },
  { nome: 'Esportes', slug: 'Esportes', icon: <Bike size={26} strokeWidth={2} />, cor: "bg-teal-50 text-teal-600 hover:bg-teal-100 border border-teal-100" },
  { nome: 'Empregos', slug: 'Vagas de Emprego', icon: <Briefcase size={26} strokeWidth={2} />, cor: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100 border border-cyan-100" },
  { nome: 'Outros', slug: 'Outros', icon: <ShoppingBag size={26} strokeWidth={2} />, cor: "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200" },
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
  const [busca, setBusca] = useState('')
  const [userCity, setUserCity] = useState('sua região') 
  const [loading, setLoading] = useState(true)
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
  }, []);

  useEffect(() => {
    async function fetchRecentAds() {
      try {
        // Busca até 300 para garantir filtro suficiente
        const q = query(collection(db, 'anuncios'), orderBy('criadoEm', 'desc'), limit(300))
        const snap = await getDocs(q)
        const listGeral: any[] = []
        const listVIP: any[] = []
        const agora = new Date()

        for (const document of snap.docs) {
          const data = document.data()
          let statusFinal = data.status
          let isExpired = false;
          
          const plano = Number(data.planoId) || 0;

          if (data.expiraEm) {
            const dataExpiracao = new Date(data.expiraEm);
            if (dataExpiracao < agora) isExpired = true;
          } else if (data.criadoEm) {
            const dataCriacao = new Date(data.criadoEm.seconds * 1000);
            const diasDuracao = plano === 1 ? 1 : plano === 2 ? 7 : plano === 3 ? 15 : plano === 4 ? 30 : 1;
            dataCriacao.setDate(dataCriacao.getDate() + diasDuracao);
            if (dataCriacao < agora) isExpired = true;
          }

          if (isExpired && statusFinal === 'ativo') {
             statusFinal = 'expirado';
             updateDoc(doc(db, 'anuncios', document.id), { status: 'expirado' }).catch(console.error);
          }

          if (statusFinal === 'ativo') {
            const adFinal = { id: document.id, ...data, planoId: plano }
            listGeral.push(adFinal)
            
            if (plano > 0 && plano !== 99) {
              listVIP.push(adFinal)
            }
          }
        }
        
        listVIP.sort((a, b) => {
          const timeA = a.pagoEm ? new Date(a.pagoEm).getTime() : (a.criadoEm?.seconds * 1000 || 0);
          const timeB = b.pagoEm ? new Date(b.pagoEm).getTime() : (b.criadoEm?.seconds * 1000 || 0);
          return timeB - timeA;
        });
        
        setVipAds(listVIP.slice(0, 15)) 
        // 🚀 EXIBE 80 ANÚNCIOS NA PÁGINA INICIAL PARA DAR VOLUME
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

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mt-4"></div>
      </div>
    </div>
  )

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10 font-sans">
      
      {/* 🚀 HERO SECTION MELHORADA */}
      <div className="bg-gradient-to-br from-primary to-primary/90 pt-10 pb-28 px-4 rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          <ContadorEstatisticas />

          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            O que você está procurando no <span className="text-accent underline decoration-4 underline-offset-4">Piauí?</span>
          </h1>
          <p className="text-primary-100 font-medium mb-8 text-sm md:text-lg">
            O maior marketplace local. Compre e venda de forma segura em {userCity}.
          </p>
          
          <form onSubmit={handleSearch} className="flex bg-white p-2 rounded-2xl shadow-2xl max-w-2xl mx-auto focus-within:ring-4 focus-within:ring-accent/50 transition-all border-2 border-white/20">
            <div className="hidden md:flex items-center pl-4 text-gray-400">
              <Search size={24} />
            </div>
            <input 
              type="text" 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder={`Buscar carros, celulares, casas em ${userCity}...`} 
              className="w-full py-3 md:py-4 px-4 outline-none text-gray-800 font-medium text-base md:text-lg bg-transparent"
            />
            <button type="submit" className="bg-accent hover:bg-accent-dark text-white font-black px-6 md:px-10 py-3 md:py-4 rounded-xl transition-transform active:scale-95 shadow-sm flex items-center gap-2">
              <Search className="md:hidden" size={20} /> <span className="hidden md:inline">Pesquisar</span>
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-14 relative z-20">
        
        {/* 🚀 CATEGORIAS COMO BOTÕES DIRETOS */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3 md:gap-4">
            {CATEGORIAS_HOME.map(cat => (
              <Link 
                href={`/todos-anuncios?categoria=${cat.slug}`} 
                key={cat.nome} 
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1rem] flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 ${cat.cor}`}>
                  {cat.icon}
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-600 text-center tracking-tight group-hover:text-primary transition-colors">
                  {cat.nome}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 🚀 BANNER ADSENSE COMENTADO TEMPORARIAMENTE PARA APROVAÇÃO */}
        {/* <div className="mt-2 mb-6 w-full max-w-4xl mx-auto">
          <AdBanner dataAdSlot="8830353493" />
        </div> */}

        {/* CARROSSEL VIP NO TOPO */}
        {!loading && vipAds.length > 0 && (
          <div className="mb-12 mt-8">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight mb-4 px-2">
              <Sparkles className="text-amber-500"/> Destaques VIP
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide px-2">
              {vipAds.map(ad => (
                <Link href={`/anuncio/${ad.id}`} key={`vip-${ad.id}`} className="snap-start shrink-0 w-[260px] bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(251,191,36,0.2)] transition-all overflow-hidden flex flex-col group relative">
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-md z-10 flex items-center gap-1">
                    <Sparkles size={10}/> VIP
                  </div>
                  <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative">
                     {ad.imagemUrl ? (
                        <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.titulo} />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
                     )}
                  </div>
                  <div className="p-4 flex flex-col flex-1 bg-gradient-to-b from-amber-50/30 to-white">
                    <h3 className="text-sm text-gray-700 line-clamp-2 mb-2 font-medium group-hover:text-amber-600 transition-colors h-10">{ad.titulo}</h3>
                    <p className="text-xl font-black text-amber-600 mt-auto">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 px-2 mt-8">
           <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Anúncios Recentes
           </h2>
        </div>

        {/* LISTA GERAL DE ANÚNCIOS */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium text-lg bg-white rounded-2xl border border-gray-100 shadow-sm">
             <ShoppingBag size={48} className="mx-auto mb-3 opacity-30 text-primary" />
             Nenhum anúncio encontrado.<br/>
             <Link href="/anunciar" className="text-primary hover:underline font-bold mt-2 inline-block">Seja o primeiro a anunciar!</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {ads.map((ad) => {
                const plano = Number(ad.planoId) || 0;
                const isVip = plano > 0 && plano !== 99;

                return (
                  <Link href={`/anuncio/${ad.id}`} key={`recent-${ad.id}`} className={`group rounded-2xl border hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative ${
                    isVip 
                      ? 'border-amber-300 bg-amber-50/20 hover:-translate-y-1' 
                      : 'bg-white border-gray-100 hover:-translate-y-1'
                  }`}>
                    
                    {/* Botão de favorito estético */}
                    <div className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-colors">
                      <Heart size={16} strokeWidth={2.5} />
                    </div>

                    <div className="aspect-[4/3] bg-gray-50 overflow-hidden relative border-b border-gray-50">
                       {ad.imagemUrl ? (
                          <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={ad.titulo} />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
                       )}
                    </div>
                    
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded w-fit mb-2">
                        {ad.categoria}
                      </span>
                      <h3 className="text-xs md:text-sm text-gray-700 line-clamp-2 mb-2 h-8 md:h-10 font-medium group-hover:text-primary transition-colors leading-snug">
                        {ad.titulo}
                      </h3>
                      
                      <p className={`text-lg md:text-xl font-black mt-auto ${isVip ? 'text-amber-600' : 'text-gray-900'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                      </p>
                      
                      <div className="mt-3 pt-3 text-[10px] text-gray-400 flex justify-between font-medium border-t border-gray-50">
                        <span>{ad.criadoEm ? formatTimeAgo(ad.criadoEm.seconds) : 'Hoje'}</span>
                        <span className="flex items-center gap-1 truncate max-w-[60%]">
                           <MapPin size={12} className="text-gray-300 shrink-0"/> 
                           <span className="truncate">{ad.cidade || ad.localizacao || 'Piauí'}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* 🚀 BOTÃO GIGANTE PARA VER TODOS OS ANÚNCIOS */}
            <div className="mt-12 flex justify-center">
              <Link 
                href="/todos-anuncios" 
                className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 text-sm md:text-base"
              >
                Explorar Todos os Anúncios <ChevronRight size={20} />
              </Link>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 🚀 SEÇÃO DE SEO INTACTA (Não altere isso para não perder o AdSense) */}
        {/* ========================================================================= */}
        <section className="mt-20 bg-white rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-600 font-medium text-sm md:text-base leading-relaxed">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                Classificados Online com Planos de Destaque no Piauí
              </h2>
              <p className="mb-4">
                O <strong>Desapego Piauí</strong> é um portal de classificados focado em aproximar compradores e vendedores em todo o estado. Se você possui itens em casa que não utiliza mais, como um celular antigo, roupas, móveis ou até mesmo um veículo, a nossa plataforma oferece o espaço ideal para criar anúncios e fechar negócios de forma direta, sem intermediários e sem taxas de comissão sobre a venda efetuada.
              </p>
              <p>
                Atendemos todas as principais regiões do estado do Piauí, incluindo a capital Teresina, além de Parnaíba, Picos, Floriano, Piripiri e Campo Maior. O comércio de proximidade fortalece a economia local e gera muito mais confiança entre quem vende e quem compra.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                Como Comprar e Vender com Segurança?
              </h3>
              <p className="mb-4">
                Para garantir uma excelente experiência no nosso marketplace, recomendamos sempre que os usuários realizem as suas negociações em locais públicos e movimentados, como praças, shopping centers ou postos de atendimento. Evite fazer depósitos ou pagamentos antecipados sem antes verificar o estado real do produto em mãos.
              </p>
              <p>
                Navegue pelas nossas diversas categorias, que cobrem desde o mercado imobiliário e automotivo até eletrônicos de última geração, ofertas de vagas de emprego, serviços autônomos e artigos de moda e beleza. Encontre tudo o que precisa pertinho de você!
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-black text-gray-900 uppercase mb-4">Perguntas Frequentes — Desapego Piauí</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-bold text-gray-800 mb-1">1. Quanto custa anunciar e quais são os planos?</h4>
                <p>O Desapego Piauí trabalha com planos flexíveis para destacar os seus anúncios. Atualmente, estamos com uma promoção incrível: o <strong>Plano Diário é 100% gratuito e fica ativo até você vender o seu produto</strong>, e o <strong>Plano VIP (Destaque) está totalmente gratuito por 24 horas</strong>! Além disso, nunca cobramos nenhuma taxa de comissão pelas suas vendas.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">2. Como funciona o destaque VIP na plataforma?</h4>
                <p>Os planos de visibilidade servem para acelerar os seus negócios, posicionando os seus produtos no carrossel de destaques principais da página inicial. Aproveite a nossa promoção atual para experimentar o destaque VIP de graça durante as primeiras 24 horas.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">3. O site realiza entregas de mercadorias?</h4>
                <p>Não. O Desapego Piauí funciona exclusivamente como uma ponte de contato direto. Toda a logística de entrega e a forma de pagamento são combinadas diretamente entre o comprador e o vendedor através do WhatsApp.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">4. Quais produtos são proibidos na plataforma?</h4>
                <p>De acordo com os nossos termos de uso, é estritamente proibido anunciar medicamentos, substâncias ilícitas, armas de fogo, produtos falsificados ou quaisquer itens que infrinjam a legislação vigente.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}