import Link from 'next/link'
import { ChevronLeft, ShieldCheck, Lock, Eye, Database, CreditCard, Coins } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidade | Desapego Piauí',
  description: 'Saiba como o Desapego Piauí protege seus dados pessoais em conformidade estrita com a LGPD.',
}

export default function PrivacidadePage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline mb-6 transition-colors">
          <ChevronLeft size={20} /> Voltar para o início
        </Link>

        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">Política de Privacidade (LGPD)</h1>
          
          <div className="space-y-8 text-gray-600 leading-relaxed font-medium">
            <p>No <strong>Desapego Piauí</strong>, a sua privacidade é uma prioridade absoluta. Este documento explica de forma transparente como coletamos, utilizamos, armazenamos e protegemos as suas informações pessoais, em estrita conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> do Brasil.</p>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Database className="text-primary" size={24} /> 1. Dados que Coletamos
              </h2>
              <p>Para fornecer nossos serviços de classificados e recompensas, coletamos os seguintes dados:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Dados de Cadastro:</strong> Nome, endereço de e-mail e foto de perfil (coletados via Google ou fornecidos manualmente).</li>
                <li><strong>Dados de Contato Profissional/Venda:</strong> Número de telefone/WhatsApp.</li>
                <li><strong>Dados de Navegação:</strong> Informações técnicas como IP, tipo de navegador, localização aproximada (cidade) para filtros, e cookies para manter sua sessão ativa.</li>
                <li><strong>Dados de Engajamento:</strong> Registramos suas interações diárias (como acessos e criação de anúncios) estritamente para contabilizar e distribuir suas <strong>Moedas Virtuais</strong> no nosso Sistema de Recompensas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="text-accent" size={24} /> 2. Exibição Pública do WhatsApp (Sem Chat Interno)
              </h2>
              <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                <p><strong>Atenção:</strong> O Desapego Piauí optou por <strong>não possuir um chat interno</strong> para garantir que você tenha conversas mais rápidas e diretas.</p>
                <p className="mt-2">Ao criar um anúncio na nossa plataforma, o número de telefone/WhatsApp fornecido por você <strong>ficará visível publicamente</strong> para qualquer pessoa que acessar o seu anúncio. A base legal para esta exibição é o seu <strong>Consentimento</strong> e a <strong>Execução de Contrato</strong> (permitir que o comprador lhe encontre). Ao cadastrar o seu número, você concorda expressamente com esta exibição pública.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-500" size={24} /> 3. Dados de Pagamento e Taxas (Mercado Pago)
              </h2>
              <p>O Desapego Piauí <strong>não armazena nem tem acesso</strong> aos seus dados bancários, números de cartão de crédito ou chaves Pix pessoais.</p>
              <p className="mt-2">Toda a infraestrutura de pagamento dos planos de destaque e o cálculo de taxas operacionais são processados diretamente pelo gateway do <strong>Mercado Pago</strong>, que possui os mais altos padrões de criptografia e conformidade legal. Apenas recebemos uma notificação informando se o pagamento foi aprovado ou recusado. Ressaltamos que a taxa de processamento cobrada pelo Mercado Pago é <strong>repassada ao usuário</strong>, sendo este valor sempre exibido de forma totalmente transparente no momento do checkout.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="text-gray-800" size={24} /> 4. Como Protegemos e Compartilhamos Seus Dados
              </h2>
              <p>O Desapego Piauí <strong>não vende, não aluga e não repassa</strong> seus dados pessoais para empresas de marketing de terceiros.</p>
              <p className="mt-2">Seus dados são armazenados em servidores seguros utilizando infraestrutura de ponta (Google Cloud / Firebase), com criptografia em trânsito e em repouso. Compartilhamos dados apenas em casos de ordem judicial ou solicitações de autoridades competentes para a investigação de fraudes e crimes cibernéticos.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4">5. Retenção de Dados</h2>
              <p>Manteremos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política. Caso você exclua sua conta, seus dados pessoais e anúncios serão removidos permanentemente dos nossos bancos de dados ativos, exceto se houver obrigação legal de retenção por prazos estipulados no Marco Civil da Internet (Lei nº 12.965/2014).</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4">6. Seus Direitos (Art. 18 da LGPD)</h2>
              <p>Como titular dos dados, você tem o direito garantido por lei de solicitar a qualquer momento:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Confirmação e acesso aos dados que possuímos sobre você.</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados (diretamente no seu painel de perfil).</li>
                <li>Revogação do consentimento e a <strong>exclusão total</strong> da sua conta e dos seus dados pessoais.</li>
              </ul>
              <p className="mt-4 bg-gray-100 p-4 rounded-xl text-sm border border-gray-200">
                Para exercer seus direitos, solicitar a exclusão de dados ou tirar dúvidas sobre privacidade, entre em contato com nosso Encarregado de Dados (DPO) através do e-mail: <strong>privacidade@desapegopiaui.com.br</strong>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}