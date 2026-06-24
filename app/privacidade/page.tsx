import Link from 'next/link'
import { ChevronLeft, ShieldCheck, Lock, Eye, Database, CreditCard, Coins, Mail } from 'lucide-react'

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
                <li><strong>Dados de Cadastro:</strong> Nome, endereço de e-mail e foto de perfil (coletados via provedores seguros ou fornecidos manualmente).</li>
                <li><strong>Dados de Contato Profissional/Venda:</strong> Número de telefone/WhatsApp e cidade/bairro de atuação.</li>
                <li><strong>Dados de Navegação:</strong> Informações técnicas e cookies estritamente necessários para manter sua sessão ativa e salvar suas preferências locais.</li>
                <li><strong className="text-amber-600">Dados de Engajamento (Moedas):</strong> Registramos suas interações (como acessos diários e indicações) estritamente para contabilizar, gerar e distribuir as suas <strong>Moedas Virtuais</strong> no nosso Sistema de Recompensas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="text-accent" size={24} /> 2. Exibição Pública do WhatsApp
              </h2>
              <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                <p><strong>Atenção:</strong> O Desapego Piauí optou por <strong>não possuir um chat interno</strong> para garantir que você tenha conversas mais rápidas e diretas de forma local.</p>
                <p className="mt-2">Ao criar um anúncio na nossa plataforma, o número de WhatsApp fornecido por você ficará visível publicamente apenas durante o período de validade do seu anúncio (<strong>7 dias para anúncios Grátis</strong> ou <strong>20 dias para planos VIP</strong>). Ao cadastrar o seu número, você concorda expressamente com esta exibição para fins de execução de contrato (venda do produto).</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-500" size={24} /> 3. Dados de Pagamento e Taxas
              </h2>
              <p>O Desapego Piauí <strong>não armazena nem tem acesso</strong> aos seus dados bancários, números de cartão de crédito ou chaves Pix pessoais.</p>
              <p className="mt-2">Toda a infraestrutura de pagamento dos planos de destaque (Topo, Turbo e Ouro) é processada externamente pelo gateway do <strong>Mercado Pago</strong>, que possui os mais altos padrões de criptografia. Apenas recebemos uma notificação informando se o pagamento do seu plano foi aprovado para ativarmos o destaque.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="text-purple-500" size={24} /> 4. Comunicação e E-mails
              </h2>
              <p>Utilizamos a infraestrutura segura do <strong>Resend</strong> para o envio de e-mails transacionais (como links de verificação, recuperação de senha, suporte e confirmação de anúncios aprovados). Garantimos que <strong>não enviamos SPAM</strong> e não vendemos o seu endereço de e-mail para listas de terceiros.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="text-gray-800" size={24} /> 5. Como Protegemos Seus Dados
              </h2>
              <p>Seus dados são armazenados em servidores de altíssima segurança do <strong>Google (Firebase)</strong>, com criptografia ponta a ponta. Nossa equipe administrativa não possui acesso à sua senha em formato de texto. Compartilhamos dados apenas mediante ordem judicial ou solicitações de autoridades competentes para a investigação de fraudes.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="text-blue-500" size={24} /> 6. Publicidade e Google AdSense
              </h2>
              <p>O Desapego Piauí utiliza o <strong>Google AdSense</strong> para exibir publicidade, ajudando a manter a plataforma gratuita:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>O Google utiliza cookies para veicular anúncios com base nas suas visitas anteriores.</li>
                <li>Você pode desativar a publicidade personalizada acessando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Configurações de Anúncios do Google</a>.</li>
                <li>Para entender como o Google coleta esses dados, acesse: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Como o Google usa informações de sites</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4">7. Seus Direitos e Retenção</h2>
              <p>Manteremos seus dados apenas pelo tempo necessário. Como titular dos dados (Art. 18 da LGPD), você tem o direito garantido de solicitar:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>O acesso ou a correção de dados incompletos ou inexatos (diretamente no seu painel "Minha Conta").</li>
                <li>A <strong>exclusão total e irrevogável</strong> da sua conta, das suas moedas e dos seus dados pessoais dos nossos servidores.</li>
              </ul>
              <p className="mt-4 bg-gray-100 p-4 rounded-xl text-sm border border-gray-200">
                Para exercer seus direitos, solicitar a exclusão de dados ou tirar dúvidas sobre privacidade, entre em contato através do e-mail: <strong>contato@desapegopiaui.com.br</strong>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}