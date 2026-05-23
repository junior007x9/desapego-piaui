import Link from 'next/link'
import { ChevronLeft, Scale, AlertTriangle, MessageCircle, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Termos de Uso | Desapego Piauí',
  description: 'Termos de uso, isenção de responsabilidade e condições de serviço do marketplace Desapego Piauí.',
}

export default function TermosPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline mb-6 transition-colors">
          <ChevronLeft size={20} /> Voltar para o início
        </Link>

        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <Scale size={32} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">Termos e Condições de Uso</h1>
          
          <div className="space-y-8 text-gray-600 leading-relaxed font-medium">
            <p className="text-sm text-gray-500"><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            
            <p>Bem-vindo ao <strong>Desapego Piauí</strong>. Ao acessar, navegar ou utilizar nossa plataforma, você concorda expressamente em cumprir e estar vinculado aos presentes Termos de Uso. Recomendamos a leitura atenta antes de criar anúncios ou iniciar negociações.</p>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <ShieldAlert className="text-accent" size={24} /> 1. Natureza do Serviço e Isenção de Responsabilidade
              </h2>
              <p className="mb-4">O Desapego Piauí atua <strong>exclusivamente como um portal de classificados online (vitrine virtual)</strong>. Nosso objetivo é fornecer um espaço para que usuários (vendedores) publiquem anúncios e compradores os encontrem.</p>
              <div className="bg-orange-50 text-orange-900 p-5 rounded-2xl border border-orange-200 shadow-sm">
                <ul className="list-disc pl-5 space-y-2 font-bold">
                  <li>NÃO intermediamos pagamentos, não retemos valores e não oferecemos "Compra Garantida".</li>
                  <li>NÃO realizamos ou garantimos a entrega de mercadorias.</li>
                  <li>NÃO garantimos a veracidade, qualidade, procedência ou existência física dos produtos anunciados pelos usuários.</li>
                  <li>Qualquer negociação é feita por conta e risco exclusivo dos usuários envolvidos.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle className="text-green-500" size={24} /> 2. Comunicação Externa (Sem Chat Interno)
              </h2>
              <p>O Desapego Piauí <strong>não possui sistema de chat interno</strong>. Toda a comunicação entre compradores e vendedores é realizada externamente, geralmente através do WhatsApp ou ligações telefônicas, utilizando o número disponibilizado voluntariamente pelo vendedor no anúncio.</p>
              <p className="mt-2 text-red-600 font-bold">O Desapego Piauí não tem acesso, não monitora e não se responsabiliza por conversas, promessas, envio de links ou acordos firmados fora da nossa plataforma (ex: no WhatsApp).</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={24} /> 3. Prevenção Contra Golpes (Alerta Importante)
              </h2>
              <p>Ao utilizar nossa plataforma, o usuário declara estar ciente dos riscos inerentes ao comércio online. O Desapego Piauí não se responsabiliza por perdas financeiras decorrentes de fraudes. Recomendamos veementemente:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-700">
                <li><strong>Cuidado com o "Golpe do Intermediário":</strong> Desconfie de pessoas que dizem estar comprando para terceiros (para pagar uma dívida, para um funcionário, etc.) e pedem para você não falar o valor real do produto.</li>
                <li><strong>Locais Seguros:</strong> Sempre marque encontros para testar e entregar o produto em locais públicos, claros e movimentados (ex: shoppings, praças de alimentação, em frente a postos policiais).</li>
                <li><strong>Pagamentos:</strong> Nunca envie o produto antes de confirmar que o valor (PIX ou transferência) realmente caiu e está <strong>liberado</strong> na sua conta bancária. Não confie apenas em comprovantes enviados pelo WhatsApp.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4">4. Regras de Publicação de Anúncios</h2>
              <p>O usuário é o único responsável civil e criminalmente pelo conteúdo que publica. É estritamente proibido anunciar:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Armas de fogo, munições, explosivos ou réplicas.</li>
                <li>Drogas ilícitas, substâncias controladas, anabolizantes ou medicamentos.</li>
                <li>Produtos furtados, roubados, falsificados, pirateados ou que violem direitos autorais.</li>
                <li>Serviços de prostituição, conteúdos pornográficos ou que promovam violência e ódio.</li>
              </ul>
              <p className="mt-2">O Desapego Piauí reserva-se o direito de excluir, sem aviso prévio, anúncios que violem estas regras, bem como banir o usuário infrator e reportar às autoridades competentes.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-gray-900 mb-4">5. Planos, Destaques e Gratuidade</h2>
              <p>A plataforma pode oferecer planos gratuitos (como o Plano Diário) e planos pagos (Destaque VIP). As promoções de gratuidade podem ser alteradas ou encerradas a qualquer momento pela administração. Não há reembolso para anúncios VIP caso o usuário decida excluir o anúncio antes do término do período contratado ou caso o anúncio seja removido por violar nossas regras.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}