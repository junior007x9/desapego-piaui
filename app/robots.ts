import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/perfil', 
        '/meus-anuncios', 
        '/pagamento', 
        '/chat', 
        '/admin',
        '/editar-anuncio'
      ],
    },
    sitemap: 'https://desapegopiaui.com.br/sitemap.xml',
  }
}