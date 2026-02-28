'use client'
import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const CATEGORIAS = ["Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]

// NOVOS PLANOS ATUALIZADOS
const PLANOS = [
  { id: 1, nome: 'Diário', dias: 1, valor: 10, desc: '1 dia de destaque' },
  { id: 2, nome: 'Semanal', dias: 7, valor: 65, desc: '7 dias de destaque' },
  { id: 3, nome: 'Quinzenal', dias: 15, valor: 140, desc: '15 dias de destaque' },
  { id: 4, nome: 'Mensal', dias: 30, valor: 280, desc: '30 dias de destaque' }
]

export default function AnunciarPage() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [planoId, setPlanoId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login')
      else setUser(u)
    })
    return () => unsubscribe()
  }, [router])

  const isFormIncompleto = !titulo.trim() || !descricao.trim() || !preco || !categoria || planoId === null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      // TRAVA DE SEGURANÇA: Limite de 10 fotos
      if (fotos.length + selectedFiles.length > 10) {
        alert("Você pode adicionar no máximo 10 fotos por anúncio.")
        return
      }

      setFotos(prev => [...prev, ...selectedFiles])
      const selectedPreviews = selectedFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...selectedPreviews])
    }
  }

  const removeFoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormIncompleto) return

    setLoading(true)
    try {
      const urls: string[] = []
      
      // COMUNICAÇÃO SEGURA COM NOSSA API INTERNA
      if (fotos.length > 0) {
        const idToken = await user.getIdToken();

        for (const foto of fotos) {
          const formData = new FormData()
          formData.append('image', foto)

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`
            },
            body: formData,
          })

          const data = await response.json()
          
          if (data.success) {
            urls.push(data.data.url) 
          } else {
            console.error("Erro no upload seguro:", data)
            alert("Erro ao enviar foto: " + (data.error || "Tente novamente."));
          }
        }
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

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-black text-primary mb-8 uppercase italic tracking-tight">O que você está desapegando?</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-gray-100">
          
          <div>
            <div className="flex justify-between items-end mb-4">
               <label className="block text-primary font-bold">Fotos do produto (Opcional)</label>
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
                <label className="aspect-square border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center text-primary cursor-pointer hover:bg-primary/5 transition bg-gray-50">
                  <Camera size={32} />
                  <span className="text-[10px] font-bold mt-1">ADICIONAR</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
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
               {PLANOS.map((p) => (
                 <div 
                    key={p.id}
                    onClick={() => setPlanoId(p.id)}
                    className={`cursor-pointer border-2 rounded-2xl p-4 transition-all ${planoId === p.id ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-primary/30 bg-gray-50'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-gray-800">{p.nome}</h3>
                       {planoId === p.id && <CheckCircle className="text-primary" size={20}/>}
                    </div>
                    <p className="text-2xl font-black text-green-600 mb-1">
                      R$ {p.valor.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">{p.dias} dias ativo</p>
                    <p className="text-xs text-primary font-bold mt-2 bg-white inline-block px-2 py-1 rounded-md border border-gray-200">Até 10 fotos</p>
                 </div>
               ))}
             </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading || isFormIncompleto}
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 transform
                ${isFormIncompleto ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-accent hover:bg-accent-dark text-white hover:-translate-y-0.5'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : 'IR PARA PAGAMENTO'}
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