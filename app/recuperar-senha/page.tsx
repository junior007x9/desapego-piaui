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
      if (error.code === 'auth/invalid-email') {
        alert("Por favor, insira um e-mail válido.")
      } else {
        alert("Ocorreu um erro ao tentar enviar o e-mail. Tente novamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black text-primary tracking-tight">
          Recuperar Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 font-medium">
          Enviaremos um link para redefinir sua senha de acesso.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl sm:rounded-[2rem] sm:px-10 border border-gray-100">
          
          {enviado ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-200">
                 <CheckCircle size={40} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">E-mail enviado!</h3>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                Verifique a sua caixa de entrada (e a pasta de Spam) do e-mail <br/><strong className="text-gray-900">{email}</strong> para criar uma nova senha.
              </p>
              <Link href="/login" className="w-full flex justify-center py-4 px-4 rounded-xl shadow-md text-lg font-bold text-white bg-primary hover:bg-primary-dark transition-all transform hover:-translate-y-0.5">
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRecuperar} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">E-mail cadastrado</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-12 px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-gray-800 font-medium" 
                    placeholder="seu@email.com" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !email} 
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50 mt-8 transform hover:-translate-y-0.5"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : "Enviar Link de Recuperação"}
              </button>

              <div className="text-center mt-6 pt-6 border-t border-gray-100">
                <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-primary flex justify-center items-center gap-2 transition">
                  <ArrowLeft size={18} /> Voltar para o Login
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}