'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, deleteUser } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { User, Phone, Save, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [userAuth, setUserAuth] = useState<any>(null)
  
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
      const telLimpo = telefone.replace(/\D/g, '')

      await setDoc(doc(db, 'users', userAuth.uid), {
        nome: nome,
        telefone: telLimpo,
        email: userAuth.email,
        atualizadoEm: serverTimestamp()
      }, { merge: true })

      alert("Perfil atualizado com sucesso!")
      router.push('/meus-anuncios')
    } catch (error) {
      console.error("Erro ao salvar:", error)
      alert("Erro ao salvar perfil.")
    } finally {
      setSaving(false)
    }
  }

  // LGPD: FUNÇÃO PARA EXCLUIR CONTA DEFINITIVAMENTE
  const handleDeleteAccount = async () => {
    const confirmacao = window.confirm("ATENÇÃO (LGPD): Tem certeza de que deseja excluir sua conta? Todos os seus dados pessoais, perfil e anúncios vinculados serão permanentemente apagados e não poderão ser recuperados.")
    
    if (!confirmacao) return;

    setDeleting(true)
    try {
      // 1. Apaga os dados do usuário no Firestore
      await deleteDoc(doc(db, 'users', userAuth.uid));
      
      // 2. Apaga a conta de Autenticação do Firebase
      await deleteUser(userAuth);
      
      alert("Sua conta e dados foram excluídos com sucesso em conformidade com a LGPD.");
      router.push('/');
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error)
      if (error.code === 'auth/requires-recent-login') {
        alert("Por questões de segurança, faça logout e login novamente antes de excluir sua conta.");
      } else {
        alert("Ocorreu um erro ao tentar excluir a sua conta.");
      }
      setDeleting(false)
    }
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length <= 11) {
      valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2')
      valor = valor.replace(/(\d)(\d{4})$/, '$1-$2')
      setTelefone(valor)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-6 md:py-10 px-4 pb-28 md:pb-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/meus-anuncios" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Meu Perfil</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-black shadow-inner border border-primary/20">
              {nome ? nome.charAt(0).toUpperCase() : <User size={40} />}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2 text-sm md:text-base">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input 
                type="text" 
                required
                placeholder="Como quer ser chamado?"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2 text-sm md:text-base">WhatsApp para Vendas</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
              <input 
                type="text" 
                required
                placeholder="(86) 99999-9999"
                value={telefone}
                onChange={handleTelefoneChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-800 font-medium"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
              Os compradores poderão clicar num botão para falar diretamente com você pelo WhatsApp.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-4">
            <button 
              type="submit" 
              disabled={saving || deleting}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-lg transform hover:-translate-y-0.5"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Salvar Alterações
            </button>

            {/* BOTÃO LGPD EXCLUIR CONTA */}
            <button 
              type="button" 
              onClick={handleDeleteAccount}
              disabled={saving || deleting}
              className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
            >
              {deleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18} />}
              Excluir minha conta e dados (LGPD)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}