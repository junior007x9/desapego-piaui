'use client'
import React from 'react'
import { Target, Users, ShieldCheck, Zap, Heart, MapPin, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SobrePage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="bg-primary pt-16 pb-24 px-4 rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
            Sobre o <span className="text-accent underline decoration-4 underline-offset-4">Desapego Piauí</span>
          </h1>
          <p className="text-primary-100 font-medium text-lg max-w-2xl mx-auto">
            Conectando quem quer vender com quem quer comprar em todo o estado do Piauí.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 relative z-20">
        {/* SEÇÃO QUEM SOMOS */}
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Users className="text-primary" /> Quem Somos
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed font-medium">
                <p>
                  O <strong>Desapego Piauí</strong> nasceu da necessidade de criar um espaço digital seguro, rápido e, acima de tudo, local para os piauienses. 
                  Sabemos que o comércio de proximidade fortalece a economia do nosso estado e gera confiança entre as pessoas.
                </p>
                <p>
                  Somos uma plataforma de classificados modernos, projetada para facilitar a vida de quem tem algo para desapegar e de quem busca oportunidades 
                  com o melhor custo-benefício em Teresina, Parnaíba, Picos, Floriano e em todos os municípios do nosso Piauí.
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/3 bg-primary/5 p-8 rounded-3xl border border-primary/10 flex flex-col items-center text-center">
               <Zap size={48} className="text-accent mb-4" />
               <h3 className="font-black text-primary text-xl mb-2">Rápido e Direto</h3>
               <p className="text-sm text-gray-500 font-bold">Sem intermediários. Você fala direto com o vendedor via WhatsApp.</p>
            </div>
          </div>
        </div>

        {/* MISSÃO, VISÃO E VALORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <Target className="text-accent mb-4" size={32} />
            <h3 className="font-black text-gray-900 text-lg mb-3 uppercase">Missão</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Democratizar o acesso à venda online para todos os piauienses, oferecendo uma ferramenta gratuita e poderosa para desapegos e negócios.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <ShieldCheck className="text-accent mb-4" size={32} />
            <h3 className="font-black text-gray-900 text-lg mb-3 uppercase">Segurança</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Promover boas práticas de negociação e fornecer orientações de segurança para que cada transação seja feita com tranquilidade e transparência.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
            <Heart className="text-accent mb-4" size={32} />
            <h3 className="font-black text-gray-900 text-lg mb-3 uppercase">Orgulho Local</h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Valorizar as cidades do Piauí e seus microempreendedores, criando uma rede de conexão que vai do litoral ao sul do estado.
            </p>
          </div>
        </div>

        {/* COMO FUNCIONA */}
        <div className="bg-primary text-white p-10 md:p-16 rounded-[3rem] shadow-xl relative overflow-hidden mb-8">
          <div className="absolute bottom-0 right-0 opacity-10 translate-x-1/4 translate-y-1/4">
             <CheckCircle2 size={300} />
          </div>
          <h2 className="text-3xl font-black mb-10 text-center uppercase tracking-tighter italic">Como o Desapego Piauí funciona?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg">1</div>
              <h4 className="font-bold text-xl mb-2">Anuncie</h4>
              <p className="text-primary-100 text-sm">Tire fotos, coloque o preço e descreva seu produto em poucos segundos.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg">2</div>
              <h4 className="font-bold text-xl mb-2">Negocie</h4>
              <p className="text-primary-100 text-sm">Receba contatos diretamente no seu WhatsApp de pessoas interessadas.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 shadow-lg">3</div>
              <h4 className="font-bold text-xl mb-2">Venda</h4>
              <p className="text-primary-100 text-sm">Combine a entrega em um local público e seguro e conclua seu negócio!</p>
            </div>
          </div>
        </div>

        {/* CALL TO ACTION FINAL */}
        <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 text-center">
          <MapPin className="text-accent mx-auto mb-4" size={40} />
          <h2 className="text-2xl font-black text-gray-900 mb-4">Pronto para começar?</h2>
          <p className="text-gray-600 font-medium mb-8 max-w-xl mx-auto">
            Junte-se a milhares de piauienses que já estão comprando e vendendo todos os dias na nossa plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/anunciar" className="bg-primary hover:bg-primary-dark text-white font-black px-10 py-4 rounded-2xl transition-all shadow-md">
              ANUNCIAR AGORA
            </Link>
            <Link href="/todos-anuncios" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-black px-10 py-4 rounded-2xl transition-all">
              VER PRODUTOS
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}