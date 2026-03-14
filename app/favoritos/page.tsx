'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { Heart, MapPin, ShoppingBag, Loader2, ArrowLeft } from 'lucide-react'

export default function FavoritosPage() {
  const router = useRouter()
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const favoritosIds = userDoc.data().favoritos || []
          
          if (favoritosIds.length === 0) {
            setAds([])
            setLoading(false)
            return
          }

          // Busca cada anúncio favoritado
          const promessasAnuncios = favoritosIds.map((id: string) => getDoc(doc(db, 'anuncios', id)))
          const snapshots = await Promise.all(promessasAnuncios)
          
          const listaFavoritos: any[] = []
          snapshots.forEach(snap => {
            if (snap.exists()) {
              listaFavoritos.push({ id: snap.id, ...snap.data() })
            }
          })
          
          setAds(listaFavoritos)
        }
      } catch (error) {
        console.error("Erro ao buscar favoritos:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 pb-28 md:pb-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm text-gray-600 hover:text-primary transition">
            <ArrowLeft size={24} />
          </button>
          <div className="bg-red-50 text-red-500 p-3 rounded-xl">
             <Heart size={28} className="fill-red-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Meus Favoritos</h1>
        </div>

        {ads.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center shadow-sm border border-gray-100 flex flex-col items-center">
             <Heart size={64} className="text-gray-200 mb-4" />
             <h2 className="text-2xl font-black text-gray-800 mb-2">Nenhum favorito ainda</h2>
             <p className="text-gray-500 text-lg font-medium mb-6">Navegue pelos anúncios e clique no coração para guardar os itens que mais gostou.</p>
             <Link href="/todos-anuncios" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition shadow-md">
               Explorar Anúncios
             </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {ads.map((ad) => (
              <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group bg-white rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col shadow-sm relative">
                
                {ad.status !== 'ativo' && (
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black uppercase px-2 py-1 rounded z-10">
                    Indisponível
                  </div>
                )}

                <div className={`aspect-square bg-gray-50 overflow-hidden relative border-b border-gray-50 ${ad.status !== 'ativo' ? 'opacity-50 grayscale' : ''}`}>
                   {ad.imagemUrl ? (
                      <img src={ad.imagemUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32}/></div>
                   )}
                </div>
                
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <h3 className="text-xs md:text-sm text-gray-700 line-clamp-2 mb-1.5 md:mb-2 font-bold group-hover:text-primary transition-colors">{ad.titulo}</h3>
                  <div className="mt-auto pt-2 border-t border-gray-50">
                    <p className="text-lg md:text-xl font-black text-primary mb-1">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                    </p>
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