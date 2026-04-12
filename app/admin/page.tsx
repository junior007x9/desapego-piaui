'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore'
import { ShoppingBag, CheckCircle, Trash2, Loader2, Flag, AlertTriangle, ExternalLink, Lock, Mail, ShieldAlert, LogOut, DollarSign, TrendingUp, MessageSquarePlus, Calendar, BarChart3, Crown, Filter } from 'lucide-react'
import Link from 'next/link'

// Helper para dar nome e cor aos planos na tabela
const getInfoPlano = (planoId: number) => {
  if (!planoId || planoId === 0) return { nome: 'Grátis', cor: 'bg-gray-100 text-gray-600 border-gray-200' }
  if (planoId === 1) return { nome: 'Diário (1 Dia)', cor: 'bg-blue-50 text-blue-700 border-blue-200' }
  if (planoId === 2 || planoId === 7) return { nome: 'Semanal (7 Dias)', cor: 'bg-green-50 text-green-700 border-green-200' }
  if (planoId === 3 || planoId === 15) return { nome: 'Quinzenal (15 Dias)', cor: 'bg-purple-50 text-purple-700 border-purple-200' }
  if (planoId === 4 || planoId === 30) return { nome: 'Mensal (30 Dias)', cor: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { nome: 'VIP Extra', cor: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

export default function AdminPage() {
  const router = useRouter()
  
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [ads, setAds] = useState<any[]>([])
  const [denuncias, setDenuncias] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  
  const [adsPagos, setAdsPagos] = useState(0)
  const [receitaTotal, setReceitaTotal] = useState(0)
  
  const [planosVendidos, setPlanosVendidos] = useState({ diario: 0, semanal: 0, quinzenal: 0, mensal: 0 })
  
  // Filtro da Tabela
  const [filtroPlano, setFiltroPlano] = useState('todos')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid))
          
          if (adminDoc.exists()) {
            setIsAdmin(true)
            fetchDados()
          } else {
            setIsAdmin(false)
            setLoadingAuth(false)
          }
        } catch (error) {
          console.error("Erro ao verificar permissões:", error)
          setIsAdmin(false)
          setLoadingAuth(false)
        }
      } else {
        setIsAdmin(false)
        setLoadingAuth(false)
      }
    })
    return () => unsubscribe()
  }, [])

  async function fetchDados() {
    try {
      let contagemPagos = 0
      let totalMovimentado = 0
      let pDiario = 0, pSemanal = 0, pQuinzenal = 0, pMensal = 0

      // 1. BUSCAR ANÚNCIOS
      const snapshotAds = await getDocs(collection(db, 'anuncios'))
      const listaAds: any[] = []
      
      snapshotAds.forEach(doc => {
        const data = doc.data()
        listaAds.push({ id: doc.id, ...data })

        if (data.planoId && data.planoId > 0) {
           contagemPagos++
           if (data.planoId === 1) {
               totalMovimentado += 10.00
               pDiario++
           } else if (data.planoId === 2 || data.planoId === 7) {
               totalMovimentado += 65.00
               pSemanal++
           } else if (data.planoId === 3 || data.planoId === 15) {
               totalMovimentado += 140.00
               pQuinzenal++
           } else if (data.planoId === 4 || data.planoId === 30) {
               totalMovimentado += 280.00
               pMensal++
           }
        }
      })
      
      listaAds.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setAds(listaAds)
      setAdsPagos(contagemPagos)
      setReceitaTotal(totalMovimentado)
      setPlanosVendidos({ diario: pDiario, semanal: pSemanal, quinzenal: pQuinzenal, mensal: pMensal })

      // 2. BUSCAR DENÚNCIAS
      const snapshotDenuncias = await getDocs(collection(db, 'denuncias'))
      const listaDenuncias: any[] = []
      snapshotDenuncias.forEach(doc => {
        const data = doc.data()
        if (data.status === 'pendente') {
          listaDenuncias.push({ id: doc.id, ...data })
        }
      })
      listaDenuncias.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setDenuncias(listaDenuncias)

      // 3. BUSCAR FEEDBACKS
      const snapshotFeedbacks = await getDocs(collection(db, 'feedbacks'))
      const listaFeedbacks: any[] = []
      snapshotFeedbacks.forEach(doc => listaFeedbacks.push({ id: doc.id, ...doc.data() }))
      listaFeedbacks.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setFeedbacks(listaFeedbacks)

    } catch (error) {
      console.error("Erro ao buscar dados admin", error)
    } finally {
      setLoadingAuth(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
    } catch (error) {
      alert("E-mail ou senha incorretos.")
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Tem a certeza que deseja excluir este anúncio permanentemente?")) return
    try {
      await deleteDoc(doc(db, 'anuncios', id))
      setAds(ads.filter(ad => ad.id !== id))
      alert("Anúncio excluído com sucesso.")
    } catch (error) {
      alert("Erro ao excluir anúncio.")
    }
  }

  const handleAprovarDenuncia = async (anuncioId: string, denunciaId: string) => {
    if (!confirm("🚨 ATENÇÃO: Isso vai APAGAR O ANÚNCIO da plataforma e marcar a denúncia como resolvida. Confirmar exclusão?")) return
    try {
      await deleteDoc(doc(db, 'anuncios', anuncioId))
      await updateDoc(doc(db, 'denuncias', denunciaId), { status: 'resolvido' })
      setAds(ads.filter(ad => ad.id !== anuncioId))
      setDenuncias(denuncias.filter(d => d.id !== denunciaId))
      alert("Golpe evitado! Anúncio apagado e denúncia resolvida.")
    } catch (error) {
      alert("Erro ao processar a denúncia.")
    }
  }

  const handleIgnorarDenuncia = async (denunciaId: string) => {
    if (!confirm("Deseja ignorar esta denúncia? O anúncio CONTINUARÁ no ar.")) return
    try {
      await updateDoc(doc(db, 'denuncias', denunciaId), { status: 'ignorado' })
      setDenuncias(denuncias.filter(d => d.id !== denunciaId))
    } catch (error) {
      alert("Erro ao ignorar denúncia.")
    }
  }

  // Lógica do Filtro da Tabela
  const adsFiltrados = ads.filter(ad => {
    if (filtroPlano === 'todos') return true;
    if (filtroPlano === 'gratis') return !ad.planoId || ad.planoId === 0;
    if (filtroPlano === '1') return ad.planoId === 1;
    if (filtroPlano === '2') return ad.planoId === 2 || ad.planoId === 7;
    if (filtroPlano === '3') return ad.planoId === 3 || ad.planoId === 15;
    if (filtroPlano === '4') return ad.planoId === 4 || ad.planoId === 30;
    return true;
  });

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
        <ShieldAlert size={80} className="text-red-500 mb-6" />
        <h1 className="text-4xl font-black text-white mb-2">ACESSO NEGADO</h1>
        <p className="text-gray-400 font-medium mb-8 text-center max-w-md">A sua conta não tem privilégios administrativos.</p>
        <div className="flex gap-4">
           <Link href="/" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition">Voltar</Link>
           <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition">Sair</button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-20 h-20 bg-gray-800 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-gray-700">
             <Lock size={36} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Admin Restrito</h2>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-gray-700">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input required type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full pl-10 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full pl-10 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-white" />
                </div>
              </div>
              <button type="submit" disabled={loginLoading} className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white bg-primary hover:bg-primary-dark transition-all mt-8">
                {loginLoading ? <Loader2 className="animate-spin" size={24} /> : "Autenticar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel Administrativo</h1>
           <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm w-fit">
              <LogOut size={18}/> Sair do Painel
           </button>
        </div>
        
        {/* GRID DE MÉTRICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-xl text-primary"><ShoppingBag size={28}/></div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Anúncios no Ar</p>
              <p className="text-2xl md:text-3xl font-black text-gray-800">{ads.length}</p>
            </div>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><TrendingUp size={28}/></div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Planos Vendidos</p>
              <p className="text-2xl md:text-3xl font-black text-gray-800">{adsPagos}</p>
            </div>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600"><DollarSign size={28}/></div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Receita PIX</p>
              <p className="text-xl md:text-2xl font-black text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaTotal)}</p>
            </div>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${denuncias.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-red-50 text-red-500'}`}><Flag size={28}/></div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Denúncias</p>
              <p className={`text-2xl md:text-3xl font-black ${denuncias.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{denuncias.length}</p>
            </div>
          </div>
        </div>

        {/* DETALHAMENTO DE PLANOS VENDIDOS */}
        <div className="mb-10">
          <h2 className="text-lg font-black text-gray-800 mb-4 px-2">Desempenho dos Planos VIP</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center text-center">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-3"><Calendar size={24}/></div>
                <span className="text-xs text-gray-500 font-bold uppercase mb-1">Diário (R$ 10)</span>
                <span className="text-2xl font-black text-gray-900">{planosVendidos.diario}</span>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm flex flex-col items-center text-center">
                <div className="bg-green-50 p-3 rounded-full text-green-600 mb-3"><TrendingUp size={24}/></div>
                <span className="text-xs text-gray-500 font-bold uppercase mb-1">Semanal (R$ 65)</span>
                <span className="text-2xl font-black text-gray-900">{planosVendidos.semanal}</span>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center text-center">
                <div className="bg-purple-50 p-3 rounded-full text-purple-600 mb-3"><BarChart3 size={24}/></div>
                <span className="text-xs text-gray-500 font-bold uppercase mb-1">Quinzenal (R$ 140)</span>
                <span className="text-2xl font-black text-gray-900">{planosVendidos.quinzenal}</span>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center text-center">
                <div className="bg-amber-50 p-3 rounded-full text-amber-600 mb-3"><Crown size={24}/></div>
                <span className="text-xs text-gray-500 font-bold uppercase mb-1">Mensal (R$ 280)</span>
                <span className="text-2xl font-black text-gray-900">{planosVendidos.mensal}</span>
             </div>
          </div>
        </div>

        {/* DENÚNCIAS */}
        {denuncias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 overflow-hidden mb-10">
            <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <h2 className="text-xl font-black text-red-700">Ação Necessária: Denúncias</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="p-4 font-bold">Motivo</th>
                    <th className="p-4 font-bold">Anúncio</th>
                    <th className="p-4 font-bold">Data</th>
                    <th className="p-4 font-bold text-center">Decisão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {denuncias.map(denuncia => (
                    <tr key={denuncia.id} className="hover:bg-red-50/50 transition-colors">
                      <td className="p-4"><span className="bg-red-100 text-red-700 font-bold text-xs px-3 py-1.5 rounded-lg">{denuncia.motivo}</span></td>
                      <td className="p-4"><Link href={`/anuncio/${denuncia.anuncioId}`} target="_blank" className="font-bold text-primary hover:underline">{denuncia.anuncioTitulo}</Link></td>
                      <td className="p-4 text-sm text-gray-500">{denuncia.criadoEm?.toDate ? denuncia.criadoEm.toDate().toLocaleDateString('pt-BR') : 'Hoje'}</td>
                      <td className="p-4 text-center flex justify-center gap-2">
                        <button onClick={() => handleAprovarDenuncia(denuncia.anuncioId, denuncia.id)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-xs"><Trash2 size={14}/></button>
                        <button onClick={() => handleIgnorarDenuncia(denuncia.id)} className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-bold text-xs"><CheckCircle size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANÚNCIOS (COM FILTROS, TAGS DE PLANOS E DATA) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-gray-800 whitespace-nowrap">Anúncios ({adsFiltrados.length})</h2>
            
            {/* BARRA DE FILTROS */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button onClick={() => setFiltroPlano('todos')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === 'todos' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>Todos</button>
              <button onClick={() => setFiltroPlano('gratis')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === 'gratis' ? 'bg-gray-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>Grátis</button>
              <button onClick={() => setFiltroPlano('1')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '1' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}>Diário</button>
              <button onClick={() => setFiltroPlano('2')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '2' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'}`}>Semanal</button>
              <button onClick={() => setFiltroPlano('3')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '3' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'}`}>Quinzenal</button>
              <button onClick={() => setFiltroPlano('4')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '4' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}>Mensal</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold">Título</th>
                  <th className="p-4 font-bold">Plano</th>
                  <th className="p-4 font-bold">Preço</th>
                  {/* 🚀 NOVA COLUNA: DATA */}
                  <th className="p-4 font-bold">Data de Ativação</th>
                  <th className="p-4 font-bold text-center">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Nenhum anúncio encontrado neste filtro.</td>
                  </tr>
                ) : (
                  adsFiltrados.map(ad => {
                    const infoPlano = getInfoPlano(ad.planoId)
                    return (
                      <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                           <Link href={`/anuncio/${ad.id}`} target="_blank" className="font-bold text-gray-800 hover:text-primary transition-colors line-clamp-1">{ad.titulo}</Link>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-lg border ${infoPlano.cor} uppercase tracking-wider whitespace-nowrap`}>
                            {infoPlano.nome}
                          </span>
                        </td>
                        <td className="p-4 font-black text-gray-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco || 0)}</td>
                        {/* 🚀 NOVA CÉLULA: EXIBIÇÃO DA DATA */}
                        <td className="p-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                          {ad.criadoEm?.toDate ? ad.criadoEm.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDeleteAd(ad.id)} className="text-gray-400 hover:bg-red-50 hover:text-red-500 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CAIXA DE LEITURA DOS FEEDBACKS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <MessageSquarePlus size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-800">Ler Feedbacks dos Usuários ({feedbacks.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold">Tipo</th>
                  <th className="p-4 font-bold">Mensagem Enviada Pelo Usuário</th>
                  <th className="p-4 font-bold">Data</th>
                  <th className="p-4 font-bold text-center">Apagar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbacks.map(fb => (
                  <tr key={fb.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full ${
                        fb.tipo === 'Erro' ? 'bg-red-100 text-red-700' :
                        fb.tipo === 'Elogio' ? 'bg-pink-100 text-pink-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {fb.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 font-medium">
                      {fb.mensagem}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                      {fb.criadoEm?.toDate ? fb.criadoEm.toDate().toLocaleDateString('pt-BR') : 'Recente'}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={async () => {
                           if(!confirm('Apagar esta mensagem de feedback?')) return;
                           await deleteDoc(doc(db, 'feedbacks', fb.id));
                           setFeedbacks(feedbacks.filter(f => f.id !== fb.id));
                        }} 
                        className="text-gray-400 hover:text-red-500 p-2 transition-colors" 
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feedbacks.length === 0 && (
              <div className="p-10 text-center text-gray-500 font-bold bg-gray-50">
                A sua caixa de feedbacks está vazia.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}