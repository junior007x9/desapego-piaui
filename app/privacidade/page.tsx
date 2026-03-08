'use client'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 pb-24 md:pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Privacidade</h1>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <Lock size={56} className="mx-auto mb-4 relative z-10" />
            <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">Os seus dados estão seguros</h2>
          </div>

          <div className="p-6 md:p-8 space-y-6 text-gray-600 leading-relaxed">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Como usamos as suas informações</h3>
            <p>
              Respeitamos a sua privacidade. Recolhemos apenas os dados essenciais para o funcionamento do marketplace (como o seu E-mail para o Login e o Telefone para contactos comerciais no WhatsApp).
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mt-6">Partilha de Dados</h3>
            <p>
              <strong>Nós não vendemos os seus dados.</strong> As informações que introduz no seu Perfil Público (Nome e WhatsApp) ficam visíveis apenas para facilitar as negociações com os compradores interessados. 
            </p>

            <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mt-6">Segurança do Chat</h3>
            <p>
              As mensagens trocadas no nosso Chat Interno são armazenadas de forma segura nas nossas bases de dados (Firebase). Elas são utilizadas exclusivamente para viabilizar as suas negociações e podem ser acedidas pelos administradores apenas em casos de denúncias de fraudes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}