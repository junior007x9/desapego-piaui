'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { User, Save, Loader2, ArrowLeft, Trash2, Shield, Eye, Camera, Lock } from 'lucide-react'
import Link from 'next/link'

// ==========================================
// MÁSCARAS DE FORMATAÇÃO
// ==========================================
const mascaraTelefone = (valor: string) => {
  valor = valor.replace(/\D/g, '')
  valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2')
  valor = valor.replace(/(\d)(\d{4})$/, '$1-$2')
  return valor.substring(0, 15)
}

const mascaraDoc = (valor: string) => {
  valor = valor.replace(/\D/g, '')
  if (valor.length <= 11) {
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  } else {
    valor = valor.replace(/^(\d{2})(\d)/, '$1.$2')
    valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2')
    valor = valor.replace(/(\d{4})(\d)/, '$1-$2')
  }
  return valor.substring(0, 18)
}

const mascaraCep = (valor: string) => {
  valor = valor.replace(/\D/g, '')
  valor = valor.replace(/^(\d{5})(\d)/, '$1-$2')
  return valor.substring(0, 9)
}

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [userAuth, setUserAuth] = useState<any>(null)
  
  // TRAVA ANTI-FRAUDE
  const [temDocSalvo, setTemDocSalvo] = useState(false)

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
        const publicDoc = await getDoc(doc(db, 'users', user.uid))
        if (publicDoc.exists()) {
          const publicData = publicDoc.data()
          setApelido(publicData.nome || '')
          setTelefone(mascaraTelefone(publicData.telefone || ''))
          setFotoPerfil(publicData.fotoPerfil || user.photoURL || '')
        } else if (user.photoURL) {
           setFotoPerfil(user.photoURL)
        }

        const privateDoc = await getDoc(doc(db, 'users', user.uid, 'privado', 'dados'))
        if (privateDoc.exists()) {
          const privateData = privateDoc.data()
          setNomeCompleto(privateData.nomeCompleto || '')
          
          // VERIFICA SE JÁ EXISTE UM CPF CADASTRADO E TRAVA O CAMPO
          if (privateData.documento && privateData.documento.length > 5) {
            setTemDocSalvo(true)
            setDocumento(mascaraDoc(privateData.documento))
          } else {
            setTemDocSalvo(false)
            setDocumento('')
          }

          setCep(mascaraCep(privateData.endereco?.cep || ''))
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

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userAuth) return;
    
    const file = e.target.files[0];
    setUploadingFoto(true);
    
    try {
      const idToken = await userAuth.getIdToken();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        const novaUrl = data.data.url;
        setFotoPerfil(novaUrl);
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
      const docLimpo = documento.replace(/\D/g, '')
      const cepLimpo = cep.replace(/\D/g, '')

      await setDoc(doc(db, 'users', userAuth.uid), {
        nome: apelido,
        telefone: telLimpo,
        cidade: cidade,
        estado: estado,
        email: userAuth.email,
        fotoPerfil: fotoPerfil,
        atualizadoEm: serverTimestamp()
      }, { merge: true })

      await setDoc(doc(db, 'users', userAuth.uid, 'privado', 'dados'), {
        nomeCompleto,
        // Só atualiza o documento se o campo não estiver travado
        ...( !temDocSalvo && { documento: docLimpo } ),
        endereco: { cep: cepLimpo, rua, numero, bairro, cidade, estado }
      }, { merge: true })

      // Após salvar com sucesso, se a pessoa digitou um CPF novo, a gente trava a tela pra ela não mexer mais
      if (!temDocSalvo && docLimpo.length > 5) {
         setTemDocSalvo(true)
      }

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
    const confirmacao1 = window.confirm("ATENÇÃO: Você está prestes a iniciar o processo de exclusão da sua conta. Deseja continuar?")
    if (!confirmacao1) return;

    const textoLegal = "TERMO DE CONSENTIMENTO (LGPD):\n\n" +
                       "Ao confirmar, sua conta será desativada imediatamente e não ficará mais visível para novos negócios.\n\n" +
                       "A exclusão DEFINITIVA dos seus dados ocorrerá em um prazo de 30 DIAS. Este período de retenção é mantido exclusivamente para segurança, prevenção a fraudes e cumprimento de obrigações legais, conforme autorizado pela Lei Geral de Proteção de Dados.\n\n" +
                       "Você concorda com estes termos e deseja desativar a conta agora?";
                       
    const confirmacao2 = window.confirm(textoLegal);
    if (!confirmacao2) return;

    setDeleting(true)
    try {
      const dataExclusao = new Date();
      dataExclusao.setDate(dataExclusao.getDate() + 30);

      await setDoc(doc(db, 'users', userAuth.uid), {
        status: 'aguardando_exclusao',
        exclusaoAgendadaPara: dataExclusao,
        atualizadoEm: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, 'users', userAuth.uid, 'privado', 'dados'), {
        status: 'aguardando_exclusao',
        exclusaoAgendadaPara: dataExclusao
      }, { merge: true });

      await signOut(auth);
      
      alert("Solicitação recebida com sucesso. Sua conta foi desativada e será excluída definitivamente em 30 dias.");
      router.push('/');
    } catch (error: any) {
      alert("Ocorreu um erro ao processar a exclusão. Tente novamente.");
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
          
          {/* FOTO DE PERFIL */}
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="relative w-28 h-28 bg-primary/10 text-primary rounded-full flex items-center justify-center text-4xl font-black shadow-inner border-4 border-white outline outline-1 outline-gray-200 group overflow-hidden">
              {uploadingFoto ? (
                <Loader2 className="animate-spin text-primary" size={32} />
              ) : fotoPerfil ? (
                <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                apelido ? apelido.charAt(0).toUpperCase() : <User size={40} />
              )}

              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={28} />
                <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} disabled={uploadingFoto} />
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
                <input 
                  required 
                  type="text" 
                  value={telefone} 
                  onChange={e => setTelefone(mascaraTelefone(e.target.value))} 
                  className="w-full px-4 py-3 bg-white border border-transparent rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium" 
                  placeholder="(00) 00000-0000"
                />
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
                <div className="relative">
                  <input 
                    required 
                    readOnly={temDocSalvo}
                    type="text" 
                    value={documento} 
                    onChange={e => {
                      if(!temDocSalvo) setDocumento(mascaraDoc(e.target.value))
                    }} 
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition ${temDocSalvo ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:ring-2 focus:ring-primary'}`} 
                    placeholder="000.000.000-00"
                  />
                  {temDocSalvo && <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />}
                </div>
                {temDocSalvo && (
                  <p className="text-[11px] text-gray-400 mt-1.5 font-bold flex items-center gap-1">
                    Documento validado e protegido contra alterações.
                  </p>
                )}
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
                <input 
                  required 
                  type="text" 
                  value={cep} 
                  onChange={e => setCep(mascaraCep(e.target.value))} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" 
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-4">
            <button type="submit" disabled={saving || deleting || uploadingFoto} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-lg transform hover:-translate-y-0.5">
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Salvar Alterações
            </button>

            <button type="button" onClick={handleDeleteAccount} disabled={saving || deleting || uploadingFoto} className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-sm">
              {deleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18} />} Desativar e Excluir minha conta
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}