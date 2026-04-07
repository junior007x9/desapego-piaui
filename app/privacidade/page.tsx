import Link from 'next/link'
import { ChevronLeft, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade | Desapego Piauí',
  description: 'Saiba como o Desapego Piauí protege seus dados pessoais de acordo com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline mb-6">
          <ChevronLeft size={20} /> Voltar para o início
        </Link>

        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <ShieldCheck size={32} />
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Política de Privacidade</h1>
          
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <p>No <strong>Desapego Piauí</strong>, a sua privacidade é uma prioridade. Esta política explica como coletamos, usamos e protegemos as suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">1. Dados que Coletamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Cadastro:</strong> Nome, endereço de e-mail e foto de perfil (quando fornecida via login social ou inserida manualmente).</li>
              <li><strong>Dados de Contato:</strong> Número de telefone/WhatsApp (quando inserido voluntariamente pelo usuário para receber contatos de compradores).</li>
              <li><strong>Dados de Navegação:</strong> Informações sobre como você usa a plataforma, endereços IP e cookies para melhorar a experiência do usuário.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">2. Como Usamos Seus Dados</h2>
            <p>Utilizamos os seus dados exclusivamente para o funcionamento da plataforma, com os seguintes propósitos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Permitir a criação e o gerenciamento de seus anúncios.</li>
              <li>Facilitar a comunicação entre compradores e vendedores (exibindo seu número de contato ou através do nosso Chat Interno).</li>
              <li>Prevenir fraudes, perfis falsos e garantir a segurança da comunidade.</li>
              <li>Processar pagamentos de planos VIP (Destaque).</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">3. Compartilhamento de Dados</h2>
            <p>O Desapego Piauí <strong>não vende nem aluga</strong> seus dados pessoais para terceiros. As suas informações de contato (como o WhatsApp) só ficam visíveis publicamente caso você decida incluí-las no seu perfil de vendedor para facilitar as vendas.</p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">4. Segurança</h2>
            <p>Armazenamos seus dados em servidores seguros (Google Cloud / Firebase) que utilizam criptografia avançada. Apesar de adotarmos as melhores práticas de segurança, lembramos que nenhum sistema na internet é 100% invulnerável.</p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">5. Seus Direitos (LGPD)</h2>
            <p>Você tem o direito de solicitar a qualquer momento:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A visualização dos dados que temos sobre você.</li>
              <li>A correção de dados incompletos ou inexatos.</li>
              <li>A exclusão permanente da sua conta e dos seus dados do nosso banco de dados.</li>
            </ul>
            <p>Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato através de: <strong>contato@desapegopiaui.com.br</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}