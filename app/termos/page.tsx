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
            O Desapego Piauí atua exclusivamente como uma plataforma de classificados online, oferecendo um espaço virtual para que usuários (compradores e vendedores) se encontrem e negociem diretamente. <strong>Nós não participamos, não intermediamos, não garantimos e não nos responsabilizamos pelas transações realizadas entre os usuários.</strong>
          </p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">2. Planos de Destaque e Pagamentos</h3>
          <ul className="space-y-2 list-none pl-0">
            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5"/> <strong>Plano Básico (Grátis):</strong> Permite a inclusão de até 5 fotos e o anúncio permanece no ar por 7 dias.</li>
            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-blue-500 shrink-0 mt-0.5"/> <strong>Planos Pagos (Topo, Turbo, Ouro):</strong> Permitem até 10 fotos, garantem posição de destaque de acordo com a categoria comprada, e permanecem no ar por 20 dias.</li>
          </ul>
          <p className="mt-4">
            Todos os pagamentos (PIX) referentes à compra de destaques são processados por uma instituição financeira terceira (Mercado Pago). Uma taxa de transação poderá ser acrescida ao valor final para cobrir os custos operacionais da intermediadora financeira. Não realizamos reembolsos de planos de destaque após a ativação do anúncio, visto que o serviço de exposição virtual é prestado imediatamente.
          </p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">3. Sistema de Moedas Virtuais</h3>
          <p>
            A plataforma pode fornecer "Moedas Virtuais" através de atividades promocionais (Gamificação). Estas moedas não possuem nenhum valor monetário real, não podem ser sacadas, transferidas para contas bancárias ou convertidas em dinheiro. Elas servem estritamente para ser trocadas por benefícios internos dentro do site (ex: resgatar um plano de destaque).
          </p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">4. Regras de Publicação</h3>
          <p>É terminantemente proibido anunciar:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Armas de fogo, munições ou explosivos.</li>
            <li>Drogas, entorpecentes ou medicamentos sob prescrição.</li>
            <li>Produtos falsificados, clonados ou pirateados.</li>
            <li>Animais cuja venda seja proibida por lei.</li>
            <li>Serviços de natureza ilícita ou conteúdo adulto/pornográfico.</li>
          </ul>
          <p>O Desapego Piauí reserva-se o direito de excluir, sem aviso prévio, qualquer anúncio que viole estas regras ou a legislação brasileira, bem como banir o usuário infrator.</p>

          <h3 className="text-xl font-black text-gray-900 mt-8 mb-3">5. Isenção de Responsabilidade</h3>
          <p>
            O usuário reconhece que o Desapego Piauí não garante a veracidade, exatidão ou qualidade dos produtos e serviços anunciados. Recomendamos cautela em todas as negociações. Nunca realize pagamentos antecipados e sempre marque encontros para troca de produtos em locais públicos e seguros.
          </p>
        </div>
      </div>
    </div>
  )
}