'use client'
import Link from 'next/link'
import { ArrowLeft, Shield, AlertCircle, Eye, MessageCircle, MapPin } from 'lucide-react'

export default function SegurancaPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 pb-24 md:pb-10">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Dicas de Segurança</h1>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <Shield size={56} className="mx-auto mb-4 relative z-10" />
            <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">Compre e venda com tranquilidade</h2>
            <p className="opacity-90 relative z-10 font-medium">O Desapego Piauí aproxima pessoas, mas a segurança depende de boas práticas.</p>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            
            {/* Dica 1 */}
            <div className="flex gap-4 items-start">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-2xl shrink-0">
                <AlertCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Nunca pague antecipado</h3>
                <p className="text-gray-600 leading-relaxed">
                  Não faça depósitos, transferências ou PIX antes de ter o produto em mãos e verificar se está tudo a funcionar corretamente. Desconfie de vendedores que exigem "sinal" para reservar o produto.
                </p>
              </div>
            </div>

            {/* Dica 2 */}
            <div className="flex gap-4 items-start">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl shrink-0">
                <MapPin size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Marque encontros em locais públicos</h3>
                <p className="text-gray-600 leading-relaxed">
                  Para entregar ou ver um produto, escolha sempre locais movimentados durante o dia, como shoppings, estações de metro ou praças de alimentação. Se possível, vá acompanhado.
                </p>
              </div>
            </div>

            {/* Dica 3 */}
            <div className="flex gap-4 items-start">
              <div className="bg-purple-100 text-primary p-3 rounded-2xl shrink-0">
                <MessageCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Use o Chat do site</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mantenha a negociação no nosso chat interno o máximo de tempo possível. Evite passar dados pessoais, e-mail ou redes sociais nos primeiros contactos.
                </p>
              </div>
            </div>

            {/* Dica 4 */}
            <div className="flex gap-4 items-start">
              <div className="bg-green-100 text-green-600 p-3 rounded-2xl shrink-0">
                <Eye size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Desconfie de preços muito baixos</h3>
                <p className="text-gray-600 leading-relaxed">
                  Se um produto caro (como um iPhone ou um carro) estiver com um preço absurdamente baixo, redobre a atenção. Pode ser uma tentativa de golpe ou um produto com defeito oculto.
                </p>
              </div>
            </div>

          </div>
          
          <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
             <p className="text-sm text-gray-500 font-medium">Violação de regras? Denuncie anúncios suspeitos no botão de contacto.</p>
          </div>
        </div>

      </div>
    </div>
  )
}