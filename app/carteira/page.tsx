'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Coins, Flame, Copy, CheckCircle, Share2, Rocket, Sparkles, ChevronLeft, Gift, AlertCircle, ShoppingBag, Info, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast' // 🚀 Importando os avisos bonitos

export default function CarteiraPage() {
   const [loading, setLoading] = useState(true)
   const [user, setUser] = useState<any>(null)
   const [perfil, setPerfil] = useState<any>(null)

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

            if (data.moedas === undefined) {
               const codigoGerado = Math.random().toString(36).substring(2, 8).toUpperCase();
               const novosDados = {
                  moedas: 10,
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
         toast.error("Erro ao carregar seus dados.");
      } finally {
         setLoading(false);
      }
   }

   const linkIndicacao = typeof window !== 'undefined' && perfil?.codigoIndicacao
      ? `${window.location.origin}/cadastro?ref=${perfil.codigoIndicacao}`
      : '';

   const copiarLink = () => {
      if (!linkIndicacao) return;

      if (navigator.share) {
         navigator.share({
            title: 'Desapego Piauí - Ganhe Destaque Grátis!',
            text: 'Cadastre-se com meu link no Desapego Piauí e ganhe recompensas para vender seus produtos mais rápido!',
            url: linkIndicacao
         }).catch(console.error);
      } else {
         navigator.clipboard.writeText(linkIndicacao);
         toast.success('Link copiado! Envie para seus amigos.');
      }
   }

   const comprarItem = async (tipo: 'topo' | 'turbo' | 'ouro', custo: number) => {
      if (perfil.moedas < custo) {
         toast.error("Você não tem moedas suficientes!");
         return;
      }

      if (!window.confirm(`Deseja gastar ${custo} moedas para comprar este item?`)) return;

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

         toast.success("Compra realizada com sucesso! O destaque já está no seu inventário.");
      } catch (error) {
         console.error("Erro ao comprar:", error);
         toast.error("Erro ao processar compra.");
      }
   }

   if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-amber-500" size={48} /></div>

   return (
      <div className="bg-gray-50 min-h-screen pb-28 md:pb-10 font-sans">

         {/* 🚀 HEADER PREMIUM ANIMADO */}
         <div className="bg-gradient-to-br from-indigo-950 via-primary to-purple-900 pt-8 pb-24 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            
            {/* Efeitos de luz no fundo */}
            <div className="absolute top-10 right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

            <div className="max-w-4xl mx-auto relative z-10">
               <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => router.push('/')} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition backdrop-blur-sm"><ChevronLeft size={24} /></button>
                  <h1 className="text-2xl font-black text-white tracking-tight">Minha Carteira</h1>
               </div>

               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-[2rem] flex items-center justify-between shadow-lg">
                  <div>
                     <p className="text-amber-200/80 font-bold uppercase tracking-widest text-xs mb-1">Saldo Atual</p>
                     <div className="flex items-end gap-2">
                        <h2 className="text-5xl md:text-6xl font-black text-amber-400 drop-shadow-md">{perfil?.moedas || 0}</h2>
                        <span className="text-amber-200 font-bold mb-1.5 md:mb-2 text-lg">Moedas</span>
                     </div>
                  </div>
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-amber-300 to-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-bounce-slow">
                     <Coins size={36} className="text-amber-950" />
                  </div>
               </div>
            </div>
         </div>

         <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-20 space-y-8">

            {/* 🚀 INVENTÁRIO (Créditos Comprados) */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
               <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                 <ShoppingBag className="text-primary" /> Seu Inventário
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex flex-col items-center text-center justify-center">
                     <div className="bg-blue-100 p-2 rounded-full mb-2"><Rocket size={20} className="text-blue-600" /></div>
                     <p className="text-2xl font-black text-blue-900 leading-none">{perfil?.creditosTopo || 0}</p>
                     <span className="text-[10px] font-bold text-blue-600/80 uppercase tracking-widest mt-1">Topo Disponíveis</span>
                  </div>
                  
                  <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 flex flex-col items-center text-center justify-center">
                     <div className="bg-purple-100 p-2 rounded-full mb-2"><Flame size={20} className="text-purple-600" /></div>
                     <p className="text-2xl font-black text-purple-900 leading-none">{perfil?.creditosTurbo || 0}</p>
                     <span className="text-[10px] font-bold text-purple-600/80 uppercase tracking-widest mt-1">Turbo Disponíveis</span>
                  </div>
                  
                  <div className="col-span-2 md:col-span-1 bg-amber-50/50 rounded-2xl p-4 border border-amber-200 flex flex-col items-center text-center justify-center shadow-inner">
                     <div className="bg-amber-100 p-2 rounded-full mb-2"><Sparkles size={20} className="text-amber-600" /></div>
                     <p className="text-3xl font-black text-amber-700 leading-none">{perfil?.creditosOuro || 0}</p>
                     <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest mt-1">Ouro Disponíveis</span>
                  </div>
               </div>
            </div>

            {/* 🚀 LOJA DE RECOMPENSAS */}
            <div>
               <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                 <Gift className="text-primary" /> Loja de Recompensas
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                  
                  {/* CARD TOPO */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden group hover:border-blue-300 transition-colors">
                     <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
                        <h4 className="font-black flex items-center gap-2 text-lg"><Rocket size={20} /> Sobe pro Topo</h4>
                     </div>
                     <div className="p-5 flex-1 flex flex-col">
                        <p className="text-sm text-gray-500 font-medium mb-4 flex-1">Impulsione 1 anúncio para o 1º lugar da lista e saia na frente dos gratuitos.</p>
                        
                        <button
                           onClick={() => perfil?.moedas >= CUSTO_TOPO && comprarItem('topo', CUSTO_TOPO)}
                           className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black transition-all shadow-sm ${perfil?.moedas >= CUSTO_TOPO ? 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                           {perfil?.moedas >= CUSTO_TOPO ? (
                             <><Coins size={18} /> Comprar por {CUSTO_TOPO}</>
                           ) : (
                             <>Faltam {CUSTO_TOPO - perfil?.moedas} moedas</>
                           )}
                        </button>
                     </div>
                  </div>

                  {/* CARD TURBO */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden group hover:border-purple-300 transition-colors">
                     <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white">
                        <h4 className="font-black flex items-center gap-2 text-lg"><Flame size={20} /> Destaque Turbo</h4>
                     </div>
                     <div className="p-5 flex-1 flex flex-col">
                        <p className="text-sm text-gray-500 font-medium mb-4 flex-1">Apareça no formato Stories com borda colorida e ganhe o dobro de cliques.</p>
                        
                        <button
                           onClick={() => perfil?.moedas >= CUSTO_TURBO && comprarItem('turbo', CUSTO_TURBO)}
                           className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black transition-all shadow-sm ${perfil?.moedas >= CUSTO_TURBO ? 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                           {perfil?.moedas >= CUSTO_TURBO ? (
                             <><Coins size={18} /> Comprar por {CUSTO_TURBO}</>
                           ) : (
                             <>Faltam {CUSTO_TURBO - perfil?.moedas} moedas</>
                           )}
                        </button>
                     </div>
                  </div>

                  {/* CARD OURO */}
                  <div className="bg-white rounded-2xl shadow-md border-2 border-amber-200 flex flex-col justify-between overflow-hidden group hover:border-amber-400 transition-colors relative">
                     <div className="absolute top-0 right-0 bg-white/20 w-32 h-32 rounded-full blur-2xl"></div>
                     <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white relative z-10">
                        <h4 className="font-black flex items-center gap-2 text-lg drop-shadow-sm"><Sparkles size={20} /> Ouro Urgente</h4>
                     </div>
                     <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-amber-50/30 to-white">
                        <p className="text-sm text-gray-600 font-medium mb-4 flex-1">O pacote supremo. Fique gigante no Carrossel Principal do topo do site.</p>
                        
                        <button
                           onClick={() => perfil?.moedas >= CUSTO_OURO && comprarItem('ouro', CUSTO_OURO)}
                           className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black transition-all shadow-sm ${perfil?.moedas >= CUSTO_OURO ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white active:scale-95 border-b-[4px] border-orange-600 active:border-b-0 active:translate-y-[4px]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                           {perfil?.moedas >= CUSTO_OURO ? (
                             <><Coins size={18} /> Comprar por {CUSTO_OURO}</>
                           ) : (
                             <>Faltam {CUSTO_OURO - perfil?.moedas} moedas</>
                           )}
                        </button>
                     </div>
                  </div>

               </div>
            </div>

            {/* 🚀 COMO GANHAR MOEDAS & OFENSIVA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
               
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
                  <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                     <CheckCircle className="text-green-500" /> Como ganhar?
                  </h2>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                        <div className="flex flex-col">
                           <span className="font-bold text-gray-800">Criar 1º anúncio</span>
                           <span className="text-xs text-gray-500 font-medium">Bônus de boas-vindas</span>
                        </div>
                        <span className="bg-green-100 text-green-700 font-black text-xs px-3 py-1.5 rounded-lg">+10 Moedas</span>
                     </div>

                     <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                           <span className="font-bold text-gray-800">Indicar um amigo</span>
                           <span className="text-xs text-gray-500 font-medium">Quando ele criar 1 anúncio</span>
                        </div>
                        <span className="bg-amber-100 text-amber-700 font-black text-xs px-3 py-1.5 rounded-lg">+50 Moedas</span>
                     </div>
                     <button onClick={copiarLink} className="w-full mt-4 bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md">
                        <Share2 size={18} /> Copiar meu Link
                     </button>
                  </div>
               </div>

               <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-[2rem] shadow-sm border border-orange-100 p-6 md:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  <Flame size={80} className="text-orange-500/20 absolute -right-4 -bottom-4" />
                  <div className="bg-white p-4 rounded-full shadow-md mb-4 relative z-10">
                     <Flame size={40} className="text-orange-500" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 relative z-10">Ofensiva Diária</h4>
                  <p className="text-sm text-gray-600 font-medium mt-2 mb-6 relative z-10">Acesse o site todos os dias sem quebrar a corrente e ganhe moedas automáticas.</p>
                  
                  <div className="flex items-center justify-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-orange-100 relative z-10">
                     <span className="text-3xl font-black text-orange-500">{perfil?.diasSeguidos || 1}</span>
                     <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-left leading-tight">Dias<br/>Seguidos</span>
                  </div>
               </div>

            </div>

         </div>
      </div>
   )
}