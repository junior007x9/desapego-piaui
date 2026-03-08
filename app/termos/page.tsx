'use client'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 pb-24 md:pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Termos de Uso</h1>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <FileText size={56} className="mx-auto mb-4 relative z-10" />
            <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">Regras da Plataforma</h2>
          </div>

          <div className="p-6 md:p-8 space-y-6 text-gray-600 leading-relaxed">
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-primary shrink-0 mt-1" size={20}/>
              <p><strong>1. Responsabilidade dos Anúncios:</strong> O Desapego Piauí atua apenas como um classificado online. Não somos donos dos produtos, não intermediamos pagamentos e não nos responsabilizamos pela entrega ou qualidade dos itens anunciados.</p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-primary shrink-0 mt-1" size={20}/>
              <p><strong>2. Produtos Proibidos:</strong> É terminantemente proibido anunciar produtos ilícitos, falsificados, medicamentos sob prescrição, armas, ou qualquer item que viole as leis brasileiras.</p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-primary shrink-0 mt-1" size={20}/>
              <p><strong>3. Respeito na Comunidade:</strong> Não toleramos ofensas, racismo, assédio ou qualquer comportamento abusivo no nosso Chat Interno. Infratores terão suas contas banidas permanentemente.</p>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle className="text-primary shrink-0 mt-1" size={20}/>
              <p><strong>4. Planos Pagos:</strong> Ao adquirir um plano de destaque (PIX), o seu anúncio fica visível pelo tempo contratado. O valor não é reembolsável após a ativação do serviço, pois a vitrine digital já foi disponibilizada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}