import { Metadata, ResolvingMetadata } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import DetalhesClient from './DetalhesClient'

// A atualização do Next.js exige que params seja uma Promise
type Props = {
  params: Promise<{ id: string }>
}

// 🚀 A MÁGICA DO SEO ACONTECE AQUI
export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    // Agora o servidor "espera" o ID da URL carregar corretamente
    const params = await props.params;
    const id = params.id;
    
    const adDocRef = doc(db, 'anuncios', id)
    const adSnapshot = await getDoc(adDocRef)

    if (!adSnapshot.exists()) {
      return {
        title: 'Anúncio não encontrado - Desapego Piauí',
      }
    }

    const adData = adSnapshot.data()
    const titulo = adData.titulo || 'Anúncio'
    const descricao = adData.descricao ? adData.descricao.substring(0, 160) + '...' : `Confira os detalhes de ${titulo} no Desapego Piauí. Compre e venda de forma segura.`

    return {
      title: `${titulo} | Desapego Piauí`,
      description: descricao,
      keywords: [adData.categoria, adData.cidade, 'Desapego Piauí', 'Classificados', 'Comprar', 'Vender'].filter(Boolean),
      openGraph: {
        title: `${titulo} | Desapego Piauí`,
        description: descricao,
        images: adData.fotos && adData.fotos.length > 0 ? [{ url: adData.fotos[0] }] : [],
        type: 'website',
        locale: 'pt_BR',
        siteName: 'Desapego Piauí',
      },
    }
  } catch (error) {
    return {
      title: 'Anúncio | Desapego Piauí',
      description: 'O maior portal de classificados do Piauí.',
    }
  }
}

// 🚀 AQUI ELE REPASSA O ID PARA A TELA DO USUÁRIO
export default async function AnuncioPage(props: Props) {
  // Esperamos o ID carregar antes de chamar o Cliente
  const params = await props.params;
  
  return <DetalhesClient id={params.id} />
}