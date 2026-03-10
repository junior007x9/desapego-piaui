'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'
import { MapPin, ShoppingBag, User, ArrowLeft, Star, Loader2, Calendar } from 'lucide-react'

export default function VendedorPage() {
  const params = useParams()
  const router = useRouter()
  const [vendedor, setVendedor] = useState<any>(null)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)

  // Estados da Avaliação
  const [media, setMedia] = useState(0)
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0)
  const [minhaNota, setMinhaNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [jaAvaliou, setJaAvaliou] = useState(false)
  const [enviandoNota, setEnviandoNota] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchVendedorDados() {
      if (!params.id) return

      try {
        // 1. Busca os dados do vendedor (Incluindo foto, cidade e estado)
        const vendedorDoc = await getDoc(doc(db, 'users', params.id as string))
        if (vendedorDoc.exists()) {
          setVendedor(vendedorDoc.data())
        } else {
          alert('Vendedor não encontrado.')
          router.push('/')
          return
        }

        // 2. Busca anúncios ativos
        const qAds = query(collection(db, 'anuncios'), where('vendedorId', '==', params.id), where('status', '==', 'ativo'))
        const snapAds = await getDocs(qAds)
        const listaAnuncios: any[] = []
        snapAds.forEach(doc => listaAnuncios.push({ id: doc.id, ...doc.data() }))
        listaAnuncios.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
        setAds(listaAnuncios)

        // 3. Busca Avaliações
        const qAvaliacoes = query(collection(db, 'avaliacoes'), where('vendedorId', '==', params.id))
        const snapAvaliacoes = await getDocs(qAvaliacoes)
        
        let soma = 0
        let total = 0
        let userJaDeuNota = false

        snapAvaliacoes.forEach(doc => {
          const dados = doc.data()
          soma += dados.nota
          total += 1
          if (currentUser && dados.compradorId === currentUser.uid) {
            userJaDeuNota = true
            setMinhaNota(dados.nota)
          }
        })

        if (total > 0) {
          setMedia(soma / total)
        }
        setTotalAvaliacoes(total)
        setJaAvaliou(userJaDeuNota)

      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendedorDados()
  }, [params.id, currentUser])

  const handleAvaliar = async (notaEscolhida: number) => {
    if (!currentUser) {
      alert("Faça login para avaliar este vendedor.")
      router.push('/login')
      return
    }

    if (jaAvaliou) {
      alert("Você já avaliou este vendedor!")
      return
    }

    setEnviandoNota(true)
    setMinhaNota(notaEscolhida)

    try {
      await addDoc(collection(db, 'avaliacoes'), {
        vendedorId: params.id,
        compradorId: currentUser.uid,
        nota: notaEscolhida,
        criadoEm: serverTimestamp()
      })

      const novaSoma = (media * totalAvaliacoes) + notaEscolhida
      const novoTotal = totalAvaliacoes + 1
      setMedia(novaSoma / novoTotal)
      setTotalAvaliacoes(novoTotal)
      setJaAvaliou(true)
      
      alert("✅ Avaliação enviada com sucesso!")
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error)
      alert("Erro ao avaliar. Tente novamente.")
      setMinhaNota(0)
    } finally {
      setEnviandoNota(false)
    }
  }

  const EstrelasMedia = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            size={20} 
            className={star <= Math.round(media) ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"} 
          />
        ))}
        <span className="ml-2 font-bold text-gray-700">{media > 0 ? media.toFixed(1) : 'Novo'}</span>
        <span className="text-sm text-gray-400 font-medium">({totalAvaliacoes} avaliações)</span>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>

  const localizacaoVendedor = vendedor?.cidade && vendedor?.estado ? `${vendedor.cidade}, ${vendedor.estado}` : 'Piauí, Brasil';
  const anoRegistro = vendedor?.criadoEm?.toDate ? vendedor.criadoEm.toDate().getFullYear() : '2024';

  return (
    <div className="bg-gray-50 min-h-screen py-10 pb-28 md:pb-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* CABEÇALHO DO VENDEDOR */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          {/* Capa de fundo moderna */}
          <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-primary to-accent opacity-90"></div>
          
          <button onClick={() => router.back()} className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition z-10 shadow-sm">
            <ArrowLeft size={20} />
          </button>

          <div className="relative z-10 pt-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 text-center md:text-left">
            
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <div className="w-28 h-28 bg-white border-4 border-white rounded-full flex items-center justify-center text-primary font-bold text-5xl shadow-lg shrink-0 overflow-hidden relative">
                {vendedor?.fotoPerfil ? (
                   <img src={vendedor.fotoPerfil} alt={vendedor.nome} className="w-full h-full object-cover" />
                ) : (
                   vendedor?.nome ? vendedor.nome.charAt(0).toUpperCase() : <User size={40} />
                )}
              </div>
              <div className="mb-1 space-y-1.5">
                <h1 className="text-3xl font-black text-gray-900 leading-none">{vendedor?.nome || 'Usuário'}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-medium text-gray-500">
                  <span className="flex items-center justify-center sm:justify-start gap-1"><MapPin size={16} className="text-accent" /> {localizacaoVendedor}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center justify-center sm:justify-start gap-1"><Calendar size={16} className="text-accent" /> No site desde {anoRegistro}</span>
                </div>
                <div className="pt-1">
                   <EstrelasMedia />
                </div>
              </div>
            </div>

            {/* CAIXA DE DAR AVALIAÇÃO */}
            {currentUser && currentUser.uid !== params.id && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-inner flex flex-col items-center min-w-[200px]">
                <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                  {jaAvaliou ? "Sua avaliação" : "Avalie este vendedor"}
                </p>
                <div className="flex gap-1" onMouseLeave={() => setHoverNota(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={jaAvaliou || enviandoNota}
                      onMouseEnter={() => setHoverNota(star)}
                      onClick={() => handleAvaliar(star)}
                      className={`transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100 p-1`}
                    >
                      <Star 
                        size={32} 
                        className={
                          star <= (hoverNota || minhaNota) 
                            ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" 
                            : "fill-white text-gray-300"
                        } 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="bg-primary/10 text-primary p-2 rounded-xl">
             <ShoppingBag size={24} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
             {ads.length} {ads.length === 1 ? 'Anúncio Ativo' : 'Anúncios Ativos'}
          </h2>
        </div>

        {/* LISTA DE ANÚNCIOS */}
        {ads.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100 flex flex-col items-center">
             <ShoppingBag size={48} className="text-gray-300 mb-4" />
             <p className="text-gray-500 text-lg font-bold">Este vendedor não tem anúncios ativos no momento.</p>
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
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded w-fit mb-2">
                    {ad.categoria}
                  </span>
                  <h3 className="text-xs md:text-sm text-gray-700 line-clamp-2 mb-1.5 md:mb-2 h-8 md:h-10 font-bold group-hover:text-primary transition-colors leading-snug">{ad.titulo}</h3>
                  
                  <div className="mt-auto pt-2 border-t border-gray-50">
                    <p className="text-lg md:text-xl font-black text-primary mb-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                       <MapPin size={10} className="text-accent shrink-0"/> <span className="truncate">{localizacaoVendedor}</span>
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