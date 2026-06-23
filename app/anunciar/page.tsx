'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2, AlertCircle, CheckCircle, Gift, MailWarning, MapPin, DollarSign, Home, Car, Smartphone, Zap, Shirt, ShoppingBag, Wrench, Baby, Bike, Briefcase, Phone, User, Rocket, Info, Sparkles, Flame, Check } from 'lucide-react'

const CATEGORIAS = [
  "Imóveis", "Veículos", "Eletrônicos", "Para Casa", 
  "Moda e Beleza", "Serviços", "Bebês e Crianças", 
  "Esportes", "Vagas de Emprego", "Outros"
]

const DESCRICOES_CATEGORIAS = {
  "Imóveis": { texto: "Casas, apartamentos, terrenos, fazendas, aluguéis e pontos comerciais.", icon: Home, cor: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  "Veículos": { texto: "Carros, motos, caminhões, barcos, peças automotivas e acessórios.", icon: Car, cor: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
  "Eletrônicos": { texto: "Celulares, notebooks, computadores, TVs, videogames, câmeras e áudio.", icon: Smartphone, cor: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
  "Para Casa": { texto: "Móveis, eletrodomésticos, decoração, utilidades e materiais de construção.", icon: Zap, cor: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  "Moda e Beleza": { texto: "Roupas, calçados, bolsas, relógios, óculos, maquiagem e perfumaria.", icon: Shirt, cor: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
  "Serviços": { texto: "Pedreiros, eletricistas, fretes, montadores, design, limpeza e autônomos.", icon: Wrench, cor: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  "Bebês e Crianças": { texto: "Carrinhos, berços, roupinhas, brinquedos e acessórios infantis.", icon: Baby, cor: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  "Esportes": { texto: "Bicicletas, academia, pesca, camping e artigos esportivos.", icon: Bike, cor: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  "Vagas de Emprego": { texto: "Ofertas de trabalho, estágios, bicos e oportunidades na região.", icon: Briefcase, cor: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" },
  "Outros": { texto: "Itens colecionáveis, instrumentos musicais, agro, máquinas e mais.", icon: ShoppingBag, cor: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" }
}

const PALAVRAS_PROIBIDAS = [
  'arma', 'revólver', 'pistola', 'munição', 'droga', 'maconha', 'cocaína', 
  'hack', 'clonado', 'falsificado', 'réplica perfeita', 'nota falsa',
  'caralho', 'porra', 'buceta', 'puta', 'merda', 'cu',
  'cachorro', 'cachorros', 'cão', 'cães', 'filhote', 'pitbull', 'buldogue',
  'remédio', 'remedio', 'medicamento', 'receita médica', 'anabolizante', 'tarja preta', 'abortivo', 'sibutramina'
]

// 🚀 PLANOS COM DESCRIÇÕES DETALHADAS (Checklists)
const PLANOS_BASE = [
  { id: 1, nome: 'Sobe pro Topo', dias: 20, valor: 5.00, fotos: 10, desc: 'Fique sempre à frente dos gratuitos', detalhes: ['Aparece acima dos anúncios grátis', 'Recebe até 3x mais cliques', 'Ideal para vendas rápidas'] },
  { id: 2, nome: 'Destaque Turbo', dias: 20, valor: 9.90, fotos: 10, desc: 'Aparece no formato Stories (Bolinhas)', detalhes: ['Destaque visual colorido nas listas', 'Aparece na barra de Stories no topo', 'Recebe até 5x mais visualizações'] },
  { id: 3, nome: 'Ouro / Urgente', dias: 20, valor: 19.90, fotos: 10, desc: 'Fixo no Carrossel Máximo do site', detalhes: ['Sua foto gigante no topo do site', 'Borda dourada de altíssimo luxo', 'A melhor opção para Imóveis e Carros'] }
]
const PLANO_PRESENTE = { id: 0, nome: 'Básico (Grátis)', dias: 7, valor: 0, fotos: 5, desc: 'Anúncio simples na lista geral', detalhes: ['Vai descendo conforme outros pagam', 'Dura apenas 7 dias', 'Máximo de 5 fotos'] };

const removerAcentos = (texto: string) => {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const mascaraTelefone = (v: string) => {
  v = v.replace(/\D/g, ""); 
  if (v.length > 11) v = v.substring(0, 11); 
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); 
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");    
  return v;
};

const comprimirImagem = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 1080;

        if (width > height) {
          if (width > max_size) { height *= max_size / width; width = max_size; }
        } else {
          if (height > max_size) { width *= max_size / height; height = max_size; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file); 
          }
        }, 'image/webp', 0.8);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function AnunciarPage() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState('')
  
  const [localizacao, setLocalizacao] = useState('') 
  const [telefone, setTelefone] = useState('')
  const [nomeAutor, setNomeAutor] = useState('')

  const [fotos, setFotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [planoId, setPlanoId] = useState<number | null>(null)
  const [botTrap, setBotTrap] = useState('')
  const [loading, setLoading] = useState(false)
  const [comprimindo, setComprimindo] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [emailVerificado, setEmailVerificado] = useState(true)
  const [jaUsouGratis, setJaUsouGratis] = useState(true) 
  
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login')
      } else {
        setUser(u)
        
        if (!u.emailVerified) {
          setEmailVerificado(false)
          return; 
        } else {
          setEmailVerificado(true)

          try {
             const userDocRef = doc(db, 'usuarios', u.uid);
             const userDocSnap = await getDoc(userDocRef);
             if (userDocSnap.exists()) {
                const uData = userDocSnap.data();
                if (uData.telefone) setTelefone(uData.telefone);
                if (uData.nome) setNomeAutor(uData.nome);
                else setNomeAutor(u.displayName || u.email?.split('@')[0] || '');
             } else {
                setNomeAutor(u.displayName || u.email?.split('@')[0] || '');
             }
          } catch(e) { console.error("Erro ao buscar perfil", e); }
          
          const localJaUsou = localStorage.getItem('jaUsouGratis_dev')
          if (localJaUsou) {
             setJaUsouGratis(true)
          } else {
             try {
               const q = query(
                 collection(db, 'anuncios'), 
                 where('vendedorId', '==', u.uid), 
                 where('planoId', '==', 0)
               )
               const snap = await getDocs(q)
               if (!snap.empty) {
                  setJaUsouGratis(true)
                  localStorage.setItem('jaUsouGratis_dev', 'true')
               } else {
                  setJaUsouGratis(false) 
               }
             } catch (error) {
               console.error("Erro ao verificar plano grátis:", error)
             }
          }
        }
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleReenviarEmail = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        alert("E-mail reenviado com sucesso! Verifique sua caixa de entrada e a pasta de Spam.");
      } catch (error) {
        alert("Aguarde um momento antes de tentar reenviar o e-mail novamente.");
      }
    }
  }

  const isFormIncompleto = !titulo.trim() || !descricao.trim() || !preco || !categoria || !localizacao.trim() || !telefone.trim() || !nomeAutor.trim() || planoId === null;

  const planosDisponiveis = jaUsouGratis ? PLANOS_BASE : [PLANO_PRESENTE, ...PLANOS_BASE];
  const maxFotosPermitidas = planoId === 0 ? 5 : 10;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      if (fotos.length + selectedFiles.length > maxFotosPermitidas) {
        alert(`Você pode adicionar no máximo ${maxFotosPermitidas} fotos para o plano selecionado. (Planos de Destaque permitem até 10 fotos).`)
        return
      }
      
      setComprimindo(true)
      try {
        const compressedFiles = await Promise.all(selectedFiles.map(file => comprimirImagem(file)))
        setFotos(prev => [...prev, ...compressedFiles])
        const selectedPreviews = compressedFiles.map(file => URL.createObjectURL(file))
        setPreviews(prev => [...prev, ...selectedPreviews])
      } catch (error) {
        alert("Erro ao processar uma das imagens. Tente com outra foto.")
      } finally {
        setComprimindo(false)
      }
    }
  }

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (botTrap !== '') {
      console.warn("Bloqueado por suspeita de bot."); return; 
    }
    if (isFormIncompleto) return

    if (telefone.replace(/\D/g, '').length < 10) {
      alert("⚠️ Por favor, insira um número de WhatsApp válido com DDD.");
      return;
    }

    if (planoId === 0 && fotos.length > 5) {
      alert("O plano Grátis permite no máximo 5 fotos. Remova algumas fotos ou escolha um plano Destaque.");
      return;
    }

    const textoParaVerificar = removerAcentos(`${titulo} ${descricao}`);
    const temPalavraProibida = PALAVRAS_PROIBIDAS.some(palavra => {
      const palavraLimpa = removerAcentos(palavra);
      const regex = new RegExp(`\\b${palavraLimpa}\\b`, 'gi');
      return regex.test(textoParaVerificar);
    });

    if (temPalavraProibida) {
      alert("⚠️ BLOQUEADO: Seu anúncio contém palavras proibidas. Por favor, altere o título e a descrição.");
      return;
    }

    setLoading(true)
    try {
      let precoNumerico = 0
      if (preco) {
        const precoLimpo = preco.toString().replace(/\./g, '').replace(',', '.')
        precoNumerico = parseFloat(precoLimpo)
      }

      if (isNaN(precoNumerico) || precoNumerico <= 0) {
        alert("Por favor, insira um preço válido maior que zero.");
        setLoading(false); return;
      }

      try {
        await setDoc(doc(db, 'usuarios', user.uid), {
           nome: nomeAutor,
           telefone: telefone,
           email: user.email,
           atualizadoEm: serverTimestamp()
        }, { merge: true });
      } catch(e) { console.error("Erro ao salvar perfil do usuário", e); }

      const urls: string[] = []
      if (fotos.length > 0) {
        const idToken = await user.getIdToken();
        for (const foto of fotos) {
          const formData = new FormData()
          formData.append('image', foto)
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
            body: formData,
          })
          const data = await response.json()
          if (data.success) { urls.push(data.url || data.data.url) } 
          else { alert("Erro ao enviar foto: " + (data.error || "Tente novamente.")); }
        }
      }

      let statusFinal = 'pendente';
      if (planoId === 0) {
        if (jaUsouGratis) {
          alert("Acesso negado: Você já possui um anúncio grátis recente. Escolha um plano de destaque para publicar imediatamente.");
          setLoading(false); return;
        }
        statusFinal = 'ativo'; 
        localStorage.setItem('jaUsouGratis_dev', 'true'); 
      }

      const planoEscolhido = planosDisponiveis.find(p => p.id === planoId);
      const diasDuracao = planoEscolhido ? planoEscolhido.dias : 20; 
      const dataCalculada = new Date();
      dataCalculada.setDate(dataCalculada.getDate() + diasDuracao);

      const docRef = await addDoc(collection(db, 'anuncios'), {
        titulo,
        descricao,
        preco: precoNumerico,
        categoria,
        localizacao,
        telefone: telefone,
        autorNome: nomeAutor,
        fotos: urls,
        imagemUrl: urls.length > 0 ? urls[0] : null,
        vendedorId: user.uid,
        status: statusFinal, 
        planoId: planoId,
        visualizacoes: 0,
        criadoEm: serverTimestamp(),
        expiraEm: dataCalculada.toISOString()
      })

      if (user) {
         try {
            await addDoc(collection(db, 'logs'), {
               usuarioId: user.uid, acao: 'CRIOU', tituloAnuncio: titulo, criadoEm: new Date()
            });
         } catch (logError) {}
      }

      if (statusFinal === 'ativo') {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_KEY}` },
          body: JSON.stringify({ tipo: 'anuncio_aprovado', email: user.email, nome: nomeAutor || 'Vendedor', produto: titulo })
        }).catch(console.error);
      }

      if (planoId === 0) { router.push('/meus-anuncios'); } 
      else { router.push(`/pagamento/${docRef.id}`); }
      
    } catch (error) {
      console.error(error)
      alert("Erro ao publicar anúncio.")
      setLoading(false)
    } 
  }

  if (!emailVerificado && user) {
    return (
      <div className="bg-gray-50 min-h-screen py-10 px-4 flex items-center justify-center pb-28">
        <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailWarning size={40} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Verificação Necessária</h2>
          <p className="text-gray-600 font-medium mb-6 leading-relaxed">
            Para manter a segurança, confirme o seu e-mail (<strong className="text-gray-900">{user.email}</strong>).
          </p>
          <button onClick={() => window.location.reload()} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition-all mb-4">
            Já confirmei, recarregar página
          </button>
          <button onClick={handleReenviarEmail} className="text-primary font-bold hover:underline text-sm">
            Reenviar e-mail de confirmação
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-primary mb-8 uppercase italic tracking-tight">O que você está anunciando?</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100 relative">
          
          <input type="text" name="website" value={botTrap} onChange={(e) => setBotTrap(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

          <div>
            <div className="flex justify-between items-end mb-4">
               <label className="block text-primary font-bold flex items-center gap-2">
                 Fotos do produto 
                 {comprimindo && <Loader2 size={16} className="animate-spin text-accent"/>}
               </label>
               <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                 {fotos.length}/{maxFotosPermitidas} fotos
               </span>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md"><X size={14} strokeWidth={3}/></button>
                </div>
              ))}
              {fotos.length < maxFotosPermitidas && (
                <label className={`aspect-square border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center text-primary transition bg-gray-50 ${comprimindo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/5'}`}>
                  <Camera size={32} />
                  <span className="text-[10px] font-bold mt-1">{comprimindo ? 'PROCESSANDO...' : 'ADICIONAR'}</span>
                  <input disabled={comprimindo} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Título do anúncio*</label>
            <input required type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800" placeholder="Ex: iPhone 13 Pro Max 256GB" />
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Categoria*</label>
            <select required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800">
              <option value="">Selecione uma categoria</option>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {categoria && DESCRICOES_CATEGORIAS[categoria as keyof typeof DESCRICOES_CATEGORIAS] && (
              <div className={`mt-3 p-4 rounded-xl border flex gap-3 items-start transition-all duration-300 ease-in-out ${DESCRICOES_CATEGORIAS[categoria as keyof typeof DESCRICOES_CATEGORIAS].bg} ${DESCRICOES_CATEGORIAS[categoria as keyof typeof DESCRICOES_CATEGORIAS].border}`}>
                 {(() => {
                    const InfoCat = DESCRICOES_CATEGORIAS[categoria as keyof typeof DESCRICOES_CATEGORIAS];
                    const Icone = InfoCat.icon;
                    return (
                       <>
                          <div className={`p-2 rounded-full bg-white shadow-sm shrink-0 ${InfoCat.cor}`}><Icone size={20} /></div>
                          <div>
                             <p className={`font-black text-sm uppercase tracking-wider mb-0.5 ${InfoCat.cor}`}>{categoria}</p>
                             <p className="text-gray-600 text-sm font-medium leading-snug">{InfoCat.texto}</p>
                          </div>
                       </>
                    )
                 })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Preço (R$)*</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" size={20} />
              <input type="text" inputMode="numeric" placeholder="0,00" required value={preco}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, '');
                  if (!valor) { setPreco(''); return; }
                  setPreco((Number(valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                }}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Descrição*</label>
            <textarea required rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800 resize-none" placeholder="Detalhes sobre o estado do produto..."></textarea>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <User size={24} className="text-primary" /> Seus Dados e Localização
             </h2>
             <p className="text-sm text-gray-500 font-medium mb-4">Estes dados serão salvos no seu perfil e exibidos no anúncio para os compradores.</p>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-primary font-bold mb-2">Como deseja ser chamado?*</label>
                  <input required type="text" value={nomeAutor} onChange={(e) => setNomeAutor(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800" placeholder="Ex: João Silva" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-primary font-bold mb-2 flex items-center gap-2">
                      <Phone size={18} /> Seu WhatsApp*
                    </label>
                    <input 
                       required type="tel" maxLength={15}
                       value={telefone} 
                       onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} 
                       className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800" 
                       placeholder="(86) 99999-9999" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-primary font-bold mb-2 flex items-center gap-2">
                      <MapPin size={18} /> Cidade / Bairro*
                    </label>
                    <input required type="text" value={localizacao} onChange={(e) => setLocalizacao(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800" placeholder="Ex: Teresina - Dirceu" />
                  </div>
                </div>
             </div>
          </div>

          {/* SESSÃO DE PLANOS COM INFORMATIVOS DETALHADOS */}
          <div className="pt-6 border-t border-gray-100">
             <h2 className="text-xl font-black text-gray-900 mb-2">Escolha um Plano para destacar*</h2>
             <p className="text-sm text-gray-500 mb-6">Quanto maior o destaque, mais rápido você vende no Piauí.</p>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
               {planosDisponiveis.map((p) => {
                 const isGratis = p.valor === 0;
                 return (
                   <div 
                      key={p.id}
                      onClick={() => {
                         // Trava para impedir selecionar grátis com mais de 5 fotos
                         if (p.id === 0 && fotos.length > 5) {
                            alert(`O plano Grátis permite no máximo 5 fotos. Você enviou ${fotos.length}. Remova algumas fotos ou escolha um Plano Destaque.`);
                            return;
                         }
                         setPlanoId(p.id);
                      }}
                      className={`cursor-pointer border-2 rounded-2xl p-4 transition-all relative flex flex-col ${planoId === p.id ? (isGratis ? 'border-green-500 bg-green-50 shadow-md scale-[1.02]' : 'border-amber-400 bg-amber-50 shadow-md scale-[1.02]') : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                   >
                      {/* Selos (Badges) */}
                      {p.id === 0 && (<div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1"><Gift size={12}/> 7 Dias Grátis</div>)}
                      {p.id === 1 && (<div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1"><Rocket size={12}/> No Topo</div>)}
                      {p.id === 2 && (<div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1"><Flame size={12}/> Stories</div>)}
                      {p.id === 3 && (<div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1"><Sparkles size={12}/> Ouro</div>)}

                      <div className="flex justify-between items-start mb-2 mt-2">
                         <h3 className={`font-bold ${isGratis ? 'text-green-700' : 'text-gray-800'}`}>{p.nome}</h3>
                         {planoId === p.id && <CheckCircle className={isGratis ? 'text-green-600' : 'text-amber-500'} size={20}/>}
                      </div>
                      
                      <p className={`text-2xl font-black mb-1 ${isGratis ? 'text-green-600' : 'text-gray-900'}`}>
                        {isGratis ? 'Grátis' : `R$ ${p.valor.toFixed(2).replace('.', ',')}`}
                      </p>
                      
                      {/* Mostra a quantidade de fotos e dias de forma clara */}
                      <div className="flex items-center gap-2 mb-3 mt-1">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isGratis ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {p.dias} dias no ar
                         </span>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isGratis ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            Até {p.fotos} fotos
                         </span>
                      </div>
                      
                      <p className={`text-xs font-medium mb-3 ${isGratis ? 'text-green-700/80' : 'text-gray-600'}`}>{p.desc}</p>
                      
                      {/* INFORMATIVOS DETALHADOS (Checklists) */}
                      <ul className="mt-auto space-y-1.5 border-t border-gray-100 pt-3">
                         {p.detalhes.map((detalhe, idx) => (
                           <li key={idx} className="flex items-start gap-1.5 text-[10px] md:text-xs text-gray-500 font-medium">
                              <Check size={14} className={isGratis ? 'text-green-500 shrink-0' : 'text-amber-500 shrink-0'} />
                              <span className="leading-tight">{detalhe}</span>
                           </li>
                         ))}
                      </ul>
                   </div>
                 )
               })}
             </div>

             {/* 👇 AVISOS DE TRANSPARÊNCIA: TAXAS E MOEDAS 👇 */}
             <div className="space-y-3">
               <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs font-medium text-blue-800">
                 <Info className="shrink-0 mt-0.5 text-blue-500" size={16} />
                 <p><strong>Taxas de Transação:</strong> Para planos pagos, a taxa de processamento financeiro será calculada para você na próxima tela (PIX).</p>
               </div>
             </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading || isFormIncompleto || comprimindo}
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 transform
                ${(isFormIncompleto || comprimindo) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-accent hover:bg-accent-dark text-white hover:-translate-y-0.5'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'PUBLICAR ANÚNCIO'}
            </button>
            
            {isFormIncompleto && (
              <p className="flex items-center gap-2 text-red-500 text-sm mt-4 font-bold justify-center">
                <AlertCircle size={16} /> Preencha todos os campos e escolha um plano.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}