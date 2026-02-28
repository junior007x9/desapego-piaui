'use client'
import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

function CadastroForm() {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, '')
    if (valor.length <= 11) {
      valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2')
      valor = valor.replace(/(\d)(\d{4})$/, '$1-$2')
      setTelefone(valor)
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
      // 1. Pega o token invisível do Google
      const recaptchaToken = await executeRecaptcha('signup')
      
      if (!recaptchaToken) {
          alert("Ocorreu um erro ao validar a segurança.")
          setLoading(false)
          return;
      }

      // 2. Manda para o nosso servidor validar a chave secreta
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

      // 3. Cria a conta no Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const telLimpo = telefone.replace(/\D/g, '')

      await setDoc(doc(db, 'users', user.uid), {
        nome: nome,
        email: email,
        telefone: telLimpo,
        favoritos: [],
        criadoEm: serverTimestamp()
      })

      alert("Conta criada com sucesso!")
      router.push('/meus-anuncios')
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') {
        alert("Este email já está em uso. Tente fazer login.")
      } else {
        alert("Erro ao criar conta: " + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Rápido, fácil e grátis.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          <form onSubmit={handleCadastro} className="space-y-5">
            
            <div>
              <label className="block text-sm font-bold text-gray-700">Nome Completo</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input required type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full pl-10 px-3 py-3 border border-gray-200 bg-gray-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition" placeholder="Seu nome" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">WhatsApp</label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input required type="text" value={telefone} onChange={handleTelefoneChange} className="w-full pl-10 px-3 py-3 border border-gray-200 bg-gray-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition" placeholder="(86) 99999-9999" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">E-mail</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 px-3 py-3 border border-gray-200 bg-gray-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition" placeholder="seu@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Senha</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 px-3 py-3 border border-gray-200 bg-gray-50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition" placeholder="Mínimo de 6 caracteres" minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 mt-6 transform hover:-translate-y-0.5">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Criar Conta"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-6">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-black text-accent hover:text-accent-dark transition">
              Faça Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Chave de Site inserida aqui:
export default function CadastroPage() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LdqR3osAAAAAPGrmZb8Nf0NtwEXmwa7EnCMhVLY">
      <CadastroForm />
    </GoogleReCaptchaProvider>
  )
}