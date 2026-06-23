'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Coins, Flame, Copy, CheckCircle, Share2, Rocket, Sparkles, ChevronLeft, Gift, AlertCircle, ShoppingBag, Info, Loader2 } from 'lucide-react'

export default function CarteiraPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  
  const router = useRouter()

  // Custos na nossa Loja de Recompensas
  const CUSTO_TOPO = 50;   // 50 moedas
  const CUSTO_TURBO = 150; // 150 moedas
  const CUSTO_OURO = 400;  // 400 moedas

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await carregarCarteira(currentUser)
      } else {
        router.push('/login')
      }
    })
    return () => unsubscribe()
  }, [router])

  async function carregarCarteira(currentUser: any) {
    try {
      const userRef = doc(db, 'usuarios', currentUser.uid);
      const snap = await getDoc(userRef);
      
      if (snap.exists()) {
        const data = snap.data();
        
        // Se o usuário já existe mas ainda não tem os campos da carteira, nós criamos agora
        if (data.moedas === undefined) {
           const codigoGerado = Math.random().toString(36).substring(2, 8).toUpperCase();
           const novosDados = {
              moedas: 10, // Ganha 10 moedas de boas vindas
              codigoIndicacao: data.codigoIndicacao || codigoGerado,
              diasSeguidos: 1,
              creditosTopo: 0,
              creditosTurbo: 0,
              creditosOuro: 0
           };
           await updateDoc(userRef, novosDados);
           setPerfil({ ...data, ...novosDados });
        } else {
           setPerfil(data);
        }
      } else {
         // Se não existe documento, cria um básico
         const codigoGerado = Math.random().toString(36).substring(2, 8).toUpperCase();
         const novoPerfil = {
            moedas: 10,
            codigoIndicacao: codigoGerado,
            diasSeguidos: 1,
            creditosTopo: 0,
            creditosTurbo: 0,
            creditosOuro: 0,
            email: currentUser.email
         };
         await setDoc(userRef, novoPerfil);
         setPerfil(novoPerfil);
      }
    } catch (error) {
      console.error("Erro ao carregar carteira:", error);
    } finally {
      setLoading(false);
    }
  }

  const linkIndicacao = typeof window !== 'undefined' && perfil?.codigoIndicacao 
    ? `${window.location.origin}/cadastro?ref=${perfil.codigoIndicacao}`
    : '';

  const copyToClipboard = () => {
    if (linkIndicacao) {
      navigator.clipboard.writeText(linkIndicacao)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareLink = () => {
    if (navigator.share && linkIndicacao) {
      navigator.share({
        title: 'Desapego Piauí - Ganhe Destaque Grátis!',
        text: 'Cadastre-se com meu link no Desapego Piauí e ganhe recompensas para vender seus produtos mais rápido!',
        url: linkIndicacao
      }).catch(console.error);
    } else {
      copyToClipboard();
    }
  }

  const comprarItem = async (tipo: 'topo' | 'turbo' | 'ouro', custo: number) => {
    if (perfil.moedas < custo) {
       alert("Você não tem moedas suficientes! Complete missões para ganhar mais.");
       return;
    }

    if (!confirm(`Deseja gastar ${custo} moedas para comprar este item?`)) return;

    try {
      const userRef = doc(db, 'usuarios', user.uid);
      
      const novoSaldo = perfil.moedas - custo;
      const novosCreditosTopo = tipo === 'topo' ? (perfil.creditosTopo || 0) + 1 : (perfil.creditosTopo || 0);
      const novosCreditosTurbo = tipo === 'turbo' ? (perfil.creditosTurbo || 0) + 1 : (perfil.creditosTurbo || 0);
      const novosCreditosOuro = tipo === 'ouro' ? (perfil.creditosOuro || 0) + 1 : (perfil.creditosOuro || 0);

      await updateDoc(userRef, {
         moedas: novoSaldo,
         creditosTopo: novosCreditosTopo,
         creditosTurbo: novosCreditosTurbo,
         creditosOuro: novosCreditosOuro
      });

      setPerfil({
         ...perfil,
         moedas: novoSaldo,
         creditosTopo: novosCreditosTopo,
         creditosTurbo: novosCreditosTurbo,
         creditosOuro: novosCreditosOuro
      });

      alert("Compra realizada com sucesso! O item está nos seus Créditos Disponíveis e poderá ser usado ao criar um anúncio.");
    } catch (error) {
      console.error("Erro ao comprar:", error);
      alert("Erro ao processar compra.");
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Coins className="animate-bounce text-amber-500" size={48} /></div>

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-10 font-sans">
      
      {/* HEADER DA CARTEIRA */}
      <div className="bg-gradient-to-br from-gray-900 to-primary pt-8 pb-20 px-4 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <button onClick={() => router.push('/')} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition"><ChevronLeft size={24}/></button>
             <h1 className="text-2xl font-black text-white tracking-tight">Minha Carteira</h1>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[2rem] flex items-center justify-between">
             <div>
                <p className="text-gray-300 font-bold uppercase tracking-wider text-xs mb-1">Saldo Atual</p>
                <div className="flex items-end gap-2">
                   <h2 className="text-5xl font-black text-amber-400">{perfil?.moedas || 0}</h2>
                   <span className="text-amber-200 font-bold mb-1">Moedas</span>
                </div>
             </div>
             <div className="w-16 h-16 bg-amber-400/20 rounded-full flex items-center justify-center">
                <Coins size={32} className="text-amber-400" />
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 space-y-6">
        
        {/* CRÉDITOS DISPONÍVEIS */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-4">
           <div className="flex-1 bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 text-green-700 font-black mb-1 text-sm">
                 <Rocket size={16}/> Topo
              </div>
              <p className="text-2xl font-black text-green-800">{perfil?.creditosTopo || 0}</p>
              <span className="text-[10px] font-bold text-green-600 uppercase">disponíveis</span>
           </div>
           <div className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 font-black mb-1 text-sm">
                 <Flame size={16}/> Turbo
              </div>
              <p className="text-2xl font-black text-blue-800">{perfil?.creditosTurbo || 0}</p>
              <span className="text-[10px] font-bold text-blue-600 uppercase">disponíveis</span>
           </div>
           <div className="col-span-2 md:col-span-1 bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 text-amber-700 font-black mb-1 text-sm">
                 <Sparkles size={16}/> Ouro
              </div>
              <p className="text-2xl font-black text-amber-800">{perfil?.creditosOuro || 0}</p>
              <span className="text-[10px] font-bold text-amber-600 uppercase">disponíveis</span>
           </div>
        </div>

        {/* LOJA DE RECOMPENSAS */}
        <div>
           <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><ShoppingBag className="text-primary"/> Loja de Destaques</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                 <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-1.5 mb-2"><Rocket size={18} className="text-green-500"/> Sobe pro Topo</h4>
                    <p className="text-xs text-gray-500 font-medium mb-4">Impulsione 1 anúncio para acima dos gratuitos por 20 dias.</p>
                 </div>
                 <button 
                   onClick={() => comprarItem('topo', CUSTO_TOPO)}
                   className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${perfil?.moedas >= CUSTO_TOPO ? 'bg-amber-400 hover:bg-amber-500 text-amber-900' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                 >
                    <Coins size={16}/> {CUSTO_TOPO} Moedas
                 </button>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                 <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-1.5 mb-2"><Flame size={18} className="text-blue-500"/> Destaque Turbo</h4>
                    <p className="text-xs text-gray-500 font-medium mb-4">Apareça no formato Stories com borda colorida por 20 dias.</p>
                 </div>
                 <button 
                   onClick={() => comprarItem('turbo', CUSTO_TURBO)}
                   className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${perfil?.moedas >= CUSTO_TURBO ? 'bg-amber-400 hover:bg-amber-500 text-amber-900' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                 >
                    <Coins size={16}/> {CUSTO_TURBO} Moedas
                 </button>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                 <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-1.5 mb-2"><Sparkles size={18} className="text-amber-500"/> Ouro Urgente</h4>
                    <p className="text-xs text-gray-500 font-medium mb-4">Fique visível no Carrossel gigante do topo por 20 dias.</p>
                 </div>
                 <button 
                   onClick={() => comprarItem('ouro', CUSTO_OURO)}
                   className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${perfil?.moedas >= CUSTO_OURO ? 'bg-amber-400 hover:bg-amber-500 text-amber-900' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                 >
                    <Coins size={16}/> {CUSTO_OURO} Moedas
                 </button>
              </div>
           </div>
        </div>

        {/* COMO FUNCIONA E MISSÕES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
           <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Info size={20} className="text-blue-500"/> Entenda as Moedas</h2>
           <p className="text-sm text-gray-600 leading-relaxed mb-6">
             As <strong>Moedas Piauí</strong> são o nosso sistema de recompensa (sem valor monetário em dinheiro). Elas servem estritamente para serem acumuladas e trocadas pelos Planos VIP. Ao usar essas moedas, você não paga a taxa do Mercado Pago.
           </p>

           <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2 border-t border-gray-100 pt-6"><Gift size={20} className="text-green-500"/> Como ganhar moedas?</h2>
           <div className="space-y-3">
             <div className="flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-xl">
                <div className="flex flex-col">
                   <span className="font-bold text-gray-800 text-sm">Criar o seu primeiro anúncio</span>
                   <span className="text-xs text-gray-500 font-medium">Bônus de boas-vindas</span>
                </div>
                <span className="bg-green-100 text-green-700 font-black text-xs px-3 py-1.5 rounded-lg">+10 Moedas</span>
             </div>
             
             <div className="flex items-center justify-between bg-amber-50 border border-amber-100 p-4 rounded-xl">
                <div className="flex flex-col">
                   <span className="font-bold text-gray-800 text-sm">Indicar um amigo</span>
                   <span className="text-xs text-gray-500 font-medium">Quando ele criar o primeiro anúncio</span>
                </div>
                <button onClick={copiarLink} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-4 py-2 rounded-lg flex items-center gap-1 transition-transform active:scale-95 shadow-sm">
                   <Share2 size={14}/> Indicar (+50)
                </button>
             </div>
           </div>
        </div>

        {/* Login Diário / Ofensiva */}
        <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
           <div className="bg-orange-100 text-orange-500 p-3 rounded-full">
              <Flame size={24} />
           </div>
           <div className="flex-1">
              <h4 className="font-bold text-gray-900">Ofensiva Diária</h4>
              <p className="text-xs text-gray-500 mt-0.5">Acesse o site todos os dias e ganhe moedas.</p>
           </div>
           <div className="text-right">
              <p className="text-lg font-black text-orange-500">{perfil?.diasSeguidos || 1} 🔥</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Dias seguidos</p>
           </div>
        </div>

      </div>
    </div>
  )
}