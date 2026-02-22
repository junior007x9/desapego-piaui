'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { Save, Loader2, ArrowLeft, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function EditarAnuncioPage() {
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Campos do formulário
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState('Outros')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      if (!params.id) return;

      try {
        // Busca o anúncio no banco de dados
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
        setPreco(adData.preco ? adData.preco.toString() : '')
        setCategoria(adData.categoria || 'Outros')

      } catch (error) {
        console.error("Erro ao carregar anúncio:", error)
        alert("Erro ao carregar os dados.")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [params.id, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Converte o preço de volta para número
      let precoNumerico = 0
      if (preco) {
        precoNumerico = parseFloat(preco.replace(',', '.'))
      }

      // Atualiza apenas os campos permitidos no Firebase
      const adDocRef = doc(db, 'anuncios', params.id as string)
      await updateDoc(adDocRef, {
        titulo: titulo,
        descricao: descricao,
        preco: precoNumerico,
        categoria: categoria,
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-purple-600 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Editar Anúncio</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          
          {/* Título */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">Título do Anúncio</label>
            <input 
              type="text" 
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preço */}
            <div>
              <label className="block text-gray-700 font-bold mb-2">Preço (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={preco}
                  onChange={e => setPreco(e.target.value)}
                  className="w-full pl-10 pr-4 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-gray-700 font-bold mb-2">Categoria</label>
              <select 
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
              >
                <option>Imóveis</option>
                <option>Veículos</option>
                <option>Eletrônicos</option>
                <option>Para Casa</option>
                <option>Moda e Beleza</option>
                <option>Outros</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-gray-700 font-bold mb-2">Descrição Detalhada</label>
            <textarea 
              rows={5}
              required
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50"
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