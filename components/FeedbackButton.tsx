'use client'
import { useState } from 'react'
import { MessageSquarePlus, X, Loader2, Send } from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { usePathname } from 'next/navigation' // <-- Importamos para saber em que página estamos

export default function FeedbackButton() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [tipo, setTipo] = useState('Sugestão')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  // SE ESTIVERMOS NO PAINEL ADMIN, O BOTÃO NÃO APARECE!
  if (pathname === '/admin') return null;

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mensagem.trim()) return

    setEnviando(true)
    try {
      await addDoc(collection(db, 'feedbacks'), {
        tipo,
        mensagem,
        lido: false,
        criadoEm: serverTimestamp()
      })
      setSucesso(true)
      setTimeout(() => {
        setIsOpen(false)
        setSucesso(false)
        setMensagem('')
        setTipo('Sugestão')
      }, 3000)
    } catch (error) {
      console.error(error)
      alert("Erro ao enviar feedback.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 bg-primary hover:bg-primary-dark text-white p-3 md:p-4 rounded-full shadow-2xl z-40 transition-transform hover:scale-110 flex items-center justify-center group"
        title="Deixe seu Feedback"
      >
        <MessageSquarePlus size={24} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[100px] transition-all duration-300 ease-in-out font-bold group-hover:ml-2">Feedback</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition">
              <X size={20} />
            </button>
            
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquarePlus size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Seu Feedback</h2>
              <p className="text-gray-500 text-sm mt-1">Ajude-nos a melhorar a plataforma!</p>
            </div>

            {sucesso ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Muito obrigado!</h3>
                <p className="text-gray-500 mt-2">Sua opinião foi enviada para nossa equipe e vai nos ajudar muito.</p>
              </div>
            ) : (
              <form onSubmit={handleEnviar} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Qual o tipo de feedback?</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition font-medium">
                    <option value="Sugestão">💡 Sugestão de Melhoria</option>
                    <option value="Elogio">❤️ Elogio</option>
                    <option value="Erro">🐛 Reportar um Erro/Bug</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sua mensagem</label>
                  <textarea 
                    required 
                    value={mensagem} 
                    onChange={e => setMensagem(e.target.value)} 
                    placeholder="Escreva o que você achou do site ou o que podemos melhorar..."
                    className="w-full p-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary outline-none transition min-h-[120px] resize-none"
                  />
                </div>
                <button type="submit" disabled={enviando || !mensagem.trim()} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                  {enviando ? <Loader2 className="animate-spin" /> : 'Enviar Feedback Seguramente'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}