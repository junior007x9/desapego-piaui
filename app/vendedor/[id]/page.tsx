'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import Link from 'next/link'
import { MapPin, ShoppingBag, User, ArrowLeft } from 'lucide-react'

export default function VendedorPage() {
  const params = useParams()
  const router = useRouter()
  const [vendedor, setVendedor] = useState<any>(null)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVendedorEAnuncios() {
      if (!params.id) return

      try {
        // 1. Busca os dados do vendedor
        const vendedorDoc = await getDoc(doc(db, 'users', params.id as string))
        if (vendedorDoc.exists()) {
          setVendedor(vendedorDoc.data())
        }

        // 2. Busca apenas os anúncios ATIVOS deste vendedor
        const q = query(
          collection(db, 'anuncios'), 
          where('vendedorId', '==', params.id),
          where('status', '==', 'ativo')
        )
        const snapshot = await getDocs(q)
        
        const listaAnuncios: any[] = []
        snapshot.forEach(doc => {
          listaAnuncios.push({ id: doc.id, ...doc.data() })
        })
        
        // Ordena os mais recentes primeiro
        listaAnuncios.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
        setAds(listaAnuncios)

      } catch (error) {
        console.error("Erro ao carregar dados do vendedor:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendedorEAnuncios()
  }, [params.id])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600 font-bold animate-pulse">Carregando perfil...</div>

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Cabeçalho do Vendedor */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-purple-600"></div>
          
          <button onClick={() => router.back()} className="absolute top-4 left-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition z-10">
            <ArrowLeft size={20} />
          </button>

          <div className="relative z-10 pt-12 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <div className="w-24 h-24 bg-white border-4 border-white rounded-full flex items-center justify-center text-purple-600 font-bold text-4xl shadow-md shrink-0">
              {vendedor?.nome ? vendedor.nome.charAt(0).toUpperCase() : <User size={40} />}
            </div>
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{vendedor?.nome || 'Usuário DesapegoPI'}</h1>
              <p className="text-gray-500 mt-1">No DesapegoPI desde 2024</p>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShoppingBag className="text-purple-600" /> 
          {ads.length} {ads.length === 1 ? 'Anúncio Ativo' : 'Anúncios Ativos'}
        </h2>

        {/* Lista de Anúncios */}
        {ads.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-gray-100">
             <p className="text-gray-500 text-lg">Este vendedor não tem anúncios ativos no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Link href={`/anuncio/${ad.id}`} key={ad.id} className="group">
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col">
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                     {ad.imagemUrl ? (
                        <img src={ad.imagemUrl} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={40}/></div>
                     )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit mb-2">
                      {ad.categoria}
                    </span>
                    <h3 className="text-gray-800 font-medium line-clamp-2 mb-2 group-hover:text-purple-600 transition leading-tight">
                      {ad.titulo}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <p className="text-xl font-bold text-purple-600">
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