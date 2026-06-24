import { MetadataRoute } from 'next'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase' // Verifique se o caminho do seu firebase está correto aqui

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.desapegopiaui.com.br'

  // Suas páginas fixas
  const rotasEstaticas = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/todos-anuncios`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/tutorial`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ] as MetadataRoute.Sitemap

  try {
    // Busca apenas os anúncios ativos no Firebase para avisar ao Google
    const q = query(collection(db, 'anuncios'), where('status', '==', 'ativo'))
    const adsSnap = await getDocs(q)
    
    const rotasAnuncios = adsSnap.docs.map((document) => {
      const data = document.data()
      return {
        url: `${baseUrl}/anuncio/${document.id}`,
        lastModified: data.criadoEm ? new Date(data.criadoEm.seconds * 1000) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    }) as MetadataRoute.Sitemap

    return [...rotasEstaticas, ...rotasAnuncios]
  } catch (error) {
    console.error("Erro ao gerar sitemap:", error)
    return rotasEstaticas
  }
}