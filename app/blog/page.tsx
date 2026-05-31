import Link from 'next/link'
import { ChevronLeft, BookOpen } from 'lucide-react'

export const metadata = {
  title: 'Blog Desapego Piauí | Dicas de Compra e Venda',
  description: 'Dicas valiosas de como vender mais rápido, comprar com segurança e aproveitar as melhores ofertas no Piauí.',
}

export default function BlogPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        
        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline mb-6 transition-colors">
          <ChevronLeft size={20} /> Voltar para o início
        </Link>

        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
            <BookOpen size={32} strokeWidth={2.5} />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 tracking-tight">
            Blog do Desapego Piauí
          </h1>
          
          <div className="space-y-12 text-gray-600 leading-relaxed font-medium">
            
            {/* ARTIGO 1 */}
            <article className="border-b border-gray-100 pb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-4 hover:text-primary transition-colors cursor-pointer">
                5 Dicas Infalíveis para Vender o seu Carro Usado mais Rápido no Piauí
              </h2>
              <p className="text-sm text-gray-400 mb-4">Publicado em {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="mb-4">
                Vender um veículo usado pode parecer uma tarefa difícil, mas com as estratégias certas, você pode fechar negócio em tempo recorde. No mercado automotivo do Piauí, a transparência e a apresentação do veículo são fundamentais. A primeira dica é investir em fotografias de alta qualidade. Tire fotos durante o dia, em locais iluminados, mostrando todos os ângulos do carro, inclusive detalhes do interior e do painel.
              </p>
              <p className="mb-4">
                Em segundo lugar, seja totalmente honesto na descrição do anúncio. Informe o ano, modelo, quilometragem real e se há algum detalhe de funilaria a ser feito. Compradores valorizam a sinceridade e isso evita perda de tempo para ambos os lados. Uma descrição completa (com pelo menos 3 parágrafos) passa muito mais credibilidade no Desapego Piauí.
              </p>
              <p>
                Por fim, defina um preço competitivo baseado na Tabela FIPE e no mercado local de cidades como Teresina e Parnaíba. Lembre-se de manter o seu WhatsApp atualizado no perfil para responder rapidamente aos interessados. A velocidade na resposta é o principal fator que define se você vai ou não fechar a venda!
              </p>
            </article>

            {/* ARTIGO 2 */}
            <article className="border-b border-gray-100 pb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-4 hover:text-primary transition-colors cursor-pointer">
                Como Evitar Golpes ao Comprar Celulares Usados na Internet
              </h2>
              <p className="text-sm text-gray-400 mb-4">Publicado em {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="mb-4">
                O mercado de celulares seminovos é um dos mais movimentados do Brasil. Trocar de smartphone comprando um modelo usado é uma excelente forma de economizar dinheiro, mas exige cautela. O "Golpe do Intermediário" é a fraude mais comum atualmente. Ele ocorre quando um golpista clona um anúncio real e tenta enganar tanto o comprador quanto o vendedor verdadeiro, pedindo que ambos não conversem sobre valores durante o encontro.
              </p>
              <p className="mb-4">
                Para comprar com segurança no Desapego Piauí, a regra de ouro é: comunique-se diretamente com a pessoa que vai lhe entregar o aparelho. Ao marcar o encontro para ver o celular, escolha sempre locais públicos, como praças de alimentação de shoppings centers. Nunca marque em ruas desertas ou residências de desconhecidos.
              </p>
              <p>
                Antes de fazer o pagamento via PIX, pegue o celular em mãos. Teste a câmera, o microfone, conecte a sua conta iCloud ou Google para garantir que o aparelho não está bloqueado, e insira o seu chip (cartão SIM) para fazer uma chamada de teste. Só transfira o dinheiro quando tiver certeza absoluta de que o aparelho funciona perfeitamente e certifique-se de que o nome do recebedor do PIX bate com o nome de quem lhe está a entregar o telefone.
              </p>
            </article>

            {/* ARTIGO 3 */}
            <article>
              <h2 className="text-2xl font-black text-gray-900 mb-4 hover:text-primary transition-colors cursor-pointer">
                Economia Circular: Por que Vender Roupas e Móveis Usados Ajuda o Meio Ambiente?
              </h2>
              <p className="text-sm text-gray-400 mb-4">Publicado em {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="mb-4">
                Você já parou para pensar no impacto ambiental das coisas que estão paradas no fundo do seu armário? A economia circular é um conceito que visa prolongar a vida útil dos produtos, evitando que eles parem no lixo prematuramente. Quando você vende aquele sofá que já não cabe na sua sala ou aquelas roupas que não lhe servem mais no Desapego Piauí, você está diretamente contribuindo para a sustentabilidade.
              </p>
              <p className="mb-4">
                A indústria têxtil, por exemplo, é uma das que mais consome água no mundo. Optar por comprar roupas em bom estado de outras pessoas reduz a necessidade de produção de novas peças. Além de ser uma atitude ecológica, é uma ação inteligente para o seu bolso, permitindo adquirir produtos de marcas renomadas por uma fração do preço original.
              </p>
              <p>
                Móveis de madeira antiga costumam ter uma durabilidade muito superior aos fabricados atualmente em aglomerado. Restaurar e revender esses itens não só movimenta a economia local, gerando renda extra para quem vende, mas também mobila as casas de quem compra com muito mais personalidade e resistência. Faça a sua parte: desapegue do que não usa mais e dê uma nova vida aos seus pertences!
              </p>
            </article>

          </div>
        </div>
      </div>
    </div>
  )
}