'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ArrowLeft, MessageSquare, Phone, Mail, Instagram, Loader2, Send, CheckCircle } from 'lucide-react'

export default function ContatoPage() {
  const [tipo, setTipo] = useState('Sugestão')
  const [mensagem, setMensagem] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // 🚀 MÁGICA: Se o usuário estiver logado, já preenche o e-mail dele!
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email) {
        setEmail(currentUser.email)
      }
    })
    return () => unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensagem.trim() || !email.trim()) return

    setLoading(true)
    try {
      // 🚀 SALVA O FEEDBACK COM O E-MAIL NO BANCO DE DADOS
      await addDoc(collection(db, 'feedbacks'), {
        tipo,
        mensagem,
        email, // Esse é o campo que faltava para podermos responder no painel!
        criadoEm: serverTimestamp(),
        respondido: false
      })
      
      setSuccess(true)
      setMensagem('')
      
      // Esconde a mensagem de sucesso depois de 5 segundos
      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      console.error("Erro ao enviar feedback:", error)
      alert("Ocorreu um erro ao enviar sua mensagem. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 pb-24 md:pb-10">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Fale Conosco</h1>
        </div>

        {/* CARDS DE CONTATO RÁPIDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card WhatsApp */}
          <a href="https://wa.me/5586988527230" target="_blank" rel="noopener noreferrer" className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all group">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone size={36} strokeWidth={2.5}/>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">WhatsApp Suporte</h3>
            <p className="text-gray-500 mb-4 font-medium">Atendimento rápido para dúvidas, pagamentos ou denúncias.</p>
            <span className="text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full">(86) 98852-7230</span>
          </a>

          {/* Card Email Direto */}
          <a href="mailto:contato@desapegopiaui.com.br" className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all group">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail size={36} strokeWidth={2.5}/>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">E-mail</h3>
            <p className="text-gray-500 mb-4 font-medium">Envie-nos uma mensagem para parcerias, sugestões ou suporte técnico.</p>
            <span className="text-primary font-bold bg-primary/5 px-4 py-2 rounded-full break-all text-sm">contato@desapegopiaui.com.br</span>
          </a>
        </div>

        {/* 🚀 NOVO: FORMULÁRIO DE FEEDBACK INTEGRADO */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-primary"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full">
               <MessageSquare size={24} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-gray-900">Deixe seu Feedback</h2>
               <p className="text-gray-500 font-medium text-sm">Ajude-nos a melhorar o Desapego Piauí. Nós respondemos sempre!</p>
            </div>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-8 rounded-2xl text-center flex flex-col items-center animate-in fade-in zoom-in">
              <CheckCircle size={48} className="mb-4 text-green-500" />
              <h3 className="font-black text-xl mb-2">Mensagem Enviada!</h3>
              <p className="font-medium">Muito obrigado pelo seu contato. A nossa equipa vai ler e responder para o seu e-mail em breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Seu E-mail para resposta *</label>
                  <input 
                    required 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Assunto *</label>
                  <select 
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  >
                    <option value="Sugestão">Ideia / Sugestão</option>
                    <option value="Dúvida">Dúvida Geral</option>
                    <option value="Erro">Reportar um Erro (Bug)</option>
                    <option value="Elogio">Elogio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sua Mensagem *</label>
                <textarea 
                  required 
                  rows={4}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Escreva aqui detalhadamente o que deseja nos contar..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !mensagem.trim() || !email.trim()}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white font-bold text-lg py-4 rounded-xl shadow-md transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={24}/> : <Send size={20}/>} 
                Enviar Mensagem
              </button>
            </form>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">Acompanhe as novidades</h3>
            <p className="text-gray-500 font-medium">Siga a nossa página oficial e não perca as melhores ofertas!</p>
          </div>
          <a href="https://instagram.com/desapegopiaui" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md">
            <Instagram /> Siga no Instagram
          </a>
        </div>

      </div>
    </div>
  )
}