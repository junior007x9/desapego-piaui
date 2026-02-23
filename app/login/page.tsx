'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  
  // Estados para controlar o que aparece na tela
  const [isLogin, setIsLogin] = useState(true)
  const [resetMode, setResetMode] = useState(false)
  const [loading, setLoading] = useState(false)

  // Campos do formulário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Função Principal: Entrar ou Cadastrar com Email e Senha
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // LÓGICA DE LOGIN
        await signInWithEmailAndPassword(auth, email, password)
        alert("🎉 Logado com sucesso! Bem-vindo de volta.")
        router.push('/')
      } else {
        // LÓGICA DE CADASTRO
        if (!nome.trim()) {
          alert("Por favor, preencha o seu nome.")
          setLoading(false)
          return
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Guarda o nome do utilizador no Firestore
        await setDoc(doc(db, 'users', user.uid), {
          nome: nome,
          email: user.email,
          telefone: '',
          criadoEm: serverTimestamp()
        })

        alert("🎉 Conta criada com sucesso! Bem-vindo ao DesapegoPI.")
        router.push('/')
      }
    } catch (error: any) {
      console.error(error)
      if (error.code === 'auth/email-already-in-use') alert("Este email já está cadastrado.")
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') alert("Email ou senha incorretos.")
      else alert("Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Função: Login Social com Google
  const handleGoogleLogin = async () => {
    setLoading(true)
    const provider = new GoogleAuthProvider()
    
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Verifica se é a primeira vez que entra para guardar o nome no banco
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          nome: user.displayName || 'Usuário Google',
          email: user.email,
          telefone: '',
          criadoEm: serverTimestamp()
        })
      }

      alert("🎉 Logado com o Google com sucesso!")
      router.push('/')
    } catch (error: any) {
      console.error(error)
      alert("Erro ao entrar com o Google. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Função: Recuperar Senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      alert("Por favor, digite o seu email para recuperar a senha.")
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      alert("📩 Email de recuperação enviado! Verifique a sua caixa de entrada (ou spam).")
      setResetMode(false) // Volta para a tela de login
    } catch (error: any) {
      console.error(error)
      alert("Erro ao enviar email. Verifique se digitou corretamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fundo decorativo */}
      <div className="absolute top-0 left-0 w-full h-full bg-purple-900 opacity-5"></div>
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl relative z-10 border border-gray-100">
        
        <div className="text-center relative">
          <Link href="/" className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-gray-50 rounded-full text-gray-500 hover:text-purple-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {resetMode ? 'Recuperar Senha' : (isLogin ? 'Entrar na Conta' : 'Criar Conta')}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {resetMode ? 'Nós enviaremos um link para redefinir a sua senha.' : 'O maior marketplace do Piauí'}
          </p>
        </div>

        {/* TELA DE RECUPERAR SENHA */}
        {resetMode ? (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition" placeholder="exemplo@email.com" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-white bg-purple-600 hover:bg-purple-700 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition">
                {loading ? <Loader2 className="animate-spin" /> : 'Enviar link de recuperação'}
              </button>
              <button type="button" onClick={() => setResetMode(false)} className="w-full text-sm font-bold text-gray-500 hover:text-purple-600 transition">
                Voltar para o Login
              </button>
            </div>
          </form>
        ) : (
          
          /* TELA DE LOGIN / CADASTRO */
          <>
            <form className="mt-8 space-y-5" onSubmit={handleAuth}>
              
              {/* Campo Nome (Apenas no Cadastro) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" required={!isLogin} value={nome} onChange={e => setNome(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition" placeholder="Como quer ser chamado?" />
                  </div>
                </div>
              )}

              {/* Campo Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition" placeholder="exemplo@email.com" />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Senha</label>
                  {isLogin && (
                    <button type="button" onClick={() => setResetMode(true)} className="text-xs font-bold text-purple-600 hover:text-purple-800 transition">
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition" placeholder="••••••••" minLength={6} />
                </div>
                {!isLogin && <p className="text-xs text-gray-400 mt-1 ml-1">Mínimo de 6 caracteres</p>}
              </div>

              {/* Botão Principal de Email/Senha */}
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-white bg-purple-600 hover:bg-purple-700 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition">
                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Ou continue com</span></div>
              </div>

              {/* Botão de Google */}
              <div className="mt-6">
                <button 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-gray-700 font-bold hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {/* Ícone do Google em SVG */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>
            </div>

            {/* Alternar entre Login e Cadastro */}
            <p className="mt-8 text-center text-sm text-gray-600">
              {isLogin ? "Ainda não tem conta? " : "Já tem uma conta? "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setResetMode(false); }} 
                className="font-bold text-purple-600 hover:text-purple-800 hover:underline transition"
              >
                {isLogin ? "Cadastre-se grátis" : "Faça Login"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}