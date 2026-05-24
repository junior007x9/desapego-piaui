'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { MessageSquare, X, Send, Loader2, CheckCircle2 } from 'lucide-react'

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Ao carregar, verifica se o utilizador está logado e puxa o e-mail dele
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser?.email) {
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
      await addDoc(collection(db, 'feedbacks'), {
        mensagem,
        email: email.trim(), // Agora o e-mail é obrigatório e vai ser sempre salvo!
        usuarioId: user?.uid || 'visitante',
        status: 'pendente',
        criadoEm: serverTimestamp()
      })
      setSucesso(true)
      setTimeout(() => {
        setIsOpen(false)
        setSucesso(false)
        setMensagem('')
      }, 3000)
    } catch (error) {
      console.error(error)
      alert("Erro ao enviar feedback.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 bg-primary text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-primary-dark transition-transform hover:scale-105 z-50 flex items-center justify-center"
      >
        <MessageSquare size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[99999] flex items-end md:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-xl relative animate-in fade-in slide-in-from-bottom-10">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full"
            >
              <X size={20} />
            </button>

            {sucesso ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Muito Obrigado!</h3>
                <p className="text-gray-600 font-medium">A sua sugestão foi enviada para a nossa equipa e responderemos em breve.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black text-gray-900 mb-2">Deixe a sua opinião</h3>
                <p className="text-sm text-gray-600 mb-6 font-medium">Encontrou algum erro ou tem uma sugestão? Diga-nos!</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">O seu E-mail (Para podermos responder)*</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">A sua Mensagem*</label>
                    <textarea 
                      required
                      rows={4}
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      placeholder="Escreva a sua sugestão..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none font-medium"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !mensagem.trim() || !email.trim()}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Enviar Feedback</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}