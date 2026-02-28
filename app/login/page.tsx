'use client'
import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock } from 'lucide-react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!executeRecaptcha) {
        alert("O sistema de segurança ainda está carregando. Aguarde um segundo e tente novamente.")
        return;
    }

    setLoading(true)
    try {
      // 1. Pega o token invisível do Google
      const recaptchaToken = await executeRecaptcha('login')
      
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

      // 3. Se passou pelo robô, faz o login no Firebase
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/meus-anuncios')
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        alert("Email ou senha incorretos.")
      } else {
        alert("Erro ao fazer login. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          nome: user.displayName || 'Usuário',
          email: user.email,
          telefone: '',
          favoritos: [],
          criadoEm: serverTimestamp()
        })
      }
      router.push('/meus-anuncios')
    } catch (error: any) {
      console.error("Erro Google:", error)
      alert("Erro ao fazer login com o Google.")
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Acesse sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Para desapegar ou conversar com vendedores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100">
          
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700">E-mail</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-gray-50" placeholder="seu@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Senha</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-gray-50" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/recuperar-senha" className="font-bold text-accent hover:text-accent-dark transition">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 transform hover:-translate-y-0.5">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Entrar"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 font-medium">Ou continue com</span></div>
            </div>

            <div className="mt-6">
              <button onClick={handleGoogleLogin} disabled={googleLoading} className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 hover:shadow-md">
                {googleLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />}
                Google
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-600 border-t pt-6">
            Ainda não tem uma conta?{' '}
            <Link href="/cadastro" className="font-black text-primary hover:text-primary-dark transition">
              Cadastre-se grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Chave de Site inserida aqui:
export default function LoginPage() {
  return (
    <GoogleReCaptchaProvider reCaptchaKey="6LdqR3osAAAAAPGrmZb8Nf0NtwEXmwa7EnCMhVLY">
      <LoginForm />
    </GoogleReCaptchaProvider>
  )
}