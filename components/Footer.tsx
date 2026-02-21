import Link from 'next/link'
import { Instagram, MapPin, Mail, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Coluna 1: Marca */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Desapego <span className="text-primary-light">Piauí</span></h2>
            <p className="text-sm leading-relaxed mb-6">
              A melhor plataforma para conectar quem quer vender com quem quer comprar no Piauí. Simples, rápido e local.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/desapegopiaui" className="bg-gray-800 p-2 rounded-full hover:bg-primary transition text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links */}
          <div>
            <h3 className="text-white font-bold mb-4 border-l-4 border-primary pl-3">Navegação</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary transition">Início</Link></li>
              <li><Link href="/#recent-ads" className="hover:text-primary transition">Anúncios</Link></li>
              <li><Link href="/planos" className="hover:text-primary transition">Planos e Preços</Link></li>
              <li><Link href="/login" className="hover:text-primary transition">Entrar / Cadastrar</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Suporte */}
          <div>
            <h3 className="text-white font-bold mb-4 border-l-4 border-primary pl-3">Ajuda</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-white transition">Dicas de Segurança</Link></li>
              <li><Link href="#" className="hover:text-white transition">Termos de Uso</Link></li>
              <li><Link href="#" className="hover:text-white transition">Privacidade</Link></li>
              <li><Link href="#" className="hover:text-white transition">Fale Conosco</Link></li>
            </ul>
          </div>

          {/* Coluna 4: Contato */}
          <div>
            <h3 className="text-white font-bold mb-4 border-l-4 border-primary pl-3">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-primary mt-1 shrink-0" size={16} />
                <span>Teresina, Piauí, Brasil</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary shrink-0" size={16} />
                <a href="tel:5586988527230" className="hover:text-white">(86) 98852-7230</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary shrink-0" size={16} />
                <a href="mailto:contato@desapegopiaui.com.br" className="hover:text-white">contato@desapegopiaui.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2026 Desapego Piauí. Todos os direitos reservados.</p>
          <p className="mt-2 text-xs">Desenvolvido com Next.js</p>
        </div>
      </div>
    </footer>
  )
}