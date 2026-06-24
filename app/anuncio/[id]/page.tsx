import { Metadata, ResolvingMetadata } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import DetalhesClient from './DetalhesClient'

// Note que este arquivo NÃO possui a tag 'use client'
// Isso transforma ele em um Server Component (Invisível pro cliente, mas que o Google ama)

type Props = {
  params: { id: string }
}

// 🚀 A MÁGICA ACONTECE AQUI: Geração de SEO Dinâmico
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const id = params.id
    const adDocRef = doc(db, 'anuncios', id)
    const adSnapshot = await getDoc(adDocRef)

    if (!adSnapshot.exists()) {
      return {
        title: 'Anúncio não encontrado - Desapego Piauí',
      }
    }

    const adData = adSnapshot.data()
    const titulo = adData.titulo || 'Anúncio'
    // Pega as primeiras 160 letras da descrição para o Google ler
    const descricao = adData.descricao ? adData.descricao.substring(0, 160) + '...' : `Confira os detalhes de ${titulo} no Desapego Piauí. Compre e venda de forma segura.`

    return {
      title: `${titulo} | Desapego Piauí`,
      description: descricao,
      keywords: [adData.categoria, adData.cidade, 'Desapego Piauí', 'Classificados', 'Comprar', 'Vender', titulo.split(' ').slice(0, 3).join(', ')].filter(Boolean),
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

// O Servidor simplesmente renderiza a tela que criamos no Passo 1 passando o ID
export default function AnuncioPage({ params }: Props) {
  return <DetalhesClient id={params.id} />
}