'use client'
import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setEnviado(true)
    } catch (error: any) {
      console.error(error)
      // O Firebase por motivos de segurança não diz se o email existe ou não, mas podemos tratar erros comuns
      if (error.code === 'auth/invalid-email') {
        alert("Por favor, insira um email válido.")
      } else {
        alert("Ocorreu um erro ao tentar enviar o email. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Recuperar Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {enviado ? (
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-900 mb-2">E-mail enviado!</h3>
              <p className="text-gray-600 text-sm mb-6">
                Verifique a sua caixa de entrada (e a pasta de Spam) do email <strong>{email}</strong> para redefinir a sua senha.
              </p>
              <Link href="/login" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-purple-600 hover:bg-purple-700">
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRecuperar} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-mail cadastrado</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="appearance-none block w-full pl-10 px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" placeholder="seu@email.com" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Enviar link de recuperação"}
              </button>

              <div className="text-center mt-4">
                <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-purple-600 flex justify-center items-center gap-2">
                  <ArrowLeft size={16} /> Voltar
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}