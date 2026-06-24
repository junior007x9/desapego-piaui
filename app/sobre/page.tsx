'use client'
import React from 'react'
import { Target, Users, ShieldCheck, Zap, Heart, MapPin, CheckCircle2, MessageCircle, Coins, Rocket } from 'lucide-react'
import Link from 'next/link'

export default function SobrePage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="bg-primary pt-16 pb-24 px-4 rounded-b-[3rem] md:rounded-b-[4rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            Sobre o <span className="text-accent underline decoration-4 underline-offset-4">Desapego Piauí</span>
          </h1>
          <p className="text-primary-100 font-medium text-lg max-w-2xl mx-auto">
            Conectando quem quer vender com quem quer comprar em todo o estado do Piauí, de forma rápida, gamificada e sem burocracia.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        {/* SEÇÃO QUEM SOMOS */}
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 flex items-center gap-3 tracking-tight">
                <Users className="text-primary" size={32}/> Quem Somos
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed font-medium">
                <p>
                  O <strong>Desapego Piauí</strong> nasceu da necessidade de criar um espaço digital seguro, rápido e, acima de tudo, focado na nossa região. 
                  Sabemos que o comércio de proximidade fortalece a economia do nosso estado e gera confiança entre as pessoas.
                </p>
                <p>
                  Somos uma plataforma de classificados projetada para facilitar a vida de quem tem algo para desapegar. Oferecemos publicações gratuitas e também <strong>Planos VIP</strong> (Topo, Turbo e Ouro) para quem deseja vender muito mais rápido em Teresina, Parnaíba, Picos, Floriano e em todos os municípios do Piauí.
                </p>
                <p className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800">
                  <strong className="flex items-center gap-2 mb-1"><Coins size={18}/> Inovação Exclusiva:</strong>
                  Fomos os primeiros a trazer um sistema de <strong>Moedas Virtuais e Gamificação</strong>. Aqui você ganha moedas ao indicar amigos e usar o site, podendo trocar por destaques pagos totalmente de graça!
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/3 bg-green-50 p-8 rounded-3xl border border-green-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
               <MessageCircle size={48} className="text-green-500 mb-4" strokeWidth={2} />
               <h3 className="font-black text-gray-900 text-xl mb-2">Direto no WhatsApp</h3>
               <p className="text-sm text-gray-600 font-medium">Sem chats travando. O comprador clica e fala direto com você no seu número, agilizando a venda.</p>
            </div>
          </div>
        </div>

        {/* MISSÃO, VISÃO E VALORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Target className="text-accent mb-4" size={36} strokeWidth={2} />
            <h3 className="font-black text-gray-900 text-lg mb-3 uppercase tracking-tight">Missão</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Democratizar o acesso à venda online para todos os piauienses, oferecendo uma ferramenta poderosa e acessível para desapegos e negócios.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <ShieldCheck className="text-primary mb-4" size={36} strokeWidth={2} />
            <h3 className="font-black text-gray-900 text-lg mb-3 uppercase tracking-tight">Segurança</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Promover boas práticas de negociação e fornecer orientações rigorosas de segurança para que o contato direto seja feito com inteligência.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Heart className="text-rose-500 mb-4" size={36} strokeWidth={2} />
            <h3 className="font-black text-gray-900 text-lg mb-3 uppercase tracking-tight">Orgulho Local</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Valorizar as cidades do Piauí e seus microempreendedores, criando uma rede de negócios forte que vai do litoral ao sul do estado.
            </p>
          </div>
        </div>

        {/* COMO FUNCIONA (ATUALIZADO PARA 4 PASSOS COM REGRAS NOVAS) */}
        <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-10 md:p-14 rounded-[3rem] shadow-xl relative overflow-hidden mb-8">
          <div className="absolute bottom-0 right-0 opacity-5 translate-x-1/4 translate-y-1/4">
             <CheckCircle2 size={350} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-center tracking-tight">Como usar o site?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
            <div className="text-center group">
              <div className="w-16 h-16 bg-white/10 text-accent rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">1</div>
              <h4 className="font-black text-lg mb-2">Anuncie Grátis</h4>
              <p className="text-primary-100 text-xs md:text-sm font-medium leading-relaxed">Publique grátis por 7 dias. Tire fotos boas, coloque um preço justo e adicione seu WhatsApp.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-white/10 text-accent rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">2</div>
              <h4 className="font-black text-lg mb-2">Destaque VIP</h4>
              <p className="text-primary-100 text-xs md:text-sm font-medium leading-relaxed">Venda rápido resgatando os planos Topo, Turbo ou Ouro (20 dias) com PIX ou usando Moedas.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-white/10 text-accent rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">3</div>
              <h4 className="font-black text-lg mb-2">Fale no WhatsApp</h4>
              <p className="text-primary-100 text-xs md:text-sm font-medium leading-relaxed">Os interessados verão o seu anúncio e enviarão uma mensagem diretamente para o seu celular.</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-white/10 text-accent rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform">4</div>
              <h4 className="font-black text-lg mb-2">Feche Negócio</h4>
              <p className="text-primary-100 text-xs md:text-sm font-medium leading-relaxed">Combine de encontrar a pessoa em um local público e seguro. Receba o PIX e entregue o produto!</p>
            </div>
          </div>
        </div>

        {/* CALL TO ACTION FINAL */}
        <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
          <MapPin className="text-accent mx-auto mb-6" size={48} strokeWidth={2} />
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4 tracking-tight">Pronto para começar?</h2>
          <p className="text-gray-600 font-medium mb-10 max-w-xl mx-auto text-lg">
            Junte-se a milhares de piauienses que já estão comprando e vendendo todos os dias na nossa vitrine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/anunciar" className="bg-primary hover:bg-primary-dark text-white font-black px-10 py-4 rounded-xl transition-transform active:scale-95 shadow-md">
              CRIAR ANÚNCIO AGORA
            </Link>
            <Link href="/todos-anuncios" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-black px-10 py-4 rounded-xl transition-transform active:scale-95">
              EXPLORAR PRODUTOS
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}