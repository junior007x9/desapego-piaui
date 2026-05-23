import { Metadata } from 'next'

// Tipagem correta para evitar o uso de 'any' e prevenir erros no build (Next.js 13/14/15)
type Props = {
  params: Promise<{ id: string }> | { id: string };
}

// Esta função corre no Servidor antes da página carregar, desenhando o "Cartão" de SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Compatibilidade com Next.js 15 (onde params passou a ser uma Promise)
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId || !id) {
      return { title: 'Anúncio | Desapego Piauí' }
    }

    // Buscamos os dados direto da API do Google (Firestore) para ser ultra-rápido no servidor
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/anuncios/${id}`,
      { cache: 'no-store' }
    );

    if (res.ok) {
      const data = await res.json();
      
      // O Firestore REST API guarda os dados dentro de "fields" e indica o tipo
      const titulo = data.fields?.titulo?.stringValue || 'Anúncio no Desapego Piauí';
      const descricao = data.fields?.descricao?.stringValue || 'Confira este produto excelente no nosso marketplace.';
      
      // EXTRAINDO E FORMATANDO O PREÇO PARA O SEO
      const precoRaw = data.fields?.preco?.doubleValue || data.fields?.preco?.integerValue || 0;
      const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(precoRaw));
      
      // Monta o título matador para o WhatsApp e Google
      const tituloSEO = `${titulo} por ${precoFormatado} | Desapego Piauí`;
      const descSEO = descricao.substring(0, 150) + (descricao.length > 150 ? '...' : '');
      
      // Tenta pegar a imagem principal, a primeira foto da galeria, ou usa a LOGO PADRÃO
      const imagem = data.fields?.imagemUrl?.stringValue || 
                     data.fields?.fotos?.arrayValue?.values?.[0]?.stringValue || 
                     'https://i.imgur.com/vHqB0aA.png'; // Evita que o WhatsApp fique sem foto

      return {
        title: tituloSEO,
        description: descSEO,
        openGraph: {
          title: tituloSEO,
          description: descSEO,
          siteName: 'Desapego Piauí',
          images: [{ url: imagem, width: 800, height: 600, alt: titulo }],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: tituloSEO,
          description: descSEO,
          images: [imagem],
        },
      }
    }
  } catch (error) {
    console.error("Erro ao gerar SEO do Anúncio:", error)
  }

  // Fallback caso o anúncio não exista ou dê erro
  return {
    title: 'Anúncio | Desapego Piauí',
    description: 'Compre e venda de tudo no Piauí de forma rápida e segura.'
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