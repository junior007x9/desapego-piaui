'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore'
import { ShoppingBag, CheckCircle, Trash2, Loader2, Flag, AlertTriangle, ExternalLink, Lock, Mail, ShieldAlert, LogOut, DollarSign, TrendingUp, MessageSquarePlus } from 'lucide-react'
import Link from 'next/link'

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
  
  // ESTADOS PARA AS MÉTRICAS FINANCEIRAS E FEEDBACKS
  const [adsPagos, setAdsPagos] = useState(0)
  const [receitaTotal, setReceitaTotal] = useState(0)
  const [feedbacks, setFeedbacks] = useState<any[]>([])

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

      // 1. BUSCAR ANÚNCIOS E CALCULAR FINANÇAS
      const snapshotAds = await getDocs(collection(db, 'anuncios'))
      const listaAds: any[] = []
      
      snapshotAds.forEach(doc => {
        const data = doc.data()
        listaAds.push({ id: doc.id, ...data })

        if (data.planoId && data.planoId > 0) {
           contagemPagos++
           if (data.planoId === 1) {
              totalMovimentado += 10.00   // Diário
           } else if (data.planoId === 2 || data.planoId === 7) {
              totalMovimentado += 65.00   // Semanal
           } else if (data.planoId === 3 || data.planoId === 15) {
              totalMovimentado += 140.00  // Quinzenal
           } else if (data.planoId === 4 || data.planoId === 30) {
              totalMovimentado += 280.00  // Mensal
           }
        }
      })
      
      listaAds.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setAds(listaAds)
      setAdsPagos(contagemPagos)
      setReceitaTotal(totalMovimentado)

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

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
        <ShieldAlert size={80} className="text-red-500 mb-6" />
        <h1 className="text-4xl font-black text-white mb-2">ACESSO NEGADO</h1>
        <p className="text-gray-400 font-medium mb-8 text-center max-w-md">
          A sua conta não tem privilégios administrativos para aceder a esta área restrita.
        </p>
        <div className="flex gap-4">
           <Link href="/" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition">Voltar ao Início</Link>
           <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition">Sair da Conta</button>
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
          <p className="mt-2 text-sm text-gray-400 font-medium">Insira as credenciais de administrador</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-[2rem] sm:px-10 border border-gray-700">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">E-mail Administrativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input required type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full pl-10 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-white" placeholder="admin@..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Senha de Segurança</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input required type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full pl-10 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-white" placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" disabled={loginLoading} className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50 mt-8">
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
            <div className="bg-primary/10 p-4 rounded-xl text-primary">
              <ShoppingBag size={28}/>
            </div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Anúncios no Ar</p>
              <p className="text-2xl md:text-3xl font-black text-gray-800">{ads.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
              <TrendingUp size={28}/>
            </div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Planos Vendidos</p>
              <p className="text-2xl md:text-3xl font-black text-gray-800">{adsPagos}</p>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
              <DollarSign size={28}/>
            </div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Receita PIX</p>
              <p className="text-xl md:text-2xl font-black text-emerald-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaTotal)}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${denuncias.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-red-50 text-red-500'}`}>
              <Flag size={28}/>
            </div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Denúncias</p>
              <p className={`text-2xl md:text-3xl font-black ${denuncias.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{denuncias.length}</p>
            </div>
          </div>
        </div>

        {/* TABELA DE DENÚNCIAS */}
        {denuncias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 overflow-hidden mb-10">
            <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <h2 className="text-xl font-black text-red-700">Ação Necessária: Denúncias da Comunidade</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="p-4 font-bold">Motivo da Denúncia</th>
                    <th className="p-4 font-bold">Anúncio Denunciado</th>
                    <th className="p-4 font-bold">Data</th>
                    <th className="p-4 font-bold text-center">Decisão do Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {denuncias.map(denuncia => (
                    <tr key={denuncia.id} className="hover:bg-red-50/50 transition-colors">
                      <td className="p-4">
                        <span className="bg-red-100 text-red-700 font-bold text-xs px-3 py-1.5 rounded-lg">
                          {denuncia.motivo}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800 line-clamp-1">{denuncia.anuncioTitulo}</p>
                        <Link href={`/anuncio/${denuncia.anuncioId}`} target="_blank" className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1">
                          Ver Anúncio Suspeito <ExternalLink size={12}/>
                        </Link>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-500">
                        {denuncia.criadoEm?.toDate ? denuncia.criadoEm.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => handleAprovarDenuncia(denuncia.anuncioId, denuncia.id)} 
                             className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-1"
                             title="Apagar Anúncio Fraude"
                           >
                             <Trash2 size={14}/> Apagar Anúncio
                           </button>
                           <button 
                             onClick={() => handleIgnorarDenuncia(denuncia.id)} 
                             className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-1"
                             title="Alarme falso"
                           >
                             <CheckCircle size={14}/> Ignorar
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABELA DE TODOS OS ANÚNCIOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-black text-gray-800">Todos os Anúncios ({ads.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold">Título do Anúncio</th>
                  <th className="p-4 font-bold">Plano</th>
                  <th className="p-4 font-bold">Preço do Produto</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-center">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-800 line-clamp-1">{ad.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">{ad.categoria}</p>
                    </td>
                    <td className="p-4">
                      {ad.planoId && ad.planoId > 0 ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-1 rounded-md">Pago (ID: {ad.planoId})</span>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">Grátis</span>
                      )}
                    </td>
                    <td className="p-4 font-black text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco || 0)}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full font-bold ${
                        ad.status === 'ativo' ? 'bg-green-100 text-green-700' : 
                        ad.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 
                        ad.status === 'expirado' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {ad.status === 'pendente' ? 'Aguardando Pag.' : ad.status || 'erro'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteAd(ad.id)} 
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition" 
                        title="Excluir Anúncio"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ads.length === 0 && (
              <div className="p-10 text-center text-gray-500 font-bold bg-gray-50">
                Nenhum anúncio cadastrado na plataforma ainda.
              </div>
            )}
          </div>
        </div>

        {/* NOVA TABELA DE FEEDBACKS (TAVA FALTANDO ESSA BELEZINHA!) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <MessageSquarePlus size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-800">Caixa de Feedbacks dos Usuários ({feedbacks.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold">Tipo</th>
                  <th className="p-4 font-bold">Mensagem</th>
                  <th className="p-4 font-bold">Data</th>
                  <th className="p-4 font-bold text-center">Excluir</th>
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
                    <td className="p-4 text-sm text-gray-700 max-w-xs md:max-w-md">
                      {fb.mensagem}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                      {fb.criadoEm?.toDate ? fb.criadoEm.toDate().toLocaleDateString('pt-BR') : 'Recente'}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={async () => {
                           if(!confirm('Excluir este feedback?')) return;
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
                Nenhum feedback recebido ainda.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}