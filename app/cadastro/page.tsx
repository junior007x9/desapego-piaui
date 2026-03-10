'use client'
import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, User, Phone, MapPin, CheckCircle, Shield, Eye } from 'lucide-react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

function CadastroForm() {
  const router = useRouter()
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [loading, setLoading] = useState(false)

  // Dados Públicos
  const [apelido, setApelido] = useState('')
  const [telefone, setTelefone] = useState('')
  
  // Dados de Autenticação
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Dados Privados (LGPD)
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [tipoConta, setTipoConta] = useState('Fisica') // Fisica ou Juridica
  const [documento, setDocumento] = useState('')
  const [genero, setGenero] = useState('')
  
  // Endereço Privado
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length <= 11) {
      valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2')
      valor = valor.replace(/(\d)(\d{4})$/, '$1-$2')
      setTelefone(valor)
    }
  }

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (tipoConta === 'Fisica') {
      if (valor.length <= 11) {
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2')
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        setDocumento(valor)
      }
    } else {
      if (valor.length <= 14) {
        valor = valor.replace(/^(\d{2})(\d)/, '$1.$2')
        valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2')
        valor = valor.replace(/(\d{4})(\d)/, '$1-$2')
        setDocumento(valor)
      }
    }
  }

  const buscarCep = async (cepBuscado: string) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setRua(data.logradouro)
          setBairro(data.bairro)
          setCidade(data.localidade)
          setEstado(data.uf)
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error)
      }
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length <= 8) {
      valor = valor.replace(/^(\d{5})(\d)/, '$1-$2')
      setCep(valor)
      if (valor.length === 9) buscarCep(valor)
    }
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!executeRecaptcha) {
        alert("O sistema de segurança ainda está carregando. Aguarde um segundo e tente novamente.")
        return;
    }

    setLoading(true)
    
    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.")
      setLoading(false)
      return
    }

    try {
      const recaptchaToken = await executeRecaptcha('signup')
      if (!recaptchaToken) { throw new Error("Erro reCAPTCHA vazio") }

      const verifyRes = await fetch('/api/recaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken })
      });

      if (!verifyRes.ok) {
        alert("Acesso bloqueado por suspeita de robô/spam.");
        setLoading(false);
        return;
      }

      // Cria a conta
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const telLimpo = telefone.replace(/\D/g, '')

      // 1. SALVA OS DADOS PÚBLICOS (Visíveis nos anúncios)
      await setDoc(doc(db, 'users', user.uid), {
        nome: apelido, 
        email: email,
        telefone: telLimpo,
        cidade: cidade, 
        estado: estado,
        favoritos: [],
        criadoEm: serverTimestamp()
      })

      // 2. SALVA OS DADOS PRIVADOS (Subcoleção trancada via LGPD)
      await setDoc(doc(db, 'users', user.uid, 'privado', 'dados'), {
        nomeCompleto,
        tipoConta,
        documento: documento.replace(/\D/g, ''),
        genero,
        endereco: { cep: cep.replace(/\D/g, ''), rua, numero, bairro, cidade, estado }
      })

      alert("Conta criada com sucesso!")
      router.push('/meus-anuncios')
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') {
        alert("Este email já está em uso. Tente fazer login.")
      } else {
        alert("Erro ao criar conta. Verifique os dados e tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-3xl font-black text-primary tracking-tight">Crie sua conta</h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">Venda rápido, compre seguro.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-[2rem] sm:px-10 border border-gray-100">
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 text-sm mb-8 border border-blue-100">
             <Shield className="shrink-0 mt-0.5 text-blue-500" size={20} />
             <p><strong>Segurança LGPD:</strong> Seus dados pessoais como CPF, nome completo e endereço exato são estritamente confidenciais e nunca serão exibidos publicamente.</p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-8">
            
            {/* SESSÃO 1: DADOS PESSOAIS */}
            <div>
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">Dados Pessoais (Privado)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                  <input required type="text" value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition" placeholder="Nome igual ao documento" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Conta</label>
                  <select value={tipoConta} onChange={e => {setTipoConta(e.target.value); setDocumento('');}} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition cursor-pointer">
                    <option value="Fisica">Pessoa Física (CPF)</option>
                    <option value="Juridica">Pessoa Jurídica (CNPJ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{tipoConta === 'Fisica' ? 'CPF' : 'CNPJ'}</label>
                  <input required type="text" value={documento} onChange={handleDocumentoChange} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder={tipoConta === 'Fisica' ? '000.000.000-00' : '00.000.000/0000-00'} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Gênero</label>
                  <select required value={genero} onChange={e => setGenero(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition cursor-pointer">
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não dizer">Prefiro não dizer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SESSÃO 2: ENDEREÇO */}
            <div>
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">Seu Endereço (Privado)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">CEP</label>
                  <input required type="text" value={cep} onChange={handleCepChange} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Rua / Logradouro</label>
                  <input required type="text" value={rua} onChange={e => setRua(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Sua rua" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Número</label>
                  <input required type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Ex: 123" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bairro</label>
                  <input required type="text" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Seu bairro" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cidade - UF</label>
                  <input readOnly type="text" value={cidade ? `${cidade} - ${estado}` : ''} className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl outline-none cursor-not-allowed" placeholder="Preenchido pelo CEP" />
                </div>
              </div>
            </div>

            {/* SESSÃO 3: PERFIL PÚBLICO */}
            <div className="bg-primary/5 p-4 md:p-6 rounded-2xl border border-primary/10">
              <h3 className="text-lg font-black text-primary border-b border-primary/10 pb-2 mb-4 flex items-center gap-2"><Eye size={20}/> Perfil Público (Visível para todos)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Como quer ser chamado?</label>
                  <input required type="text" value={apelido} onChange={e => setApelido(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Nome ou nome da loja" />
                  <p className="text-[10px] text-gray-500 mt-1">Este nome aparecerá nos seus anúncios.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp para vendas</label>
                  <input required type="text" value={telefone} onChange={handleTelefoneChange} className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="(86) 99999-9999" />
                </div>
              </div>
            </div>

            {/* SESSÃO 4: ACESSO */}
            <div>
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-2 mb-4">Dados de Acesso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="seu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition" placeholder="Mínimo de 6 caracteres" minLength={6} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 transform hover:-translate-y-0.5 mt-8">
              {loading ? <Loader2 className="animate-spin" size={24} /> : "Finalizar Cadastro"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600 border-t border-gray-100 pt-6">
            Já tem uma conta? <Link href="/login" className="font-black text-accent hover:text-accent-dark transition">Faça Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LdqR3osAAAAAPGrmZb8Nf0NtwEXmwa7EnCMhVLY">
      <CadastroForm />
    </GoogleReCaptchaProvider>
  )
}