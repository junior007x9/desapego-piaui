'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore'
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2, AlertCircle, CheckCircle, Gift, MailWarning, ShieldAlert } from 'lucide-react'

const CATEGORIAS = ["Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]

// LISTA NEGRA DE PALAVRAS PROIBIDAS
const PALAVRAS_PROIBIDAS = [
  'arma', 'revólver', 'pistola', 'munição', 'droga', 'maconha', 'cocaína', 
  'hack', 'clonado', 'falsificado', 'réplica perfeita', 'nota falsa',
  'caralho', 'porra', 'buceta', 'puta', 'merda', 'cu'
]

// PLANOS PAGOS PADRÃO
const PLANOS_BASE = [
  { id: 1, nome: 'Diário', dias: 1, valor: 10, desc: '1 dia de destaque' },
  { id: 2, nome: 'Semanal', dias: 7, valor: 65, desc: '7 dias de destaque' },
  { id: 3, nome: 'Quinzenal', dias: 15, valor: 140, desc: '15 dias de destaque' },
  { id: 4, nome: 'Mensal', dias: 30, valor: 280, desc: '30 dias de destaque' }
]

// 🚀 NOVA FUNÇÃO: COMPRESSOR MÁGICO DE IMAGENS EM ALTA DEFINIÇÃO
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
        
        // Tamanho máximo aumentado para 1600px (Permite zoom com qualidade)
        const max_size = 1600;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Qualidade aumentada para 90% (0.9)
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file); // Se falhar, devolve a original
          }
        }, 'image/jpeg', 0.9);
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
  const [fotos, setFotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [planoId, setPlanoId] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [comprimindo, setComprimindo] = useState(false) // Estado para mostrar que está a processar fotos
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
        
        // 1. TRAVA DE SEGURANÇA: O E-MAIL FOI CONFIRMADO?
        if (!u.emailVerified) {
          setEmailVerificado(false)
          return; 
        } else {
          setEmailVerificado(true)
          
          // 2. VERIFICA SE JÁ USOU O PLANO GRÁTIS
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

  const isFormIncompleto = !titulo.trim() || !descricao.trim() || !preco || !categoria || planoId === null;

  const PLANO_GRATIS = { id: 0, nome: 'Boas-Vindas (Grátis)', dias: 1, valor: 0, desc: '1 dia grátis (Válido 1x por aparelho/conta)' };
  const planosDisponiveis = jaUsouGratis ? PLANOS_BASE : [PLANO_GRATIS, ...PLANOS_BASE];

  // 🚀 ADICIONÁMOS A COMPRESSÃO AQUI!
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      if (fotos.length + selectedFiles.length > 10) {
        alert("Você pode adicionar no máximo 10 fotos por anúncio.")
        return
      }

      setComprimindo(true)
      try {
        // Comprime todas as fotos selecionadas antes de as guardar na memória
        const compressedFiles = await Promise.all(selectedFiles.map(file => comprimirImagem(file)))
        
        setFotos(prev => [...prev, ...compressedFiles])
        const selectedPreviews = compressedFiles.map(file => URL.createObjectURL(file))
        setPreviews(prev => [...prev, ...selectedPreviews])
      } catch (error) {
        console.error("Erro ao comprimir imagem", error)
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
    if (isFormIncompleto) return

    const textoParaVerificar = `${titulo.toLowerCase()} ${descricao.toLowerCase()}`;
    const temPalavraProibida = PALAVRAS_PROIBIDAS.some(palavra => textoParaVerificar.includes(palavra));

    if (temPalavraProibida) {
      alert("⚠️ BLOQUEADO: Seu anúncio contém palavras proibidas que violam nossos Termos de Segurança e Uso. Por favor, altere o título e a descrição.");
      return;
    }

    setLoading(true)
    try {
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
          
          if (data.success) {
            urls.push(data.url || data.data.url) 
          } else {
            console.error("Erro no upload seguro:", data)
            alert("Erro ao enviar foto: " + (data.error || "Tente novamente."));
          }
        }
      }

      if (planoId === 0) {
         localStorage.setItem('jaUsouGratis_dev', 'true');
      }

      const docRef = await addDoc(collection(db, 'anuncios'), {
        titulo,
        descricao,
        preco: parseFloat(preco.replace(',', '.')),
        categoria,
        fotos: urls,
        imagemUrl: urls.length > 0 ? urls[0] : null,
        vendedorId: user.uid,
        status: 'pendente', 
        planoId: planoId,
        visualizacoes: 0,
        criadoEm: serverTimestamp()
      })

      router.push(`/pagamento/${docRef.id}`)
      
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
            Para manter a segurança do Desapego Piauí, você precisa confirmar o seu e-mail (<strong className="text-gray-900">{user.email}</strong>) antes de publicar um anúncio.
          </p>

          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3 text-sm text-orange-800 text-left mb-8">
             <ShieldAlert className="shrink-0 text-orange-500" size={20} />
             <p>Esta é uma medida de segurança para evitar perfis falsos e fraudes na plataforma.</p>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition-all mb-4"
          >
            Já confirmei, recarregar página
          </button>
          
          <button 
            onClick={handleReenviarEmail} 
            className="text-primary font-bold hover:underline text-sm"
          >
            Não recebeu? Reenviar e-mail de confirmação
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-primary mb-8 uppercase italic tracking-tight">O que você está anunciando?</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
          
          <div>
            <div className="flex justify-between items-end mb-4">
               <label className="block text-primary font-bold flex items-center gap-2">
                 Fotos do produto (Opcional) 
                 {comprimindo && <Loader2 size={16} className="animate-spin text-accent"/>}
               </label>
               <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{fotos.length}/10 fotos</span>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md"><X size={14} strokeWidth={3}/></button>
                </div>
              ))}
              
              {fotos.length < 10 && (
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
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Preço (R$)*</label>
            <input required type="number" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800" placeholder="0,00" />
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Descrição*</label>
            <textarea required rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800 resize-none" placeholder="Detalhes sobre o estado do produto..."></textarea>
          </div>

          <div className="pt-6 border-t border-gray-100">
             <label className="block text-primary font-black text-xl mb-4">Escolha um Plano para destacar*</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {planosDisponiveis.map((p) => (
                 <div 
                    key={p.id}
                    onClick={() => setPlanoId(p.id)}
                    className={`cursor-pointer border-2 rounded-2xl p-4 transition-all relative overflow-hidden ${planoId === p.id ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-primary/30 bg-gray-50'}`}
                 >
                    {p.valor === 0 && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
                        <Gift size={12}/> Presente
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                       <h3 className={`font-bold ${p.valor === 0 ? 'text-green-700' : 'text-gray-800'}`}>{p.nome}</h3>
                       {planoId === p.id && <CheckCircle className={p.valor === 0 ? 'text-green-600' : 'text-primary'} size={20}/>}
                    </div>
                    <p className={`text-2xl font-black mb-1 ${p.valor === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      {p.valor === 0 ? 'Grátis' : `R$ ${p.valor.toFixed(2).replace('.', ',')}`}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">{p.desc}</p>
                 </div>
               ))}
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
                <AlertCircle size={16} /> Preencha os campos e escolha um plano.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}