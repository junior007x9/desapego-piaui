import Link from 'next/link'
import { Instagram, MapPin, Mail, Phone, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-28 md:pb-12 border-t-4 border-primary">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Coluna 1: Marca */}
          <div>
            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Desapego <span className="text-accent">Piauí</span></h2>
            <p className="text-sm leading-relaxed mb-6 font-medium text-gray-400">
              A melhor plataforma para conectar quem quer vender com quem quer comprar no Piauí. Simples, rápido e local.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/desapegopiaui" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2.5 rounded-full hover:bg-accent hover:text-white transition-all transform hover:scale-110 shadow-sm text-gray-300">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links */}
          <div>
            <h3 className="text-white font-black mb-5 border-l-4 border-accent pl-3 uppercase tracking-wider text-sm">Navegação</h3>
            <ul className="space-y-3 text-sm font-medium text-gray-400">
              <li><Link href="/" className="hover:text-accent transition-colors flex items-center gap-2">- Início</Link></li>
              <li><Link href="/sobre" className="hover:text-accent transition-colors flex items-center gap-2">- Sobre Nós</Link></li>
              <li><Link href="/todos-anuncios" className="hover:text-accent transition-colors flex items-center gap-2">- Explorar Anúncios</Link></li>
              {/* 🚀 LINK DO BLOG PARA O GOOGLE ADSENSE LER */}
              <li><Link href="/blog" className="hover:text-accent transition-colors flex items-center gap-2 font-bold text-gray-300">- Blog e Dicas</Link></li>
              <li><Link href="/login" className="hover:text-accent transition-colors flex items-center gap-2">- Entrar / Cadastrar</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Suporte (Links Jurídicos OBRIGATÓRIOS para o Google) */}
          <div>
            <h3 className="text-white font-black mb-5 border-l-4 border-accent pl-3 uppercase tracking-wider text-sm">Ajuda e Legal</h3>
            <ul className="space-y-3 text-sm font-medium text-gray-400">
              <li><Link href="/seguranca" className="hover:text-white transition-colors flex items-center gap-2">- Dicas de Segurança</Link></li>
              <li><Link href="/termos" className="hover:text-white transition-colors flex items-center gap-2">- Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-white transition-colors flex items-center gap-2">- Política de Privacidade</Link></li>
              <li><Link href="/contato" className="hover:text-white transition-colors flex items-center gap-2">- Fale Conosco</Link></li>
            </ul>
          </div>

          {/* Coluna 4: Contato */}
          <div>
            <h3 className="text-white font-black mb-5 border-l-4 border-accent pl-3 uppercase tracking-wider text-sm">Contato</h3>
            <ul className="space-y-4 text-sm font-medium text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="text-accent mt-0.5 shrink-0" size={18} />
                <span>Teresina, Piauí, Brasil</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-accent shrink-0" size={18} />
                <a href="https://wa.me/5586988527230" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">(86) 98852-7230</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-accent shrink-0" size={18} />
                <a href="mailto:contato@desapegopiaui.com.br" className="hover:text-white transition-colors">contato@desapegopiaui.com.br</a>
              </li>
            </ul>
          </div>
        </div>

        {/* NOVA ÁREA DE CRÉDITOS */}
        <div className="border-t border-gray-800 pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
          <p>&copy; {new Date().getFullYear()} Desapego Piauí. Todos os direitos reservados.</p>
          
          <p className="flex items-center gap-1 justify-center">
            Feito com <Heart size={14} className="text-accent fill-accent" /> por{' '}
            <a 
              href="https://aarti-studio-ten.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white font-bold hover:text-accent transition-colors ml-1"
            >
              AARTI ESTUDIO
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}