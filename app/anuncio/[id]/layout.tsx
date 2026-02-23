import { Metadata } from 'next'

// Esta função gera os metadados dinâmicos para SEO (WhatsApp, Google, etc)
export async function generateMetadata({ params }: any): Promise<Metadata> {
  try {
    // CORREÇÃO: Aguarda a resolução dos parâmetros dinâmicos
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId || !id) {
      return { title: 'Anúncio | DesapegoPI' }
    }

    // Busca os dados diretamente via REST API do Firestore para performance no servidor
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/anuncios/${id}`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const data = await res.json();
      
      // Extração dos campos do formato JSON do Firestore REST API
      const titulo = data.fields?.titulo?.stringValue || 'Anúncio no DesapegoPI';
      const descricao = data.fields?.descricao?.stringValue || 'Confira este produto no DesapegoPI.';
      const imagem = data.fields?.imagemUrl?.stringValue || 
                     data.fields?.fotos?.arrayValue?.values?.[0]?.stringValue || 
                     '';

      return {
        title: `${titulo} | DesapegoPI`,
        description: descricao.substring(0, 160),
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
    console.error("Erro ao gerar metadados:", error)
  }

  return {
    title: 'Anúncio | DesapegoPI',
  }
}

export default function AnuncioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}