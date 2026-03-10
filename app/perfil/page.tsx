'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, deleteUser } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { User, Phone, Save, Loader2, ArrowLeft, Trash2, Shield, Eye, Camera } from 'lucide-react'
import Link from 'next/link'

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [userAuth, setUserAuth] = useState<any>(null)
  
  // Dados Públicos
  const [apelido, setApelido] = useState('')
  const [telefone, setTelefone] = useState('')
  const [fotoPerfil, setFotoPerfil] = useState('')

  // Dados Privados
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [documento, setDocumento] = useState('')
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      setUserAuth(user)

      try {
        // 1. Busca dados públicos
        const publicDoc = await getDoc(doc(db, 'users', user.uid))
        if (publicDoc.exists()) {
          const publicData = publicDoc.data()
          setApelido(publicData.nome || '')
          setTelefone(publicData.telefone || '')
          // Puxa a foto salva no banco OU a foto do Google Auth como fallback
          setFotoPerfil(publicData.fotoPerfil || user.photoURL || '')
        } else if (user.photoURL) {
           setFotoPerfil(user.photoURL)
        }

        // 2. Busca dados privados (LGPD)
        const privateDoc = await getDoc(doc(db, 'users', user.uid, 'privado', 'dados'))
        if (privateDoc.exists()) {
          const privateData = privateDoc.data()
          setNomeCompleto(privateData.nomeCompleto || '')
          setDocumento(privateData.documento || '')
          setCep(privateData.endereco?.cep || '')
          setRua(privateData.endereco?.rua || '')
          setNumero(privateData.endereco?.numero || '')
          setBairro(privateData.endereco?.bairro || '')
          setCidade(privateData.endereco?.cidade || '')
          setEstado(privateData.endereco?.estado || '')
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  // Função para fazer o upload da nova foto de perfil
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userAuth) return;
    
    const file = e.target.files[0];
    setUploadingFoto(true);
    
    try {
      const idToken = await userAuth.getIdToken();
      const formData = new FormData();
      formData.append('image', file);

      // Usa a mesma API segura que já criamos para os anúncios!
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        const novaUrl = data.data.url;
        setFotoPerfil(novaUrl);
        
        // Já salva direto no banco para o usuário não perder a foto se sair sem clicar em salvar
        await setDoc(doc(db, 'users', userAuth.uid), { fotoPerfil: novaUrl }, { merge: true });
      } else {
        alert("Erro ao enviar foto: " + (data.error || "Tente novamente."));
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar a foto de perfil.");
    } finally {
      setUploadingFoto(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const telLimpo = telefone.replace(/\D/g, '')

      // Salva Públicos
      await setDoc(doc(db, 'users', userAuth.uid), {
        nome: apelido,
        telefone: telLimpo,
        cidade: cidade,
        estado: estado,
        email: userAuth.email,
        fotoPerfil: fotoPerfil,
        atualizadoEm: serverTimestamp()
      }, { merge: true })

      // Salva Privados
      await setDoc(doc(db, 'users', userAuth.uid, 'privado', 'dados'), {
        nomeCompleto,
        documento: documento.replace(/\D/g, ''),
        endereco: { cep: cep.replace(/\D/g, ''), rua, numero, bairro, cidade, estado }
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

  const handleDeleteAccount = async () => {
    const confirmacao = window.confirm("ATENÇÃO (LGPD): Tem certeza de que deseja excluir sua conta e todos os seus dados definitivamente?")
    if (!confirmacao) return;

    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'users', userAuth.uid, 'privado', 'dados'));
      await deleteDoc(doc(db, 'users', userAuth.uid));
      await deleteUser(userAuth);
      
      alert("Sua conta e dados foram excluídos com sucesso.");
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert("Por segurança, faça logout e login novamente antes de excluir sua conta.");
      } else {
        alert("Erro ao excluir conta.");
      }
      setDeleting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-6 md:py-10 px-4 pb-28 md:pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/meus-anuncios" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Meu Perfil</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
          
          {/* FOTO DE PERFIL COM UPLOAD */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative w-28 h-28 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-black shadow-inner border-4 border-white outline outline-1 outline-gray-200 group overflow-hidden">
              {uploadingFoto ? (
                <Loader2 className="animate-spin text-primary" size={32} />
              ) : fotoPerfil ? (
                <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                apelido ? apelido.charAt(0).toUpperCase() : <User size={40} />
              )}

              {/* Camada escura que aparece ao passar o mouse por cima (Hover) */}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={28} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFotoChange} 
                  disabled={uploadingFoto} 
                />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">Clique na imagem para alterar</p>
          </div>

          {/* DADOS PÚBLICOS */}
          <div className="bg-primary/5 p-4 md:p-6 rounded-2xl border border-primary/10">
            <h3 className="text-lg font-black text-primary border-b border-primary/10 pb-2 mb-4 flex items-center gap-2"><Eye size={20}/> Dados Públicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Como quer ser chamado?</label>
                <input required type="text" value={apelido} onChange={e => setApelido(e.target.value)} className="w-full px-4 py-3 bg-white border border-transparent rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp de Vendas</label>
                <input required type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full px-4 py-3 bg-white border border-transparent rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium" />
              </div>
            </div>
          </div>

          {/* DADOS PRIVADOS */}
          <div>
            <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2"><Shield size={20} className="text-blue-500"/> Dados Privados (LGPD)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                <input required type="text" value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">CPF / CNPJ</label>
                <input required readOnly type="text" value={documento} className="w-full px-4 py-3 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl outline-none cursor-not-allowed" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-3">
                <label className="block text-sm font-bold text-gray-700 mb-1">Rua / Logradouro</label>
                <input required type="text" value={rua} onChange={e => setRua(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Número</label>
                <input required type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
                <input required type="text" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-1">CEP</label>
                <input required type="text" value={cep} onChange={e => setCep(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-4">
            <button type="submit" disabled={saving || deleting || uploadingFoto} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-lg transform hover:-translate-y-0.5">
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Salvar Alterações
            </button>

            <button type="button" onClick={handleDeleteAccount} disabled={saving || deleting || uploadingFoto} className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-sm">
              {deleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18} />} Excluir minha conta (LGPD)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}