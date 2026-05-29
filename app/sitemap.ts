import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://desapegopiaui.com.br'

  // Rotas fixas e vitais do seu site
  const rotasEstaticas: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/todos-anuncios`, lastModified: new Date(), changeFrequency: 'always', priority: 0.9 },
    { url: `${baseUrl}/anunciar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/termos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacidade`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/seguranca`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ]

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return rotasEstaticas;

    // Vai buscar os últimos 1000 anúncios diretamente à API do Google (muito rápido e não trava o build da Vercel)
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/anuncios?pageSize=1000`, { cache: 'no-store' });
    
    if (res.ok) {
      const data = await res.json();
      if (data.documents) {
        const rotasDinamicas = data.documents.map((doc: any) => {
          // Extrai o ID do anúncio a partir da resposta do Firebase
          const id = doc.name.split('/').pop();
          return {
            url: `${baseUrl}/anuncio/${id}`,
            lastModified: new Date(doc.updateTime || doc.createTime),
            changeFrequency: 'daily',
            priority: 0.7,
          };
        });
        // Junta as páginas fixas com a lista de todos os anúncios gerados
        return [...rotasEstaticas, ...rotasDinamicas];
      }
    }
  } catch (error) {
    console.error("Erro ao gerar sitemap dinâmico:", error);
  }

  return rotasEstaticas;
}