import { Metadata } from 'next'

// Esta função corre no Servidor antes da página carregar, desenhando o "Cartão" de SEO
export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    // CORREÇÃO AQUI: Agora o Next.js exige o 'await' antes de ler o params
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId || !id) {
      return { title: 'Anúncio | DesapegoPI' }
    }

    // Buscamos os dados direto da API do Google (Firestore) para ser ultra-rápido no servidor
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/anuncios/${id}`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const data = await res.json();
      
      // O Firestore REST API guarda os dados dentro de "fields" e indica o tipo ("stringValue", etc.)
      const titulo = data.fields?.titulo?.stringValue || 'Anúncio no DesapegoPI';
      const descricao = data.fields?.descricao?.stringValue || 'Confira este produto excelente no nosso marketplace.';
      
      // Tenta pegar a imagem principal ou a primeira foto da galeria
      const imagem = data.fields?.imagemUrl?.stringValue || 
                     data.fields?.fotos?.arrayValue?.values?.[0]?.stringValue || 
                     '';

      return {
        title: `${titulo} | DesapegoPI`,
        description: descricao.substring(0, 160) + '...', // Limita o texto para não quebrar o cartão
        openGraph: {
          title: titulo,
          description: descricao.substring(0, 160),
          siteName: 'DesapegoPI',
          images: imagem ? [{ url: imagem, width: 800, height: 600 }] : [],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: titulo,
          description: descricao.substring(0, 160),
          images: imagem ? [imagem] : [],
        },
      }
    }
  } catch (error) {
    console.error("Erro ao gerar SEO do Anúncio:", error)
  }

  // Fallback caso o anúncio não exista ou dê erro
  return {
    title: 'Anúncio | DesapegoPI',
    description: 'Compre e venda de tudo no Piauí.'
  }
}

// O Layout apenas "abraça" a sua página original sem alterar o design dela
export default function AnuncioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}