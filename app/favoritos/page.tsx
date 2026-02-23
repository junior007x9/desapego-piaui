'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, MapPin, ShoppingBag } from 'lucide-react'

export default function FavoritosPage() {
  const router = useRouter()
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }

      try {
        // 1. Busca os IDs favoritos do utilizador
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (!userDoc.exists()) {
          setLoading(false)
          return
        }

        const favoritosIds: string[] = userDoc.data().favoritos || []

        if (favoritosIds.length === 0) {
          setAds([])
          setLoading(false)
          return
        }

        // 2. Busca os dados completos de cada anúncio favorito
        const promessasDeAnuncios = favoritosIds.map(id => getDoc(doc(db, 'anuncios', id)))
        const docsSnapshots = await Promise.all(promessasDeAnuncios)
        
        const listaFavoritos: any[] = []
        docsSnapshots.forEach(snap => {
          if (snap.exists() && snap.data().status === 'ativo') {
            listaFavoritos.push({ id: snap.id, ...snap.data() })
          }
        })

        setAds(listaFavoritos)
      } catch (error) {
        console.error("Erro ao buscar favoritos:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="text-red-500 fill-red-500" size={32} />
          <h1 className="text-3xl font-bold text-gray-900">Meus Favoritos</h1>
        </div>

        {loading ? (
           <p className="text-center text-red-500 font-bold animate-pulse">Carregando seus favoritos...</p>
        ) : ads.length === 0 ? (
           <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-gray-100 max-w-2xl mx-auto">
             <Heart size={48} className="mx-auto text-gray-300 mb-4" />
             <h3 className="text-xl font-bold text-gray-800">Você ainda não tem favoritos</h3>
             <p className="text-gray-500 mt-2 mb-6">Navegue pelos anúncios e clique no coração para guardar os produtos que mais gostou.</p>
             <Link href="/todos-anuncios" className="bg-red-50 text-red-600 font-bold hover:bg-red-100 px-6 py-3 rounded-full transition">Explorar Anúncios</Link>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ads.map((ad) => (
              <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group">
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col relative">
                  
                  <div className="h-52 overflow-hidden bg-gray-100 relative">
                     {ad.imagemUrl ? (
                        <img src={ad.imagemUrl} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={40}/></div>
                     )}
                     
                     {/* Coração vermelho sempre visível no card dos favoritos */}
                     <div className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md">
                        <Heart className="text-red-500 fill-red-500" size={18} />
                     </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-gray-800 font-medium line-clamp-2 mb-2 group-hover:text-red-500 transition leading-tight">
                      {ad.titulo}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <p className="text-xl font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                         <MapPin size={12} /> Teresina, PI
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}