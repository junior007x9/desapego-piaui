'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
// 🚀 Adicionado query e where para a função de resetar o bônus
import { collection, getDocs, doc, deleteDoc, updateDoc, getDoc, query, where } from 'firebase/firestore'
// 🚀 Adicionado Gift e Power para os novos botões
import { ShoppingBag, CheckCircle, Trash2, Loader2, Flag, AlertTriangle, ExternalLink, Lock, Mail, ShieldAlert, LogOut, DollarSign, TrendingUp, MessageSquarePlus, Calendar, BarChart3, Crown, Clock, Reply, Send, Users, Phone, Search, Activity, Gift, Power } from 'lucide-react'
import Link from 'next/link'

const getInfoPlano = (planoId: number) => {
  if (!planoId || planoId === 0) return { nome: 'Grátis', cor: 'bg-gray-100 text-gray-600 border-gray-200' }
  if (planoId === 1) return { nome: 'Diário (1 Dia)', cor: 'bg-blue-50 text-blue-700 border-blue-200' }
  if (planoId === 2 || planoId === 7) return { nome: 'Semanal (7 Dias)', cor: 'bg-green-50 text-green-700 border-green-200' }
  if (planoId === 3 || planoId === 15) return { nome: 'Quinzenal (15 Dias)', cor: 'bg-purple-50 text-purple-700 border-purple-200' }
  if (planoId === 4 || planoId === 30) return { nome: 'Mensal (30 Dias)', cor: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (planoId === 99) return { nome: 'Grátis (Resetado)', cor: 'bg-gray-100 text-gray-500 border-gray-200' }
  return { nome: 'VIP Extra', cor: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

const formatarData = (timestamp: any) => {
  if (!timestamp) return '--';
  try {
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString('pt-BR');
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
    return new Date(timestamp).toLocaleDateString('pt-BR');
  } catch (e) {
    return '--';
  }
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
  const [usuarios, setUsuarios] = useState<any[]>([]) 
  const [logs, setLogs] = useState<any[]>([]) 
  const [buscaUsuario, setBuscaUsuario] = useState('') 
  
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

      // 1. MAPA DE USUÁRIOS
      const mapUsuarios = new Map();
      try {
         const snapshotUsuarios = await getDocs(collection(db, 'usuarios'))
         snapshotUsuarios.forEach(doc => {
            mapUsuarios.set(doc.id, { id: doc.id, ...doc.data() })
         })
      } catch(e) { console.log("Coleção de usuários vazia ou não criada.") }

      // 2. BUSCAR ANÚNCIOS
      const snapshotAds = await getDocs(collection(db, 'anuncios'))
      const listaAds: any[] = []
      const listaPendentes: any[] = []
      
      snapshotAds.forEach(docSnap => {
        const data = docSnap.data()
        // 🚀 CORREÇÃO: Garante que vinculamos ao ID correto do criador
        const idUsuarioDesteAnuncio = data.vendedorId || data.usuarioId;
        const anuncioFormatado = { id: docSnap.id, ...data, vendedorId: idUsuarioDesteAnuncio };

        if (data.status === 'em_analise' || data.status === 'pendente') {
            listaPendentes.push(anuncioFormatado)
        } else {
            listaAds.push(anuncioFormatado)
        }

        // RECUPERAÇÃO INTELIGENTE DE USUÁRIOS
        if (idUsuarioDesteAnuncio && !mapUsuarios.has(idUsuarioDesteAnuncio)) {
           mapUsuarios.set(idUsuarioDesteAnuncio, {
              id: idUsuarioDesteAnuncio,
              nome: data.autorNome || data.name || (data.email ? data.email.split('@')[0] : 'Anunciante Sem Perfil'),
              email: data.email || 'Não informado',
              telefone: data.telefone || ''
           })
        }

        const plano = Number(data.planoId) || 0;

        if (plano > 0 && (data.status === 'ativo' || data.status === 'vendido' || data.status === 'expirado')) {
           contagemPagos++
           if (plano === 1) { totalMovimentado += 10.00; pDiario++ } 
           else if (plano === 2 || plano === 7) { totalMovimentado += 65.00; pSemanal++ } 
           else if (plano === 3 || plano === 15) { totalMovimentado += 140.00; pQuinzenal++ } 
           else if (plano === 4 || plano === 30) { totalMovimentado += 280.00; pMensal++ }
        }
      })
      
      listaAds.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      listaPendentes.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      
      setAds(listaAds)
      setAdsPendentes(listaPendentes)
      setAdsPagos(contagemPagos)
      setReceitaTotal(totalMovimentado)
      setPlanosVendidos({ diario: pDiario, semanal: pSemanal, quinzenal: pQuinzenal, mensal: pMensal })
      
      setUsuarios(Array.from(mapUsuarios.values()))

      // 3. BUSCAR LOGS DE ATIVIDADE
      try {
         const snapshotLogs = await getDocs(collection(db, 'logs'))
         const listaLogs: any[] = []
         snapshotLogs.forEach(doc => {
            listaLogs.push({ id: doc.id, ...doc.data() })
         })
         listaLogs.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
         setLogs(listaLogs)
      } catch(e) { console.log("Ainda não existem logs registrados.") }

      // 4. BUSCAR DENÚNCIAS E FEEDBACKS
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

  // 🚀 NOVA FUNÇÃO: ZERAR LIMITE DO PLANO GRÁTIS
  const handleZerarGratis = async (vendedorId: string) => {
    if (!confirm("Isto vai liberar o Bônus de 1 Dia Grátis para este utilizador poder usar novamente. Deseja confirmar?")) return;
    try {
      setLoadingAuth(true);
      const q = query(collection(db, 'anuncios'), where('vendedorId', '==', vendedorId), where('planoId', '==', 0));
      const snap = await getDocs(q);
      
      // Muda o planoId de 0 para 99 (para que o sistema não o reconheça mais como o "plano gratis único" gasto)
      const promessas = snap.docs.map(docSnap => updateDoc(doc(db, 'anuncios', docSnap.id), { planoId: 99 }));
      await Promise.all(promessas);

      alert("🎉 Bônus grátis resetado! O utilizador já pode voltar ao site e postar outro anúncio gratuito.");
      fetchDados();
    } catch(e) {
      alert("Erro ao resetar o bônus.");
      setLoadingAuth(false);
    }
  }

  // 🚀 NOVA FUNÇÃO: FORÇAR ATIVAÇÃO / RENOVAR PLANO
  const handleForcarAtivacao = async (ad: any, dias: number, novoPlanoId: number) => {
    if (!confirm(`Tem a certeza que deseja ativar/renovar este anúncio por ${dias} dias no VIP? Ele ficará público imediatamente.`)) return;
    try {
      const dataExp = new Date();
      dataExp.setDate(dataExp.getDate() + dias);

      await updateDoc(doc(db, 'anuncios', ad.id), {
         status: 'ativo',
         planoId: novoPlanoId,
         expiraEm: dataExp.toISOString(),
         pagoEm: new Date().toISOString()
      });

      alert(`✅ Anúncio ativado/renovado por ${dias} dias com sucesso!`);
      fetchDados(); 
    } catch(e) {
      alert("Erro ao ativar o anúncio.");
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
      const plano = Number(ad.planoId) || 0;
      let dias = 1;
      if (plano === 2 || plano === 7) dias = 7;
      if (plano === 3 || plano === 15) dias = 15;
      if (plano === 4 || plano === 30) dias = 30;

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
    const plano = Number(ad.planoId) || 0;
    if (filtroPlano === 'todos') return true;
    if (filtroPlano === 'gratis') return plano === 0 || plano === 99;
    if (filtroPlano === '1') return plano === 1;
    if (filtroPlano === '2') return plano === 2 || plano === 7;
    if (filtroPlano === '3') return plano === 3 || plano === 15;
    if (filtroPlano === '4') return plano === 4 || plano === 30;
    return true;
  });

  const usuariosFiltrados = usuarios.filter(u => {
      if (!buscaUsuario) return true;
      const termo = buscaUsuario.toLowerCase();
      return (u.nome?.toLowerCase() || '').includes(termo) ||
             (u.email?.toLowerCase() || '').includes(termo) ||
             (u.id?.toLowerCase() || '').includes(termo);
  });

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={40} /></div>
  if (user && !isAdmin) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><h1 className="text-white text-2xl font-bold">ACESSO NEGADO</h1></div>
  if (!isAdmin) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><button onClick={handleLogout} className="text-white">Sair</button></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 relative">
      
      {/* MODAL DE FEEDBACK */}
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
              <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition">Cancelar</button>
              <button onClick={handleSendReply} disabled={!replyMessage.trim() || sendingReply || !replyingTo.email} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
                {sendingReply ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Enviar por E-mail
              </button>
            </div>
            {!replyingTo.email && <p className="text-red-500 text-xs font-bold text-center mt-4">Não é possível responder: este usuário não forneceu o e-mail.</p>}
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
        
        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-purple-600">
               <Users size={24}/><p className="text-xs font-bold uppercase tracking-wider">Usuários</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-gray-800">{usuarios.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-primary">
               <ShoppingBag size={24}/><p className="text-xs font-bold uppercase tracking-wider">Ativos</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-gray-800">{ads.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-blue-600">
               <TrendingUp size={24}/><p className="text-xs font-bold uppercase tracking-wider">VIPs Pagos</p>
            </div>
            <p className="text-2xl md:text-3xl font-black text-gray-800">{adsPagos}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-emerald-600">
               <DollarSign size={24}/><p className="text-xs font-bold uppercase tracking-wider">Receita PIX</p>
            </div>
            <p className="text-xl md:text-2xl font-black text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaTotal)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col justify-center">
            <div className={`flex items-center gap-3 mb-2 ${denuncias.length > 0 ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
               <Flag size={24}/><p className="text-xs font-bold uppercase tracking-wider">Denúncias</p>
            </div>
            <p className={`text-2xl md:text-3xl font-black ${denuncias.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{denuncias.length}</p>
          </div>
        </div>

        {/* TABELA DE APROVAÇÃO RÁPIDA */}
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
                    <th className="p-4 font-bold">Anunciante</th>
                    <th className="p-4 font-bold">Plano Escolhido</th>
                    <th className="p-4 font-bold text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {adsPendentes.map(ad => {
                    const infoPlano = getInfoPlano(Number(ad.planoId))
                    const nomeAutor = ad.autorNome || ad.name || (ad.email ? ad.email.split('@')[0] : 'Anônimo');
                    
                    return (
                      <tr key={ad.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-4">
                           <Link href={`/anuncio/${ad.id}`} target="_blank" className="font-bold text-gray-800 hover:text-primary transition-colors line-clamp-1">{ad.titulo}</Link>
                        </td>
                        <td className="p-4">
                           <span className="text-sm font-bold text-gray-700 block capitalize">{nomeAutor}</span>
                           {ad.vendedorId && (
                              <Link href={`/vendedor/${ad.vendedorId}`} target="_blank" className="text-[11px] font-black text-blue-500 hover:underline uppercase tracking-wider">
                                 Ver Perfil
                              </Link>
                           )}
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

        {/* 🚀 LISTA SUPER COMPLETA DE USUÁRIOS E PESQUISA E LOGS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                  <Users size={20} />
               </div>
               <div>
                 <h2 className="text-xl font-black text-gray-800">Controlo de Usuários ({usuarios.length})</h2>
                 <p className="text-sm text-gray-500 font-medium">Veja e aprove anúncios diretamente no perfil do usuário.</p>
               </div>
             </div>
             
             {/* BARRA DE PESQUISA */}
             <div className="relative w-full md:w-64">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar usuário..." 
                  value={buscaUsuario}
                  onChange={(e) => setBuscaUsuario(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                />
             </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
             <table className="w-full text-left">
                <thead className="bg-white text-gray-500 text-sm border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                   <tr>
                      <th className="p-4 font-bold min-w-[200px]">Identificação</th>
                      <th className="p-4 font-bold min-w-[200px]">Contato</th>
                      <th className="p-4 font-bold min-w-[300px]">Anúncios e Atividades</th>
                      <th className="p-4 font-bold text-center">Perfil</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {usuariosFiltrados.map(u => {
                      const nomeExibicao = u.nome || u.name || u.displayName || u.apelido || (u.email ? u.email.split('@')[0] : `Utilizador ${u.id.substring(0,5)}`);
                      const anunciosDoUsuario = [...ads, ...adsPendentes].filter(ad => ad.vendedorId === u.id || ad.usuarioId === u.id);
                      const contagemAtivos = anunciosDoUsuario.filter(a => a.status === 'ativo').length;
                      const contagemPendentes = anunciosDoUsuario.filter(a => a.status === 'pendente' || a.status === 'em_analise').length;
                      
                      const logsDoUsuario = logs.filter(l => l.usuarioId === u.id);

                      return (
                         <tr key={u.id} className="hover:bg-purple-50/20 transition-colors">
                            <td className="p-4 align-top">
                               <p className="font-bold text-gray-800 capitalize text-sm">{nomeExibicao}</p>
                               <p className="text-[10px] text-gray-400 font-mono mt-1 bg-gray-50 px-1.5 py-0.5 rounded w-fit border border-gray-100">ID: {u.id}</p>

                               {/* 🚀 NOVO BOTÃO: ZERAR PLANO GRÁTIS */}
                               <button 
                                 onClick={() => handleZerarGratis(u.id)} 
                                 className="mt-3 flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-colors"
                               >
                                  <Gift size={12}/> Resetar Bônus Grátis
                               </button>

                            </td>

                            <td className="p-4 align-top">
                               <div className="flex flex-col gap-1.5">
                                 <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                   <Mail size={12} className="text-gray-400"/>
                                   <span className="truncate max-w-[180px]">{u.email || u.emailContato || '--'}</span>
                                 </div>
                                 {u.telefone && (
                                   <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                     <Phone size={12} className="text-gray-400"/>
                                     <span>{u.telefone}</span>
                                   </div>
                                 )}
                               </div>
                            </td>

                            <td className="p-4 align-top">
                               <div className="flex gap-2 mb-2">
                                 <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200 font-black">{contagemAtivos} Ativos</span>
                                 <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-black">{contagemPendentes} Pendentes</span>
                               </div>

                               {anunciosDoUsuario.length > 0 && (
                                 <details className="text-xs group mb-2">
                                   <summary className="cursor-pointer text-purple-600 font-bold hover:underline list-none flex items-center gap-1 select-none">
                                     Ver todos os {anunciosDoUsuario.length} anúncios ▾
                                   </summary>
                                   <ul className="mt-2 space-y-3 pl-3 border-l-2 border-purple-200">
                                     {anunciosDoUsuario.map(ad => (
                                       <li key={ad.id} className="flex flex-col gap-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100 shadow-sm">
                                         <div className="flex justify-between items-start gap-2">
                                            <Link href={`/anuncio/${ad.id}`} target="_blank" className="font-bold text-gray-800 hover:text-primary line-clamp-1">{ad.titulo}</Link>
                                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase font-black tracking-wider ${ad.status === 'ativo' ? 'bg-green-100 text-green-700' : ad.status === 'pendente' || ad.status === 'em_analise' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}`}>
                                              {ad.status}
                                            </span>
                                         </div>

                                         <p className="text-[10px] text-gray-500 font-medium">Plano Atual: {getInfoPlano(ad.planoId).nome}</p>

                                         {/* 🚀 NOVOS BOTÕES DE ATIVAÇÃO FORÇADA */}
                                         <div className="mt-1 pt-2 border-t border-gray-200">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                               <Power size={10}/> Forçar Ativação/Renovar Plano:
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                               <button onClick={() => handleForcarAtivacao(ad, 1, 1)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded text-[9px] font-black transition-colors">1 Dia</button>
                                               <button onClick={() => handleForcarAtivacao(ad, 7, 2)} className="bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded text-[9px] font-black transition-colors">7 Dias</button>
                                               <button onClick={() => handleForcarAtivacao(ad, 15, 3)} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded text-[9px] font-black transition-colors">15 Dias</button>
                                               <button onClick={() => handleForcarAtivacao(ad, 30, 4)} className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded text-[9px] font-black transition-colors">30 Dias</button>
                                            </div>
                                         </div>
                                       </li>
                                     ))}
                                   </ul>
                                 </details>
                               )}

                               <details className="text-xs group">
                                 <summary className="cursor-pointer text-blue-600 font-bold hover:underline list-none flex items-center gap-1 select-none">
                                   <Activity size={12}/> Histórico de Atividade ({logsDoUsuario.length}) ▾
                                 </summary>
                                 <ul className="mt-2 space-y-2 pl-3 border-l-2 border-blue-200 max-h-40 overflow-y-auto pr-2">
                                    {logsDoUsuario.length === 0 ? (
                                       <span className="text-gray-400 italic">Sem registros recentes.</span>
                                    ) : (
                                       logsDoUsuario.map(log => (
                                          <li key={log.id} className="flex flex-col gap-0.5 bg-blue-50/50 p-2 rounded border border-blue-50">
                                             <div className="flex justify-between items-center">
                                                <span className={`font-black text-[9px] uppercase tracking-wider ${
                                                   log.acao === 'CRIOU' ? 'text-green-600' : 
                                                   log.acao === 'EDITOU' ? 'text-blue-600' : 
                                                   log.acao === 'EXCLUIU' ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                   {log.acao}
                                                </span>
                                                <span className="text-[9px] text-gray-400 font-medium">
                                                   {new Date(log.criadoEm?.seconds ? log.criadoEm.seconds * 1000 : log.criadoEm).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}
                                                </span>
                                             </div>
                                             <span className="text-gray-700 font-medium text-[11px] truncate" title={log.tituloAnuncio}>Anúncio: {log.tituloAnuncio || 'Desconhecido'}</span>
                                          </li>
                                       ))
                                    )}
                                 </ul>
                               </details>
                            </td>

                            <td className="p-4 text-center align-top">
                               <Link href={`/vendedor/${u.id}`} target="_blank" className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 px-4 py-2 rounded-lg text-xs font-black uppercase transition-colors inline-block whitespace-nowrap">
                                  Ver Perfil
                               </Link>
                            </td>
                         </tr>
                      )
                   })}
                   {usuariosFiltrados.length === 0 && (
                      <tr>
                         <td colSpan={4} className="p-8 text-center text-gray-500 font-bold">Nenhum usuário encontrado.</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

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

        {/* TABELA DE ANÚNCIOS GERAIS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black text-gray-800 whitespace-nowrap">Anúncios ({adsFiltrados.length})</h2>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <button onClick={() => setFiltroPlano('todos')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === 'todos' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>Todos</button>
              <button onClick={() => setFiltroPlano('gratis')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === 'gratis' ? 'bg-gray-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>Grátis</button>
              <button onClick={() => setFiltroPlano('1')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '1' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}>Diário</button>
              <button onClick={() => setFiltroPlano('2')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '2' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'}`}>Semanal</button>
              <button onClick={() => setFiltroPlano('3')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '3' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'}`}>Quinzenal</button>
              <button onClick={() => setFiltroPlano('4')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${filtroPlano === '4' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}>Mensal</button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-bold">Título</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Plano</th>
                  <th className="p-4 font-bold">Preço do Item</th>
                  <th className="p-4 font-bold">Data</th>
                  <th className="p-4 font-bold text-center">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Nenhum anúncio encontrado neste filtro.</td>
                  </tr>
                ) : (
                  adsFiltrados.map(ad => {
                    const infoPlano = getInfoPlano(Number(ad.planoId))
                    return (
                      <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                           <Link href={`/anuncio/${ad.id}`} target="_blank" className="font-bold text-gray-800 hover:text-primary transition-colors line-clamp-1">{ad.titulo}</Link>
                        </td>
                        <td className="p-4">
                           <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-1 rounded-full ${ad.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                             {ad.status}
                           </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-lg border ${infoPlano.cor} uppercase tracking-wider whitespace-nowrap`}>
                            {infoPlano.nome}
                          </span>
                        </td>
                        <td className="p-4 font-black text-gray-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco || 0)}</td>
                        <td className="p-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                          {formatarData(ad.criadoEm)}
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

        {/* FEEDBACKS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <MessageSquarePlus size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-800">Ler Feedbacks dos Usuários ({feedbacks.length})</h2>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-100 sticky top-0 z-10 shadow-sm">
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
                      {formatarData(fb.criadoEm)}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-1">
                      <button onClick={() => setReplyingTo(fb)} title="Responder por E-mail" className="text-blue-500 hover:bg-blue-100 bg-blue-50 p-2 rounded-lg transition-colors">
                        <Reply size={18} />
                      </button>
                      <button onClick={async () => {
                           if(!confirm('Apagar esta mensagem de feedback?')) return;
                           await deleteDoc(doc(db, 'feedbacks', fb.id));
                           setFeedbacks(feedbacks.filter(f => f.id !== fb.id));
                        }} 
                        title="Apagar" className="text-gray-400 hover:bg-red-100 hover:text-red-500 p-2 rounded-lg transition-colors" >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feedbacks.length === 0 && <div className="p-10 text-center text-gray-500 font-bold bg-gray-50">A sua caixa de feedbacks está vazia.</div>}
          </div>
        </div>

      </div>
    </div>
  )
}