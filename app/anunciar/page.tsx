'use client'
import { useState, useEffect } from 'react'
// Note que removemos o 'storage' do firebase, pois não vamos mais usá-lo
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const CATEGORIAS = ["Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]

// ==========================================
// COLOQUE SUA CHAVE DA API DO IMGBB AQUI 👇
const IMGBB_API_KEY = "db69b335530d34d718f02776197a7d91" 
// ==========================================

const PLANOS = [
  { id: 0, nome: 'Grátis (Teste)', dias: 1, valor: 0, desc: 'Publicação imediata sem custo' },
  { id: 5, nome: 'Teste PIX', dias: 1, valor: 1, desc: 'Apenas para testar o PIX 1 real' },
  { id: 1, nome: 'Diário', dias: 1, valor: 10, desc: 'Rápido e barato' },
  { id: 2, nome: 'Semanal', dias: 7, valor: 60, desc: 'Ideal para maioria' },
  { id: 3, nome: 'Quinzenal', dias: 15, valor: 160, desc: 'Mais visibilidade' },
  { id: 4, nome: 'Mensal', dias: 30, valor: 300, desc: 'Venda profissional' }
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

    if (IMGBB_API_KEY === "COLOQUE_SUA_CHAVE_AQUI" && fotos.length > 0) {
        alert("Por favor, adicione sua chave da API do ImgBB no código para enviar fotos!");
        return;
    }

    setLoading(true)
    try {
      const urls: string[] = []
      
      // NOVA LÓGICA DE UPLOAD USANDO IMGBB (Bypass do Firebase Storage)
      if (fotos.length > 0) {
        for (const foto of fotos) {
          const formData = new FormData()
          formData.append('image', foto)

          const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
          })

          const data = await response.json()
          
          if (data.success) {
            urls.push(data.data.url) // Pega a URL direta da imagem
          } else {
            console.error("Erro no upload do ImgBB:", data)
            alert("Erro ao enviar uma das fotos.")
          }
        }
      }

      const docRef = await addDoc(collection(db, 'anuncios'), {
        titulo,
        descricao,
        preco: parseFloat(preco.replace(',', '.')),
        categoria,
        fotos: urls, // Salva as URLs do ImgBB no Firebase
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
        <h1 className="text-3xl font-black text-primary mb-8 uppercase italic">O que você está desapegando?</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
          
          <div>
            <label className="block text-primary font-bold mb-4">Fotos do produto (Opcional)</label>
            <div className="grid grid-cols-3 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={14}/></button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center text-primary cursor-pointer hover:bg-primary/5 transition">
                <Camera size={32} />
                <span className="text-[10px] font-bold mt-1">ADICIONAR</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Título do anúncio*</label>
            <input required type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none" placeholder="Ex: iPhone 13 Pro Max 256GB" />
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Categoria*</label>
            <select required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
              <option value="">Selecione uma categoria</option>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Preço (R$)*</label>
            <input required type="number" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none" placeholder="0,00" />
          </div>

          <div>
            <label className="block text-primary font-bold mb-2">Descrição*</label>
            <textarea required rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary outline-none" placeholder="Detalhes sobre o estado do produto..."></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100">
             <label className="block text-primary font-black text-xl mb-4">Escolha um Plano para destacar*</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {PLANOS.map((p) => (
                 <div 
                    key={p.id}
                    onClick={() => setPlanoId(p.id)}
                    className={`cursor-pointer border-2 rounded-2xl p-4 transition-all ${planoId === p.id ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-primary/30'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-gray-800">{p.nome}</h3>
                       {planoId === p.id && <CheckCircle className="text-primary" size={20}/>}
                    </div>
                    <p className="text-2xl font-black text-green-600 mb-1">
                      {p.valor === 0 ? 'Grátis' : `R$ ${p.valor},00`}
                    </p>
                    <p className="text-sm text-gray-500">{p.dias} dias ativo</p>
                    <p className="text-xs text-primary font-medium mt-2 bg-white inline-block px-2 py-1 rounded-md border border-gray-100">{p.desc}</p>
                 </div>
               ))}
             </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading || isFormIncompleto}
              className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3
                ${isFormIncompleto ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-accent hover:bg-accent-dark text-white hover:scale-[1.02]'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : (planoId === 0 ? 'PUBLICAR GRÁTIS' : 'IR PARA PAGAMENTO')}
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