'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore'
import { ShoppingBag, CheckCircle, Trash2, Loader2, Flag, AlertTriangle, ExternalLink, Lock, Mail, ShieldAlert, LogOut, DollarSign, TrendingUp, MessageSquarePlus, Calendar, BarChart3, Crown, Clock, Reply, Send } from 'lucide-react'
import Link from 'next/link'

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
  const [adsPendentes, setAdsPendentes] = useState<any[]>([]) 
  const [denuncias, setDenuncias] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  
  const [adsPagos, setAdsPagos] = useState(0)
  const [receitaTotal, setReceitaTotal] = useState(0)
  
  const [planosVendidos, setPlanosVendidos] = useState({ diario: 0, semanal: 0, quinzenal: 0, mensal: 0 })
  const [filtroPlano, setFiltroPlano] = useState('todos')

  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

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

      const snapshotAds = await getDocs(collection(db, 'anuncios'))
      const listaAds: any[] = []
      const listaPendentes: any[] = []
      
      snapshotAds.forEach(doc => {
        const data = doc.data()
        
        if (data.status === 'em_analise') {
            listaPendentes.push({ id: doc.id, ...data })
        } else {
            listaAds.push({ id: doc.id, ...data })
        }

        // 🚀 CORREÇÃO DA RECEITA: Agora conta se o plano foi pago e o anúncio está ativo, vendido ou expirado!
        if (data.planoId && data.planoId > 0 && (data.status === 'ativo' || data.status === 'vendido' || data.status === 'expirado')) {
           contagemPagos++
           if (data.planoId === 1) { totalMovimentado += 10.00; pDiario++ } 
           else if (data.planoId === 2 || data.planoId === 7) { totalMovimentado += 65.00; pSemanal++ } 
           else if (data.planoId === 3 || data.planoId === 15) { totalMovimentado += 140.00; pQuinzenal++ } 
           else if (data.planoId === 4 || data.planoId === 30) { totalMovimentado += 280.00; pMensal++ }
        }
      })
      
      listaAds.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      listaPendentes.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      
      setAds(listaAds)
      setAdsPendentes(listaPendentes)
      setAdsPagos(contagemPagos)
      setReceitaTotal(totalMovimentado)
      setPlanosVendidos({ diario: pDiario, semanal: pSemanal, quinzenal: pQuinzenal, mensal: pMensal })

      const snapshotDenuncias = await getDocs(collection(db, 'denuncias'))
      const listaDenuncias: any[] = []
      snapshotDenuncias.forEach(doc => {
        if (doc.data().status === 'pendente') listaDenuncias.push({ id: doc.id, ...doc.data() })
      })
      setDenuncias(listaDenuncias)

      const snapshotFeedbacks = await getDocs(collection(db, 'feedbacks'))
      const listaFeedbacks: any[] = []
      snapshotFeedbacks.forEach(doc => listaFeedbacks.push({ id: doc.id, ...doc.data() }))
      listaFeedbacks.sort((a, b) => {
         if (a.respondido === b.respondido) return (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0);
         return a.respondido ? 1 : -1;
      })
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
      setAdsPendentes(adsPendentes.filter(ad => ad.id !== id))
    } catch (error) { alert("Erro ao excluir anúncio.") }
  }

  const handleAprovarPix = async (ad: any) => {
    if (!confirm(`Aprovar o PIX de R$ ${ad.preco} para o anúncio "${ad.titulo}"? O anúncio entrará no VIP imediatamente.`)) return;
    
    try {
      let dias = 1;
      if (ad.planoId === 2 || ad.planoId === 7) dias = 7;
      if (ad.planoId === 3 || ad.planoId === 15) dias = 15;
      if (ad.planoId === 4 || ad.planoId === 30) dias = 30;

      const dataExp = new Date();
      dataExp.setDate(dataExp.getDate() + dias);

      await updateDoc(doc(db, 'anuncios', ad.id), {
        status: 'ativo',
        expiraEm: dataExp.toISOString(),
        pagoEm: new Date().toISOString()
      });

      alert("PIX Aprovado! O anúncio agora é VIP.");
      setAdsPendentes(adsPendentes.filter(item => item.id !== ad.id));
      setAds([{...ad, status: 'ativo'}, ...ads]);
      
    } catch (error) {
      alert("Erro ao aprovar o pagamento.");
    }
  }

  const handleAprovarDenuncia = async (anuncioId: string, denunciaId: string) => {
    if (!confirm("🚨 ATENÇÃO: Isso vai APAGAR O ANÚNCIO. Confirmar?")) return
    try {
      await deleteDoc(doc(db, 'anuncios', anuncioId))
      await updateDoc(doc(db, 'denuncias', denunciaId), { status: 'resolvido' })
      setAds(ads.filter(ad => ad.id !== anuncioId))
      setDenuncias(denuncias.filter(d => d.id !== denunciaId))
    } catch (error) { alert("Erro.") }
  }

  const handleIgnorarDenuncia = async (denunciaId: string) => {
    if (!confirm("Ignorar esta denúncia?")) return
    try {
      await updateDoc(doc(db, 'denuncias', denunciaId), { status: 'ignorado' })
      setDenuncias(denuncias.filter(d => d.id !== denunciaId))
    } catch (error) {}
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !replyingTo) return;
    setSendingReply(true);

    try {
      const response = await fetch('/api/responder-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailDestino: replyingTo.email, 
          mensagemOriginal: replyingTo.mensagem,
          resposta: replyMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await updateDoc(doc(db, 'feedbacks', replyingTo.id), { respondido: true });
        setFeedbacks(feedbacks.map(fb => fb.id === replyingTo.id ? { ...fb, respondido: true } : fb));
        alert("E-mail enviado com sucesso ao usuário! 🚀");
        setReplyingTo(null);
        setReplyMessage('');
      } else {
        alert(`Falha ao enviar e-mail: ${data.error}`);
      }
    } catch (error) {
      alert("Erro ao processar o envio.");
    } finally {
      setSendingReply(false);
    }
  }

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
  if (user && !isAdmin) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><h1 className="text-white text-2xl font-bold">ACESSO NEGADO</h1></div>
  if (!isAdmin) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><button onClick={handleLogout} className="text-white">Sair</button></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 relative">
      
      {replyingTo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <h3 className="font-black text-2xl text-gray-900 mb-2">Responder Feedback</h3>
            <p className="text-sm text-gray-500 mb-4 font-bold">Enviando e-mail para: <span className="text-primary">{replyingTo.email || "E-mail não informado"}</span></p>
            
            <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 mb-6 italic border border-gray-100 relative">
               <span className="absolute -top-3 left-4 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Mensagem Original</span>
               "{replyingTo.mensagem}"
            </div>

            <textarea
              value={replyMessage}
              onChange={e => setReplyMessage(e.target.value)}
              rows={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-6 text-gray-800 resize-none font-medium"
              placeholder="Olá! Muito obrigado pelo seu feedback. Gostaríamos de informar que..."
            />

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition">
                Cancelar
              </button>
              <button 
                onClick={handleSendReply} 
                disabled={!replyMessage.trim() || sendingReply || !replyingTo.email} 
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 shadow-md transition transform hover:-translate-y-0.5"
              >
                {sendingReply ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} 
                Enviar por E-mail
              </button>
            </div>
            
            {!replyingTo.email && (
               <p className="text-red-500 text-xs font-bold text-center mt-4">
                  Não é possível responder: este usuário não forneceu o e-mail no momento do feedback.
               </p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel Administrativo</h1>
           <button onClick={handleLogout} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm w-fit">
              <LogOut size={18}/> Sair do Painel
           </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-xl text-primary"><ShoppingBag size={28}/></div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Ativos</p>
              <p className="text-2xl md:text-3xl font-black text-gray-800">{ads.length}</p>
            </div>
          </div>
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><TrendingUp size={28}/></div>
            <div>
              <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">VIPs Pagos</p>
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

        {adsPendentes.length > 0 && (
          <div className="bg-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 overflow-hidden mb-10">
            <div className="p-6 bg-amber-100 border-b border-amber-200 flex items-center gap-3">
              <Clock className="text-amber-600 animate-pulse" size={28} />
              <div>
                <h2 className="text-xl font-black text-amber-800">Aprovação de PIX Pendente</h2>
                <p className="text-sm font-bold text-amber-700">Abra o app do seu banco e verifique se o valor caiu antes de aprovar.</p>
              </div>
            </div>
            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold">Anúncio</th>
                    <th className="p-4 font-bold">Plano Escolhido</th>
                    <th className="p-4 font-bold text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adsPendentes.map(ad => {
                    const infoPlano = getInfoPlano(ad.planoId)
                    return (
                      <tr key={ad.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-4">
                           <Link href={`/anuncio/${ad.id}`} target="_blank" className="font-bold text-gray-800 hover:text-primary transition-colors line-clamp-1">{ad.titulo}</Link>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-lg border ${infoPlano.cor} uppercase tracking-wider`}>
                            {infoPlano.nome}
                          </span>
                        </td>
                        <td className="p-4 text-center flex justify-center gap-2">
                          <button onClick={() => handleAprovarPix(ad)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-black text-xs uppercase shadow-sm transition">
                            Aprovar PIX
                          </button>
                          <button onClick={() => handleDeleteAd(ad.id)} className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-lg font-black text-xs transition" title="Excluir Anúncio">
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-lg font-black text-gray-800 mb-4 px-2">Desempenho dos Planos VIP (Aprovados)</h2>
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-gray-800 whitespace-nowrap">Anúncios Ativos ({adsFiltrados.length})</h2>
            
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
                  <th className="p-4 font-bold">Preço do Item</th>
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
                  <th className="p-4 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {feedbacks.map(fb => (
                  <tr key={fb.id} className={`transition-colors ${fb.respondido ? 'bg-gray-50/50 opacity-70' : 'hover:bg-blue-50/30'}`}>
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
                      {fb.respondido && <span className="ml-2 inline-block bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Respondido</span>}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                      {fb.criadoEm?.toDate ? fb.criadoEm.toDate().toLocaleDateString('pt-BR') : 'Recente'}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-1">
                      <button 
                        onClick={() => setReplyingTo(fb)} 
                        title="Responder por E-mail"
                        className="text-blue-500 hover:bg-blue-100 bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <Reply size={18} />
                      </button>
                      
                      <button 
                        onClick={async () => {
                           if(!confirm('Apagar esta mensagem de feedback?')) return;
                           await deleteDoc(doc(db, 'feedbacks', fb.id));
                           setFeedbacks(feedbacks.filter(f => f.id !== fb.id));
                        }} 
                        title="Apagar"
                        className="text-gray-400 hover:bg-red-100 hover:text-red-500 p-2 rounded-lg transition-colors" 
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