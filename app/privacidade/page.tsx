'use client'
import Link from 'next/link'
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 pb-24 md:pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Privacidade & LGPD</h1>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <Lock size={56} className="mx-auto mb-4 relative z-10" />
            <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">Os seus dados estão seguros</h2>
          </div>

          <div className="p-6 md:p-8 space-y-6 text-gray-600 leading-relaxed">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-2">1. Como usamos as suas informações</h3>
            <p>
              Recolhemos apenas os dados essenciais para o funcionamento do marketplace (como o seu E-mail para o Login e o Telefone para contactos comerciais no WhatsApp). As suas passwords são encriptadas pelo Google Firebase.
            </p>
            
            <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mt-6">2. Partilha de Dados</h3>
            <p>
              <strong>Nós não vendemos os seus dados.</strong> As informações que introduz no seu Perfil Público (Nome e WhatsApp) ficam visíveis apenas para facilitar as negociações com os compradores.
            </p>

            <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mt-6">3. Conformidade com a LGPD</h3>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui os seguintes direitos:</p>
            <ul className="space-y-3 mt-4">
              <li className="flex gap-3"><CheckCircle className="text-primary shrink-0" size={20}/> <strong>Acesso e Correção:</strong> Você pode alterar os seus dados a qualquer momento no menu "Meu Perfil".</li>
              <li className="flex gap-3"><CheckCircle className="text-primary shrink-0" size={20}/> <strong>Direito ao Esquecimento (Exclusão):</strong> Você pode apagar a sua conta e todos os seus dados permanentemente através da opção "Excluir Conta" no seu perfil.</li>
              <li className="flex gap-3"><CheckCircle className="text-primary shrink-0" size={20}/> <strong>Revogação de Consentimento:</strong> Você pode gerir o uso de Cookies limpando os dados do seu navegador.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}