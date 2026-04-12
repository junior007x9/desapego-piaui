'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, Trash2, Edit, TrendingUp, ShoppingBag, Sparkles, PlusCircle, Calendar, CheckCircle } from 'lucide-react'

export default function MeusAnunciosPage() {
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  
  const [totalViews, setTotalViews] = useState(0)
  const [activeAds, setActiveAds] = useState(0)

  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        fetchMyAds(currentUser.uid)
      } else {
        router.push('/login')
      }
    })
    return () => unsubscribe()
  }, [router])

  async function fetchMyAds(userId: string) {
    try {
      const q = query(
        collection(db, 'anuncios'), 
        where('vendedorId', '==', userId)
      )
      
      const snap = await getDocs(q)
      const list: any[] = []
      let views = 0
      let ativos = 0
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

        list.push({ id: document.id, ...data, status: statusFinal })
        
        views += (data.visualizacoes || 0)
        if (statusFinal === 'ativo') ativos++
      }

      list.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))

      setAds(list)
      setTotalViews(views)
      setActiveAds(ativos)
    } catch (error) {
      console.error("Erro ao buscar meus anúncios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Aviso: Excluir este anúncio fará com que você perca todas as visualizações dele no Google. Recomendamos usar o botão 'Marcar como Vendido'. Deseja excluir mesmo assim?")) return;
    
    try {
      await deleteDoc(doc(db, 'anuncios', id))
      setAds(ads.filter(ad => ad.id !== id))
    } catch (error) {
      alert("Ocorreu um erro ao excluir o anúncio.")
    }
  }

  // 🚀 NOVA FUNÇÃO: MARCAR COMO VENDIDO (SOFT DELETE)
  const handleMarkAsSold = async (id: string) => {
    if (!confirm("Tem certeza que deseja marcar este anúncio como VENDIDO? Ele sairá das buscas, mas a página continuará a existir para quem tiver o link.")) return;
    
    try {
      await updateDoc(doc(db, 'anuncios', id), { status: 'vendido' })
      setAds(ads.map(ad => ad.id === id ? { ...ad, status: 'vendido' } : ad))
      alert("Parabéns pela venda! 🎉")
    } catch (error) {
      console.error("Erro ao vender:", error)
      alert("Ocorreu um erro ao atualizar o anúncio.")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 pb-28 md:pb-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Meus Anúncios</h1>
             <p className="text-gray-500 font-medium mt-1">Gerencie seu estoque e acompanhe seus resultados.</p>
           </div>
           <Link href="/anunciar" className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md w-full md:w-auto">
              <PlusCircle size={20} /> Novo Anúncio
           </Link>
        </div>

        {/* DASHBOARD DE RESULTADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
                 <ShoppingBag size={28} />
              </div>
              <div>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Anúncios Ativos</p>
                 <p className="text-3xl font-black text-gray-900">{activeAds}</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-100 flex items-center gap-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50">
                <TrendingUp size={100} />
              </div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0 relative z-10">
                 <Eye size={28} />
              </div>
              <div className="relative z-10">
                 <p className="text-sm font-bold text-emerald-600/70 uppercase tracking-wider">Total de Visualizações</p>
                 <p className="text-3xl font-black text-emerald-600">{totalViews}</p>
              </div>
           </div>
        </div>

        {/* LISTA DE ANÚNCIOS DO USUÁRIO */}
        {ads.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100">
             <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShoppingBag size={40} />
             </div>
             <h3 className="text-xl font-black text-gray-800 mb-2">Sua vitrine está vazia</h3>
             <p className="text-gray-500 mb-6 max-w-md mx-auto">Você ainda não publicou nenhum anúncio. Comece a desapegar agora mesmo e ganhe dinheiro!</p>
             <Link href="/anunciar" className="bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-bold transition shadow-md inline-block">
                Anunciar meu primeiro produto
             </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center relative overflow-hidden">
                
                {/* Imagem */}
                <Link href={`/anuncio/${ad.id}`} className="shrink-0 relative w-full md:w-32 h-48 md:h-32 bg-gray-50 rounded-2xl overflow-hidden block group">
                  {ad.imagemUrl ? (
                    <img src={ad.imagemUrl} alt={ad.titulo} className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${ad.status === 'vendido' ? 'grayscale opacity-70' : ''}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={24}/></div>
                  )}
                  {ad.planoId > 0 && ad.status === 'ativo' && (
                    <div className="absolute top-2 left-2 bg-accent text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-md flex items-center gap-1">
                      <Sparkles size={10}/> VIP
                    </div>
                  )}
                  {/* Tarja de Vendido por cima da imagem */}
                  {ad.status === 'vendido' && (
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-black text-xs tracking-widest uppercase rotate-[-15deg] border-2 border-white px-2 py-1">Vendido</span>
                     </div>
                  )}
                </Link>

                {/* Detalhes */}
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                      {ad.categoria}
                    </span>
                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded tracking-wider ${
                      ad.status === 'ativo' ? 'bg-green-100 text-green-700' :
                      ad.status === 'vendido' ? 'bg-gray-200 text-gray-700' :
                      ad.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {ad.status}
                    </span>
                  </div>
                  
                  <Link href={`/anuncio/${ad.id}`}>
                    <h3 className={`text-lg font-bold leading-tight mb-1 transition-colors line-clamp-2 ${ad.status === 'vendido' ? 'text-gray-500 line-through' : 'text-gray-900 hover:text-primary'}`}>{ad.titulo}</h3>
                  </Link>

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-3">
                     <Calendar size={12} />
                     <span>
                        {ad.criadoEm ? `Criado em ${new Date(ad.criadoEm.seconds * 1000).toLocaleDateString('pt-BR')}` : 'Data de criação não disponível'}
                     </span>
                  </div>
                  
                  <div className="flex items-end justify-between mt-2">
                    <p className={`text-2xl font-black ${ad.status === 'vendido' ? 'text-gray-400' : 'text-primary'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                    </p>
                    
                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                       <Eye size={16} className="text-emerald-500" />
                       <span className="text-sm font-bold">{ad.visualizacoes || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="w-full md:w-auto flex flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  
                  {/* Se estiver ativo, mostra a opção de Marcar como Vendido (ESTRELA DO SHOW) */}
                  {ad.status === 'ativo' && (
                     <button onClick={() => handleMarkAsSold(ad.id)} className="w-full text-center bg-green-500 hover:bg-green-600 text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition shadow-sm flex justify-center items-center gap-2">
                        <CheckCircle size={16}/> Já Vendi!
                     </button>
                  )}

                  {(ad.status === 'expirado' || ad.status === 'pendente') && (
                     <Link href={`/pagamento/${ad.id}`} className="flex-1 md:flex-none text-center bg-accent hover:bg-accent-dark text-white font-bold text-sm px-4 py-3 rounded-xl transition shadow-sm">
                       Renovar Plano
                     </Link>
                  )}

                  <div className="flex gap-2 w-full mt-1">
                    {ad.status !== 'vendido' && (
                      <Link href={`/editar-anuncio/${ad.id}`} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-3 py-2.5 rounded-xl transition">
                        <Edit size={14}/> Editar
                      </Link>
                    )}
                    
                    <button onClick={() => handleDelete(ad.id)} className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 font-bold text-xs px-3 py-2.5 rounded-xl transition">
                      <Trash2 size={14}/> Excluir
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}