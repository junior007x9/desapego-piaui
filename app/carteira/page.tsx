'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Coins, Flame, Copy, CheckCircle, Share2, Rocket, Sparkles, ChevronLeft, Gift, AlertCircle } from 'lucide-react'

export default function CarteiraPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  
  const router = useRouter()

  // Custos na nossa Loja de Recompensas
  const CUSTO_TOPO = 50; // 50 moedas
  const CUSTO_TURBO = 150; // 150 moedas

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
              creditosTurbo: 0
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

  const comprarItem = async (tipo: 'topo' | 'turbo', custo: number) => {
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

      await updateDoc(userRef, {
         moedas: novoSaldo,
         creditosTopo: novosCreditosTopo,
         creditosTurbo: novosCreditosTurbo
      });

      setPerfil({
         ...perfil,
         moedas: novoSaldo,
         creditosTopo: novosCreditosTopo,
         creditosTurbo: novosCreditosTurbo
      });

      alert("Compra realizada com sucesso! O item está nos seus Créditos Disponíveis.");
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
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex gap-4">
           <div className="flex-1 bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 text-green-700 font-black mb-1">
                 <Rocket size={18}/> Sobe pro Topo
              </div>
              <p className="text-2xl font-black text-green-800">{perfil?.creditosTopo || 0} <span className="text-xs font-bold text-green-600 uppercase">disponíveis</span></p>
           </div>
           <div className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 font-black mb-1">
                 <Flame size={18}/> Turbo 5 Dias
              </div>
              <p className="text-2xl font-black text-blue-800">{perfil?.creditosTurbo || 0} <span className="text-xs font-bold text-blue-600 uppercase">disponíveis</span></p>
           </div>
        </div>

        {/* LOJA DE RECOMPENSAS */}
        <div>
           <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2"><Gift className="text-primary"/> Loja de Recompensas</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                 <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-1"><Rocket size={16} className="text-green-500"/> Sobe pro Topo</h4>
                    <p className="text-xs text-gray-500 mt-1">Impulsione 1 anúncio agora</p>
                 </div>
                 <button 
                   onClick={() => comprarItem('topo', CUSTO_TOPO)}
                   className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${perfil?.moedas >= CUSTO_TOPO ? 'bg-amber-400 hover:bg-amber-500 text-amber-900' : 'bg-gray-100 text-gray-400'}`}
                 >
                    <Coins size={16}/> {CUSTO_TOPO}
                 </button>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                 <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-1"><Flame size={16} className="text-blue-500"/> Destaque Turbo</h4>
                    <p className="text-xs text-gray-500 mt-1">5 dias de visibilidade máxima</p>
                 </div>
                 <button 
                   onClick={() => comprarItem('turbo', CUSTO_TURBO)}
                   className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${perfil?.moedas >= CUSTO_TURBO ? 'bg-amber-400 hover:bg-amber-500 text-amber-900' : 'bg-gray-100 text-gray-400'}`}
                 >
                    <Coins size={16}/> {CUSTO_TURBO}
                 </button>
              </div>
           </div>
        </div>

        {/* MISSÕES DIÁRIAS & INDICAÇÃO */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
           <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Sparkles className="text-amber-500"/> Ganhe mais Moedas</h3>
           
           <div className="space-y-6">
              
              {/* Indique um Amigo */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100">
                 <div className="flex gap-4 items-start">
                    <div className="bg-amber-400 text-white p-3 rounded-xl shadow-sm mt-1">
                       <Share2 size={24} />
                    </div>
                    <div className="flex-1">
                       <h4 className="font-black text-gray-900 text-lg mb-1">Indique e Ganhe</h4>
                       <p className="text-sm text-gray-600 mb-4">Ganhe <strong className="text-amber-600">50 moedas</strong> para cada amigo que se cadastrar usando seu link exclusivo. O seu amigo também ganha 20 moedas!</p>
                       
                       <div className="flex gap-2">
                         <input 
                           readOnly 
                           value={linkIndicacao} 
                           className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm text-gray-500 truncate focus:outline-none font-medium"
                         />
                         <button 
                           onClick={shareLink}
                           className="bg-amber-500 hover:bg-amber-600 text-white p-3.5 rounded-xl transition-all shadow-sm transform active:scale-95"
                         >
                           {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                         </button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Login Diário / Ofensiva */}
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl">
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

              <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl">
                 <AlertCircle size={20} className="text-blue-500 shrink-0 mt-0.5" />
                 <p className="text-xs text-blue-800 font-medium leading-relaxed">
                   Em breve novas missões! Continue utilizando o Desapego Piauí para acumular mais moedas e destacar todos os seus anúncios de graça.
                 </p>
              </div>

           </div>
        </div>

      </div>
    </div>
  )
}