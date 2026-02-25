'use client'
import { useState, useEffect } from 'react'
import { auth, db, storage } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const CATEGORIAS = ["Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]

// Adicionamos os planos para o usuário escolher antes de publicar
const PLANOS = [
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
  const [planoId, setPlanoId] = useState<number | null>(null) // Novo estado para o plano
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

  // VALIDAÇÃO: Agora exige escolher um plano
  const isFormIncompleto = !titulo.trim() || !descricao.trim() || !preco || !categoria || !planoId;

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

    setLoading(true)
    try {
      const urls: string[] = []
      
      // Upload de fotos
      if (fotos.length > 0) {
        for (const foto of fotos) {
          const storageRef = ref(storage, `anuncios/${Date.now()}_${foto.name}`)
          const snapshot = await uploadBytes(storageRef, foto)
          const url = await getDownloadURL(snapshot.ref)
          urls.push(url)
        }
      }

      // Salva no banco como PENDENTE
      const docRef = await addDoc(collection(db, 'anuncios'), {
        titulo,
        descricao,
        preco: parseFloat(preco.replace(',', '.')),
        categoria,
        fotos: urls,
        imagemUrl: urls.length > 0 ? urls[0] : null,
        vendedorId: user.uid,
        status: 'pendente', // Status pendente até pagar!
        planoId: planoId,   // Guarda o ID do plano escolhido
        visualizacoes: 0,
        criadoEm: serverTimestamp()
      })

      // Redireciona para a página de pagamento passando o ID do anúncio criado
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
        <h1 className="text-3xl font-black text-gray-800 mb-8 uppercase italic">O que você está desapegando?</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
          
          {/* FOTOS */}
          <div>
            <label className="block text-gray-700 font-bold mb-4">Fotos do produto (Opcional)</label>
            <div className="grid grid-cols-3 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border">
                  <img src={src} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={14}/></button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-purple-300 rounded-xl flex flex-col items-center justify-center text-purple-600 cursor-pointer hover:bg-purple-50 transition">
                <Camera size={32} />
                <span className="text-[10px] font-bold mt-1">ADICIONAR</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Título do anúncio*</label>
            <input required type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Ex: iPhone 13 Pro Max 256GB" />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Categoria*</label>
            <select required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-purple-600 outline-none">
              <option value="">Selecione uma categoria</option>
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Preço (R$)*</label>
            <input required type="number" value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-purple-600 outline-none" placeholder="0,00" />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Descrição*</label>
            <textarea required rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-purple-600 outline-none" placeholder="Detalhes sobre o estado do produto..."></textarea>
          </div>

          {/* SEÇÃO DE PLANOS */}
          <div className="pt-4 border-t border-gray-100">
             <label className="block text-gray-800 font-black text-xl mb-4">Escolha um Plano para destacar*</label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {PLANOS.map((p) => (
                 <div 
                    key={p.id}
                    onClick={() => setPlanoId(p.id)}
                    className={`cursor-pointer border-2 rounded-2xl p-4 transition-all ${planoId === p.id ? 'border-purple-600 bg-purple-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-purple-300'}`}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-gray-800">{p.nome}</h3>
                       {planoId === p.id && <CheckCircle className="text-purple-600" size={20}/>}
                    </div>
                    <p className="text-2xl font-black text-green-600 mb-1">R$ {p.valor},00</p>
                    <p className="text-sm text-gray-500">{p.dias} dias ativo</p>
                    <p className="text-xs text-purple-600 font-medium mt-2 bg-white inline-block px-2 py-1 rounded-md">{p.desc}</p>
                 </div>
               ))}
             </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={loading || isFormIncompleto}
              className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3
                ${isFormIncompleto ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-[1.02]'}`}
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