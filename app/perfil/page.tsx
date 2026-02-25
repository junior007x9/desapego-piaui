'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { User, Phone, Save, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userAuth, setUserAuth] = useState<any>(null)
  
  // Campos do formulário
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      setUserAuth(user)

      try {
        // Busca os dados do utilizador no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const dados = userDoc.data()
          setNome(dados.nome || '')
          setTelefone(dados.telefone || '')
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Limpa a formatação do telefone (deixa só números)
      const telLimpo = telefone.replace(/\D/g, '')

      // Guarda ou atualiza o documento do utilizador no Firestore
      await setDoc(doc(db, 'users', userAuth.uid), {
        nome: nome,
        telefone: telLimpo,
        email: userAuth.email,
        atualizadoEm: serverTimestamp()
      }, { merge: true }) // merge: true garante que não apaga outros dados se existirem

      alert("Perfil atualizado com sucesso!")
      router.push('/meus-anuncios')
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar perfil.")
    } finally {
      setSaving(false)
    }
  }

  // Máscara simples para telefone: (86) 99999-9999
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length <= 11) {
      valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2')
      valor = valor.replace(/(\d)(\d{4})$/, '$1-$2')
      setTelefone(valor)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/meus-anuncios" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-purple-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner">
              {nome ? nome.charAt(0).toUpperCase() : <User size={40} />}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                required
                placeholder="Como quer ser chamado?"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">WhatsApp para Vendas</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                required
                placeholder="(86) 99999-9999"
                value={telefone}
                onChange={handleTelefoneChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-600 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Os compradores poderão clicar num botão para falar diretamente consigo pelo WhatsApp.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50 text-lg"
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