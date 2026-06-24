'use client'
import Link from 'next/link'
import { ChevronLeft, MapPin, Search, PlusCircle, MessageSquare, Coins, ShieldCheck, Rocket } from 'lucide-react'

export default function TutorialPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-10 font-sans">
      
      {/* Cabeçalho */}
      <div className="bg-gradient-to-br from-primary to-primary-dark pt-10 pb-16 px-4 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-6">
          <Link href="/" title="Voltar para a página inicial" className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition self-start md:self-center outline-none">
            <ChevronLeft size={24}/>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
              Como usar o Desapego Piauí?
            </h1>
            <p className="text-primary-100 font-medium text-sm md:text-base">
              Aprenda a comprar, vender e ganhar moedas na nossa plataforma.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 space-y-6">

        {/* Passo 1: Explorar */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border-b-[4px] border-blue-200">
            <Search size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">1. Encontrando o que você precisa</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              Use a barra de busca no topo do site ou navegue pelas <strong>Categorias</strong> (Imóveis, Veículos, Celulares, etc). Ao clicar no botão de filtros, você pode escolher a sua cidade clicando no ícone de <MapPin size={16} className="inline text-accent"/> localização para ver apenas anúncios perto de você.
            </p>
          </div>
        </div>

        {/* Passo 2: Anunciar */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0 border-b-[4px] border-green-200">
            <PlusCircle size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">2. Criando o seu Anúncio</h2>
            <p className="text-gray-600 font-medium leading-relaxed mb-3">
              Clique no botão <strong>"+ Anunciar"</strong>. Preencha o título, categoria, coloque fotos nítidas do seu produto e um preço justo.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700">
              <strong className="text-primary block mb-1">Dica de Ouro:</strong>
              Seja honesto na descrição! Isso evita perguntas repetidas no WhatsApp e faz você vender muito mais rápido.
            </div>
          </div>
        </div>

        {/* Passo 3: Destaques */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 border-b-[4px] border-amber-200">
            <Rocket size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">3. Vendendo mais Rápido (Planos VIP)</h2>
            <p className="text-gray-600 font-medium leading-relaxed mb-3">
              Anunciar no plano Básico é 100% grátis e dura <strong>7 dias</strong>. Mas, se você tem pressa para vender, pode destacar o seu produto com os nossos Planos VIP: <strong>Sobe pro Topo</strong>, <strong>Destaque Turbo</strong> ou <strong>Ouro Urgente</strong>. Os planos VIP dão exposição máxima para o seu produto na tela inicial e duram <strong>20 dias</strong>. O pagamento é feito via PIX com liberação imediata.
            </p>
          </div>
        </div>

        {/* Passo 4: Moedas */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 border-b-[4px] border-purple-200">
            <Coins size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">4. Como ganhar Moedas Virtuais?</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              O nosso sistema de recompensas permite que você destaque seus anúncios sem gastar dinheiro! Ao criar a sua conta, você já ganha <strong>10 moedas</strong>. Se você indicar um amigo com seu link exclusivo, você ganha mais <strong>50 moedas</strong>. Juntando essas moedas, você pode resgatar pacotes Topo (50 moedas), Turbo (150 moedas) ou Ouro (400 moedas) de graça!
            </p>
          </div>
        </div>

        {/* Passo 5: Segurança */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0 border-b-[4px] border-red-200">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">5. Segurança nas Negociações</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              Não temos chat interno. As negociações ocorrem direto no seu <strong>WhatsApp</strong>. Cuidado com golpistas pedindo para você esconder o preço ou apagar o anúncio antes de pagar. Marque encontros apenas em locais públicos e só entregue o produto após confirmar o Pix diretamente no aplicativo do seu banco.
            </p>
            <Link href="/seguranca" className="text-primary font-bold hover:underline mt-2 inline-block">
              Ler todas as dicas de segurança &rarr;
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}