import Link from 'next/link'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition">
            <ArrowLeft size={24} />
          </Link>
          <div className="bg-blue-50 text-blue-500 p-3 rounded-xl">
             <ShieldCheck size={28} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Termos de Uso e Privacidade</h1>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100 prose prose-lg max-w-none text-gray-600">
          
          <p className="text-sm text-gray-400 font-bold mb-8">Última atualização: Março de 2026</p>

          <h2 className="text-xl font-black text-gray-900 mb-4">1. Aceitação dos Termos</h2>
          <p className="mb-6">Ao acessar e utilizar o Desapego Piauí, você concorda expressamente com estes Termos de Uso e com nossa Política de Privacidade. Se você não concordar com qualquer condição, por favor, não utilize a plataforma.</p>

          <h2 className="text-xl font-black text-gray-900 mb-4">2. O Papel do Desapego Piauí</h2>
          <p className="mb-6">O Desapego Piauí atua <strong>exclusivamente como uma vitrine virtual</strong> (classificados), aproximando vendedores e compradores. <strong>Nós não participamos das negociações</strong>, não cobramos comissões sobre vendas, não realizamos entregas e não garantimos a veracidade dos produtos anunciados.</p>

          <h2 className="text-xl font-black text-gray-900 mb-4">3. Responsabilidade do Usuário</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>O vendedor é o único responsável pela legalidade, qualidade e entrega do produto anunciado.</li>
            <li>O comprador é responsável por avaliar as condições do produto e os riscos da negociação antes de realizar qualquer pagamento.</li>
            <li><strong>Recomendação de Segurança:</strong> Nunca realize pagamentos antecipados (PIX, transferências) sem ter visto o produto pessoalmente em local público e seguro.</li>
          </ul>

          <h2 className="text-xl font-black text-gray-900 mb-4">4. Itens Proibidos</h2>
          <p className="mb-6">É terminantemente proibido anunciar: Armas de fogo, drogas ilícitas, medicamentos com receita, produtos falsificados/réplicas, animais silvestres, órgãos humanos, serviços ilegais ou qualquer item que viole as leis brasileiras.</p>

          <h2 className="text-xl font-black text-gray-900 mb-4">5. Política de Privacidade (LGPD)</h2>
          <p className="mb-6">Levamos sua privacidade a sério, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018):</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Coleta:</strong> Coletamos apenas os dados necessários para a criação da conta e prevenção a fraudes (CPF, Nome, Endereço, E-mail).</li>
            <li><strong>Sigilo:</strong> Seus dados pessoais (CPF e Endereço exato) <strong>nunca serão exibidos publicamente</strong>. Apenas seu "Nome de Usuário", "Cidade/Estado" e "WhatsApp" ficam visíveis para facilitar a negociação.</li>
            <li><strong>Exclusão (Soft Delete):</strong> Ao solicitar a exclusão da conta, seu perfil é imediatamente ocultado. Seus dados permanecerão congelados em nosso banco de dados por 30 dias por questões de segurança e prevenção a fraudes jurídicas, sendo apagados definitivamente após este prazo.</li>
          </ul>

        </div>
      </div>
    </div>
  )
}