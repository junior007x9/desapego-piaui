'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db, storage } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Camera, Loader2, X, DollarSign, Tag, AlignLeft, Info } from 'lucide-react'

export default function AnunciarPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Estados do Formulário
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState('Outros')
  const [fotos, setFotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        alert("Você precisa fazer login para anunciar.")
        router.push('/login')
      } else {
        setUser(currentUser)
        setPageLoading(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  // --- A MAGIA DA COMPRESSÃO DE IMAGEM ---
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1080 // Tamanho ideal para web
          const MAX_HEIGHT = 1080
          let width = img.width
          let height = img.height

          // Mantém a proporção da imagem
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          // Converte o canvas de volta para um ficheiro (JPEG com 70% de qualidade)
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(newFile)
            } else {
              resolve(file) // Fallback de segurança
            }
          }, 'image/jpeg', 0.7)
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Lidar com a seleção de fotos
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      
      if (fotos.length + selectedFiles.length > 5) {
        alert("Pode enviar no máximo 5 fotos por anúncio.")
        return
      }

      // Adiciona as fotos originais (serão comprimidas no envio) para não travar a tela agora
      setFotos(prev => [...prev, ...selectedFiles])
      
      // Gera os previews para mostrar na tela imediatamente
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  // Remover foto da lista
  const removePhoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Enviar Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)

    try {
      const fotosUrls: string[] = []

      // 1. Faz upload das fotos (Comprimindo uma por uma)
      if (fotos.length > 0) {
        for (const file of fotos) {
          // Comprime a foto! (De 5MB vai para uns 300KB)
          const compressedFile = await compressImage(file)
          
          const fileRef = ref(storage, `anuncios/${user.uid}/${Date.now()}_${compressedFile.name}`)
          await uploadBytes(fileRef, compressedFile)
          const url = await getDownloadURL(fileRef)
          fotosUrls.push(url)
        }
      }

      // 2. Prepara o preço (converte string para número)
      const precoNumerico = parseFloat(preco.replace(',', '.')) || 0

      // 3. Salva no banco de dados
      const docRef = await addDoc(collection(db, 'anuncios'), {
        vendedorId: user.uid,
        titulo: titulo,
        descricao: descricao,
        preco: precoNumerico,
        categoria: categoria,
        fotos: fotosUrls,
        imagemUrl: fotosUrls.length > 0 ? fotosUrls[0] : '', // A primeira foto é a principal
        status: 'pagamento_pendente', // Manda para o fluxo de PIX
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      })

      // 4. Redireciona para a página de Pagamento PIX
      router.push(`/pagamento/${docRef.id}`)

    } catch (error) {
      console.error("Erro ao publicar anúncio:", error)
      alert("Ocorreu um erro ao enviar o anúncio. Tente novamente.")
      setLoading(false)
    }
  }

  if (pageLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">O que você vai desapegar hoje?</h1>
        <p className="text-gray-500 mb-8">Preencha os dados abaixo para criar o seu anúncio.</p>

        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-8">
          
          {/* FOTOS */}
          <div>
            <label className="block text-gray-700 font-bold mb-3 flex items-center gap-2">
              <Camera className="text-purple-600" size={20} /> Fotos do Produto (Até 5)
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                  <img src={src} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(index)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                  {index === 0 && <span className="absolute bottom-0 left-0 w-full bg-purple-600/80 text-white text-[10px] text-center py-1 font-bold backdrop-blur-sm">PRINCIPAL</span>}
                </div>
              ))}
              
              {previews.length < 5 && (
                <label className="aspect-square flex flex-col items-center justify-center bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-200 rounded-xl cursor-pointer transition text-purple-600">
                  <Camera size={30} className="mb-2 opacity-50" />
                  <span className="text-xs font-bold opacity-70">Adicionar</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Info size={12}/> As fotos serão otimizadas automaticamente para carregar mais rápido.</p>
          </div>

          <hr className="border-gray-100" />

          {/* DADOS DE TEXTO */}
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2"><Tag className="text-purple-600" size={18}/> Título do Anúncio</label>
              <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: iPhone 13 Pro Max 256GB" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2"><DollarSign className="text-purple-600" size={18}/> Preço (R$)</label>
                <input type="number" step="0.01" required value={preco} onChange={e => setPreco(e.target.value)} placeholder="0.00" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2"><AlignLeft className="text-purple-600" size={18}/> Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer">
                  <option>Imóveis</option>
                  <option>Veículos</option>
                  <option>Eletrônicos</option>
                  <option>Para Casa</option>
                  <option>Moda e Beleza</option>
                  <option>Outros</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Descrição Detalhada</label>
              <textarea rows={5} required value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva os detalhes do seu produto, tempo de uso, se tem marcas de marca de uso..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-lg py-4 rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : 'Avançar para Pagamento PIX'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">Você será redirecionado para concluir a publicação.</p>
          </div>
        </form>
      </div>
    </div>
  )
}