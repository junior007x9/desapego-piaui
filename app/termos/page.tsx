import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors mb-8">
          <ArrowLeft size={20} /> Voltar para o início
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Termos de Uso</h1>
            <p className="text-gray-500 font-medium mt-1">Última atualização: Junho de 2026</p>
          </div>
        </div>

        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
          <p>
            Bem-vindo ao <strong>Desapego Piauí</strong>. Ao acessar e utilizar o nosso portal, você concorda expressamente com os termos e condições descritos abaixo. Leia atentamente antes de publicar qualquer anúncio.
          </p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">1. Natureza do Serviço</h3>
          <p>
            O Desapego Piauí atua exclusivamente como uma plataforma de classificados online, oferecendo um espaço virtual para que usuários (compradores e vendedores) se encontrem e negociem diretamente. <strong>Nós não participamos, não intermediamos, não garantimos e não nos responsabilizamos pelas transações realizadas entre os usuários ou pela qualidade dos produtos.</strong>
          </p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">2. Planos de Destaque, Prazos e Pagamentos</h3>
          <p>
            A plataforma disponibiliza diferentes modalidades de exposição para as publicações, cujos limites de imagens, prazos de validade e valores comerciais são definidos da seguinte forma:
          </p>
          <ul className="space-y-3 list-none pl-0">
            <li className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5"/> 
              <div>
                <strong>Plano Básico (Grátis):</strong> Permite a inclusão de até 5 fotos e o anúncio permanece ativo pelo período de <strong>7 dias</strong>.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={18} className="text-blue-500 shrink-0 mt-0.5"/> 
              <div>
                <strong>Plano Sobe pro Topo (R$ 5,00):</strong> Garante que a publicação seja impulsionada acima dos anúncios gratuitos. Permite até 10 fotos e permanece ativo por <strong>20 dias</strong>.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={18} className="text-purple-500 shrink-0 mt-0.5"/> 
              <div>
                <strong>Plano Destaque Turbo (R$ 9,90):</strong> Exibe o anúncio em formato de Stories no topo das listagens com borda colorida diferenciada. Permite até 10 fotos e permanece ativo por <strong>20 dias</strong>.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={18} className="text-amber-500 shrink-0 mt-0.5"/> 
              <div>
                <strong>Plano Ouro / Urgente (R$ 19,90):</strong> Destina uma vaga fixa no carrossel principal de maior visibilidade no topo do site. Permite até 10 fotos e permanece ativo por <strong>20 dias</strong>.
              </div>
            </li>
          </ul>
          <p className="mt-4">
            Todos os pagamentos financeiros em moeda corrente nacional (Real) são processados via PIX através de uma intermediadora bancária terceira (Mercado Pago). Uma taxa operacional de processamento financeiro poderá ser discriminada e cobrada junto ao valor final na tela de pagamento. Não serão emitidos estornos ou reembolsos após a devida ativação do plano no anúncio, visto que o serviço de exposição de mídia digital é disponibilizado e consumido imediatamente.
          </p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">3. Sistema de Moedas Virtuais e Recompensas</h3>
          <p>
            A plataforma conta com um ecossistema de bonificação interna por engajamento (Gamificação), no qual os usuários acumulam "Moedas Piauí" realizando tarefas como o cadastro inicial (+10 moedas), indicação de novos membros com links de afiliados (+50 moedas) ou manutenção de acessos diários (Ofensiva). 
          </p>
          <p>
            Fica expressamente determinado que estas moedas virtuais <strong>não possuem qualquer valor monetário, valor de resgate ou correspondência em dinheiro real</strong>. Elas não podem ser sacadas, transferidas para contas bancárias fora da plataforma ou convertidas em ativos financeiros. Sua única finalidade é o resgate exclusivo de créditos promocionais para ativação dos planos de destaque internos (sendo 50 moedas para o plano Topo, 150 moedas para o plano Turbo e 400 moedas para o plano Ouro), estendendo a validade do anúncio para os mesmos 20 dias da modalidade paga.
          </p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">4. Regras de Publicação e Controle de Conteúdo</h3>
          <p>É terminantemente proibido vehicular anúncios que contenham termos ofensivos, linguagem imprópria ou produtos e serviços ilícitos, incluindo, mas não se limitando a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Armas de fogo, réplicas, simulacros, munições ou materiais explosivos.</li>
            <li>Narcóticos, drogas ilícitas, substâncias entorpecentes ou apetrechos relacionados.</li>
            <li>Medicamentos de qualquer natureza, insumos tarja preta, anabolizantes e tratamentos médicos controlados.</li>
            <li>Animais domésticos, filhotes, espécimes silvestres ou cuja comercialização seja regulada ou proibida.</li>
            <li>Produtos clonados, falsificados, réplicas de marcas registradas ou moedas falsas.</li>
            <li>Serviços ilegais, pornografia ou material de cunho estritamente adulto.</li>
          </ul>
          <p>O Desapego Piauí reserva-se o direito de moderar, ocultar ou excluir permanentemente, sem aviso prévio ou direito a compensações, qualquer anúncio identificado por nossos filtros automatizados ou denúncias que infrinja estas diretrizes ou a legislação brasileira em vigor, podendo ainda suspender o acesso do usuário infrator.</p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">5. Isenção de Responsabilidade</h3>
          <p>
            O usuário reconhece que a plataforma não realiza vistorias físicas ou auditorias prévias sobre a idoneidade dos anunciantes ou a procedência dos itens ofertados. Recomendamos cautela máxima em todas as interações e encontros. Nunca efetue transferências antecipadas de sinal ou pagamentos sem antes examinar o produto pessoalmente. Guarde sempre a preferência por locais movimentados e públicos para a conclusão do negócio.
          </p>
        </div>
      </div>
    </div>
  )
}