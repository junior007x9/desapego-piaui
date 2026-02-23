'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import Link from 'next/link'
import { MapPin, ShoppingBag, User, ArrowLeft, Star, Loader2 } from 'lucide-react'

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
  const [minhaNota, setMinhaNota] = useState(0) // Nota que o utilizador atual quer dar
  const [hoverNota, setHoverNota] = useState(0) // Efeito visual ao passar o rato nas estrelas
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
        // 1. Busca os dados do vendedor
        const vendedorDoc = await getDoc(doc(db, 'users', params.id as string))
        if (vendedorDoc.exists()) {
          setVendedor(vendedorDoc.data())
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
          // Verifica se o utilizador logado já avaliou
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

  // Função para salvar a nota no Firebase
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

      // Atualiza a média na tela na mesma hora
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

  // Componente visual para as estrelas de exibição (Média)
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
        <span className="text-sm text-gray-400">({totalAvaliacoes} avaliações)</span>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600 font-bold animate-pulse">Carregando perfil...</div>

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* CABEÇALHO DO VENDEDOR */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-purple-600"></div>
          
          <button onClick={() => router.back()} className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition z-10">
            <ArrowLeft size={20} />
          </button>

          <div className="relative z-10 pt-12 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 text-center md:text-left">
            
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="w-24 h-24 bg-white border-4 border-white rounded-full flex items-center justify-center text-purple-600 font-bold text-4xl shadow-md shrink-0">
                {vendedor?.nome ? vendedor.nome.charAt(0).toUpperCase() : <User size={40} />}
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{vendedor?.nome || 'Usuário DesapegoPI'}</h1>
                <EstrelasMedia />
              </div>
            </div>

            {/* CAIXA DE DAR AVALIAÇÃO (Apenas aparece se não for o próprio vendedor a ver o seu perfil) */}
            {currentUser && currentUser.uid !== params.id && (
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-inner flex flex-col items-center">
                <p className="text-sm font-bold text-gray-700 mb-2">
                  {jaAvaliou ? "Sua avaliação" : "Avalie este vendedor:"}
                </p>
                <div className="flex gap-1" onMouseLeave={() => setHoverNota(0)}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      disabled={jaAvaliou || enviandoNota}
                      onMouseEnter={() => setHoverNota(star)}
                      onClick={() => handleAvaliar(star)}
                      className={`transition-transform hover:scale-110 disabled:cursor-default disabled:hover:scale-100`}
                    >
                      <Star 
                        size={28} 
                        className={
                          star <= (hoverNota || minhaNota) 
                            ? "fill-yellow-400 text-yellow-400" 
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

        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShoppingBag className="text-purple-600" /> 
          {ads.length} {ads.length === 1 ? 'Anúncio Ativo' : 'Anúncios Ativos'}
        </h2>

        {/* LISTA DE ANÚNCIOS */}
        {ads.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-gray-100">
             <p className="text-gray-500 text-lg">Este vendedor não tem anúncios ativos no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group">
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col">
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                     {ad.imagemUrl ? (
                        <img src={ad.imagemUrl} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={40}/></div>
                     )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit mb-2">
                      {ad.categoria}
                    </span>
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