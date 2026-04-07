import Link from 'next/link'
import { ChevronLeft, Scale } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso | Desapego Piauí',
  description: 'Termos de uso e condições de serviço do marketplace Desapego Piauí.',
}

export default function TermosPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline mb-6">
          <ChevronLeft size={20} /> Voltar para o início
        </Link>

        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <Scale size={32} />
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Termos de Uso</h1>
          
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <p><strong>Última atualização:</strong> Abril de 2026</p>
            
            <p>Bem-vindo ao <strong>Desapego Piauí</strong>. Ao acessar e utilizar nossa plataforma, você concorda em cumprir os presentes Termos de Uso. Recomendamos que leia atentamente antes de criar anúncios ou realizar negociações.</p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">1. Natureza do Serviço</h2>
            <p>O Desapego Piauí atua exclusivamente como um portal de classificados online, oferecendo um espaço virtual para que usuários (vendedores) publiquem anúncios de produtos e serviços, e outros usuários (compradores) possam contatá-los.</p>
            <p className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-100">
              <strong>Importante:</strong> Não somos intermediadores de pagamentos das mercadorias, não realizamos entregas e não garantimos a qualidade, procedência ou existência dos produtos anunciados. A negociação é feita diretamente entre comprador e vendedor.
            </p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">2. Regras de Anúncio</h2>
            <p>Ao publicar um anúncio, o usuário compromete-se a fornecer informações claras, verdadeiras e atualizadas sobre o produto ou serviço. É estritamente proibido anunciar:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Armas de fogo, munições, explosivos ou itens relacionados.</li>
              <li>Drogas ilícitas, substâncias controladas ou medicamentos (com ou sem receita).</li>
              <li>Animais (silvestres ou domésticos), de acordo com nossas políticas de bem-estar animal.</li>
              <li>Produtos falsificados, pirateados, clonados ou que violem direitos autorais.</li>
              <li>Serviços ilegais ou produtos que promovam violência, ódio e discriminação.</li>
            </ul>
            <p>O Desapego Piauí reserva-se o direito de excluir, sem aviso prévio, anúncios que violem estas regras ou que recebam denúncias fundadas de fraude.</p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">3. Planos de Destaque e Pagamentos</h2>
            <p>A plataforma oferece a opção de planos pagos (VIP) para destacar anúncios. O pagamento para o destaque do anúncio na plataforma é realizado de forma antecipada. A exclusão voluntária do anúncio por parte do usuário antes do término do período contratado não gera direito a reembolso.</p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">4. Responsabilidades</h2>
            <p>O usuário é o único responsável civil e criminalmente pelo conteúdo que publica e pelas negociações que realiza. Recomendamos sempre encontrar compradores/vendedores em locais públicos e movimentados e não realizar pagamentos antecipados sem ver o produto pessoalmente.</p>

            <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">5. Contato</h2>
            <p>Para dúvidas, denúncias ou suporte técnico, entre em contato através do e-mail: <strong>contato@desapegopiaui.com.br</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}