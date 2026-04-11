'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Save, Loader2, ArrowLeft, DollarSign, Camera, X } from 'lucide-react'

// Mantemos as mesmas categorias
const CATEGORIAS = ["Imóveis", "Veículos", "Eletrônicos", "Para Casa", "Moda e Beleza", "Outros"]

export default function EditarAnuncioPage() {
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Campos de texto do formulário
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState('Outros')

  // NOVOS ESTADOS PARA AS FOTOS
  const [fotosExistentes, setFotosExistentes] = useState<string[]>([]) // Fotos que já estão salvas no banco
  const [novasFotos, setNovasFotos] = useState<File[]>([]) // Novas fotos que o usuário escolheu agora
  const [previews, setPreviews] = useState<string[]>([]) // Previews temporários das novas fotos

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      if (!params.id) return;

      try {
        const adDocRef = doc(db, 'anuncios', params.id as string)
        const adSnapshot = await getDoc(adDocRef)

        if (!adSnapshot.exists()) {
          alert('Anúncio não encontrado.')
          router.push('/meus-anuncios')
          return
        }

        const adData: any = adSnapshot.data()

        // Verificação de segurança: Só o dono pode editar!
        if (adData.vendedorId !== currentUser.uid) {
          alert('Você não tem permissão para editar este anúncio.')
          router.push('/meus-anuncios')
          return
        }

        // Preenche os campos com os dados atuais
        setTitulo(adData.titulo || '')
        setDescricao(adData.descricao || '')
        setCategoria(adData.categoria || 'Outros')
        
        // 🚀 MÁSCARA APLICADA AQUI AO CARREGAR DO BANCO
        if (adData.preco) {
           setPreco(Number(adData.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
        } else {
           setPreco('')
        }
        
        // Puxa as fotos atuais (se houver)
        setFotosExistentes(adData.fotos || [])

      } catch (error) {
        console.error("Erro ao carregar anúncio:", error)
        alert("Erro ao carregar os dados.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [params.id, router])

  // Função para adicionar NOVAS FOTOS na edição
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      if (fotosExistentes.length + novasFotos.length + selectedFiles.length > 10) {
        alert("Você pode ter no máximo 10 fotos por anúncio.")
        return
      }

      setNovasFotos(prev => [...prev, ...selectedFiles])
      const selectedPreviews = selectedFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...selectedPreviews])
    }
  }

  // Função para remover uma FOTO ANTIGA (já salva)
  const removeFotoExistente = (index: number) => {
    setFotosExistentes(prev => prev.filter((_, i) => i !== index))
  }

  // Função para remover uma FOTO NOVA (ainda não salva)
  const removeNovaFoto = (index: number) => {
    setNovasFotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // 🚀 CONVERSÃO DO PREÇO COM MÁSCARA PARA O BANCO DE DADOS
      let precoNumerico = 0
      if (preco) {
        // Remove os pontos de milhares e troca a vírgula dos centavos por ponto
        const precoLimpo = preco.toString().replace(/\./g, '').replace(',', '.')
        precoNumerico = parseFloat(precoLimpo)
      }

      if (isNaN(precoNumerico) || precoNumerico <= 0) {
        alert("Por favor, insira um preço válido maior que zero.")
        setSaving(false)
        return
      }

      // 1. FAZ O UPLOAD DAS NOVAS FOTOS (SE HOUVER)
      const urlsFinais: string[] = [...fotosExistentes]
      
      if (novasFotos.length > 0) {
        const idToken = await user.getIdToken();

        for (const foto of novasFotos) {
          const formData = new FormData()
          formData.append('image', foto)

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
            body: formData,
          })

          const data = await response.json()
          
          if (data.success) {
            urlsFinais.push(data.url || data.data.url) 
          } else {
            console.error("Erro no upload:", data)
            alert("Erro ao enviar uma das fotos novas, ela será ignorada.")
          }
        }
      }

      // 2. ATUALIZA O BANCO DE DADOS
      const adDocRef = doc(db, 'anuncios', params.id as string)
      await updateDoc(adDocRef, {
        titulo: titulo,
        descricao: descricao,
        preco: precoNumerico,
        categoria: categoria,
        fotos: urlsFinais, // Salva o array de fotos misturando as antigas mantidas com as novas
        imagemUrl: urlsFinais.length > 0 ? urlsFinais[0] : null, // Atualiza a capa
        atualizadoEm: serverTimestamp()
      })

      alert("Anúncio atualizado com sucesso!")
      router.push('/meus-anuncios')
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      alert("Erro ao salvar as alterações.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-primary" size={40} /></div>

  const totalFotos = fotosExistentes.length + novasFotos.length;

  return (
    <div className="bg-gray-50 min-h-screen py-6 md:py-10 px-4 pb-28 md:pb-10">
      <div className="max-w-2xl mx-auto">
        
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Editar Anúncio</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          
          {/* SESSÃO DE FOTOS */}
          <div className="bg-gray-50 p-4 md:p-6 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-end mb-4">
               <label className="block text-primary font-bold">Fotos do produto</label>
               <span className={`text-xs font-bold px-2 py-1 rounded-md ${totalFotos === 10 ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                 {totalFotos}/10 fotos
               </span>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              
              {/* Renderiza as FOTOS EXISTENTES */}
              {fotosExistentes.map((src, index) => (
                <div key={`existente-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={src} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 w-full h-full bg-black/0 group-hover:bg-black/20 transition-all"></div>
                  <button type="button" onClick={() => removeFotoExistente(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors">
                    <X size={14} strokeWidth={3}/>
                  </button>
                </div>
              ))}

              {/* Renderiza as NOVAS FOTOS sendo adicionadas */}
              {previews.map((src, index) => (
                <div key={`nova-${index}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/50 group">
                  <img src={src} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">NOVA</span>
                  <button type="button" onClick={() => removeNovaFoto(index)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors">
                    <X size={14} strokeWidth={3}/>
                  </button>
                </div>
              ))}
              
              {/* Botão de Adicionar FOTO */}
              {totalFotos < 10 && (
                <label className="aspect-square border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center text-primary cursor-pointer hover:bg-primary/10 transition bg-white shadow-sm">
                  <Camera size={28} />
                  <span className="text-[10px] font-bold mt-1">ADICIONAR</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-primary font-bold mb-2">Título do Anúncio</label>
            <input 
              type="text" 
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 🚀 NOVO CAMPO DE PREÇO COM MÁSCARA */}
            <div>
              <label className="block text-primary font-bold mb-2">Preço (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" size={20} />
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="0,00"
                  required
                  value={preco}
                  onChange={(e) => {
                    // Remove tudo que não for número
                    const valor = e.target.value.replace(/\D/g, '');
                    
                    if (!valor) {
                      setPreco('');
                      return;
                    }

                    // Transforma em decimal e formata
                    const formatado = (Number(valor) / 100).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                    
                    setPreco(formatado);
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-800"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-primary font-bold mb-2">Categoria</label>
              <select 
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-800 cursor-pointer"
              >
                {CATEGORIAS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-primary font-bold mb-2">Descrição Detalhada</label>
            <textarea 
              rows={5}
              required
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-800 resize-none"
            ></textarea>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-lg transform hover:-translate-y-0.5"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}