'use client'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Phone, Mail, Instagram } from 'lucide-react'

export default function ContatoPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 pb-24 md:pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Fale Conosco</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card WhatsApp */}
          <a href="https://wa.me/5586988527230" target="_blank" rel="noopener noreferrer" className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all group">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone size={36} strokeWidth={2.5}/>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">WhatsApp Suporte</h3>
            <p className="text-gray-500 mb-4 font-medium">Atendimento rápido para dúvidas, pagamentos ou denúncias de anúncios.</p>
            <span className="text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full">(86) 98852-7230</span>
          </a>

          {/* Card Email */}
          <a href="mailto:contato@desapegopiaui.com.br" className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-all group">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail size={36} strokeWidth={2.5}/>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">E-mail</h3>
            <p className="text-gray-500 mb-4 font-medium">Envie-nos uma mensagem para parcerias, sugestões ou suporte técnico.</p>
            <span className="text-primary font-bold bg-primary/5 px-4 py-2 rounded-full break-all text-sm">contato@desapegopiaui.com.br</span>
          </a>

        </div>

        <div className="mt-8 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
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