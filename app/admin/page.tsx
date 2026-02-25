'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { DollarSign, Users, ShoppingBag, Ban, CheckCircle, Trash2, Loader2 } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Num projeto real, verificaria aqui se o user.email é o seu email de administrador
      if (!user) {
        router.push('/login')
      } else {
        fetchDados()
      }
    })
    return () => unsubscribe()
  }, [router])

  async function fetchDados() {
    try {
      // Puxa todos os anúncios do Firebase
      const snapshot = await getDocs(collection(db, 'anuncios'))
      const lista: any[] = []
      snapshot.forEach(doc => lista.push({ id: doc.id, ...doc.data() }))
      
      // Ordena pelos mais recentes
      lista.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setAds(lista)
    } catch (error) {
      console.error("Erro ao buscar dados admin", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja excluir este anúncio permanentemente?")) return
    try {
      await deleteDoc(doc(db, 'anuncios', id))
      setAds(ads.filter(ad => ad.id !== id))
    } catch (error) {
      alert("Erro ao excluir anúncio.")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Painel Administrativo</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-xl text-purple-600">
              <ShoppingBag size={24}/>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total de Anúncios</p>
              <p className="text-2xl font-bold text-gray-800">{ads.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Gestão Global de Anúncios</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">Título do Anúncio</th>
                  <th className="p-4 font-medium">Preço</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-800 line-clamp-1">{ad.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{ad.categoria}</p>
                    </td>
                    <td className="p-4 font-black text-purple-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco || 0)}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full font-bold ${
                        ad.status === 'ativo' ? 'bg-green-100 text-green-700' : 
                        ad.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 
                        ad.status === 'vendido' ? 'bg-gray-200 text-gray-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {ad.status === 'pendente' ? 'Aguardando Pag.' : ad.status || 'erro'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDelete(ad.id)} 
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition" 
                        title="Excluir Anúncio"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ads.length === 0 && (
              <div className="p-10 text-center text-gray-500 font-medium">
                Nenhum anúncio encontrado no sistema da plataforma.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}