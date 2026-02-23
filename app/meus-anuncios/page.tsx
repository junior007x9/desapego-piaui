'use client'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, Eye, CheckCircle, Clock, Ban, ShoppingBag } from 'lucide-react'

export default function MeusAnuncios() {
  const router = useRouter()
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)

      const q = query(
        collection(db, 'anuncios'), 
        where('vendedorId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const lista: any[] = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      
      lista.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
      
      setAds(lista)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este anúncio permanentemente?")) return
    try {
      await deleteDoc(doc(db, 'anuncios', id));
      setAds(ads.filter(ad => ad.id !== id));
    } catch (error) {
      alert("Erro ao excluir.");
    }
  }

  const handleToggleSold = async (ad: any) => {
    const novoStatus = ad.status === 'vendido' ? 'ativo' : 'vendido';
    try {
      await updateDoc(doc(db, 'anuncios', ad.id), { status: novoStatus });
      setAds(ads.map(item => item.id === ad.id ? { ...item, status: novoStatus } : item));
    } catch (error) {
      alert("Erro ao atualizar status.");
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      ativo: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ativo', icon: CheckCircle },
      pagamento_pendente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Aguardando Pagamento', icon: Clock },
      vendido: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Vendido', icon: ShoppingBag },
    }
    const current = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-500', label: status, icon: Ban }
    const Icon = current.icon

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${current.bg} ${current.text}`}>
        <Icon size={12} /> {current.label}
      </span>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meus Anúncios</h1>
          <Link href="/anunciar" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-bold text-sm shadow-sm">
            + Novo Anúncio
          </Link>
        </div>

        {loading ? (
           <p className="text-center text-purple-500 font-bold animate-pulse">Carregando seus desapegos...</p>
        ) : ads.length === 0 ? (
           <div className="bg-white p-10 rounded-2xl text-center shadow-sm border border-gray-100">
             <ShoppingBag size={48} className="mx-auto text-purple-300 mb-4" />
             <h3 className="text-xl font-bold text-gray-800">Você ainda não anunciou nada!</h3>
             <p className="text-gray-500 mb-6 mt-2">Que tal desapegar daquela coisa parada em casa?</p>
             <Link href="/anunciar" className="text-purple-600 font-bold hover:underline bg-purple-50 px-6 py-2 rounded-full">Começar agora</Link>
           </div>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center border border-gray-100">
                <div className="w-full md:w-32 h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                   {ad.imagemUrl ? (
                     <img src={ad.imagemUrl} alt={ad.titulo} className="w-full h-full object-cover" />
                   ) : (
                     <div className="flex items-center justify-center h-full text-gray-300"><ShoppingBag /></div>
                   )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <h2 className="font-bold text-lg text-gray-800">{ad.titulo}</h2>
                    <StatusBadge status={ad.status} />
                  </div>
                  <p className="text-2xl font-extrabold text-purple-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco)}
                  </p>
                  
                  {/* NOVO: CONTADOR DE VIEWS AQUI */}
                  <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-gray-500 font-medium">
                    <Eye size={16} className="text-purple-400" />
                    {ad.visualizacoes || 0} pessoas viram este anúncio
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                  {ad.status === 'pagamento_pendente' && (
                    <Link href={`/pagamento/${ad.id}`} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-4 py-2 rounded-xl font-bold text-sm text-center transition">
                      Pagar PIX
                    </Link>
                  )}

                  {ad.status === 'ativo' && (
                    <Link href={`/anuncio/${ad.id}`} className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition">
                      <Eye size={16} /> Ver no Site
                    </Link>
                  )}

                  {(ad.status === 'ativo' || ad.status === 'vendido') && (
                    <button onClick={() => handleToggleSold(ad)} className={`flex-1 px-4 py-2 rounded-xl font-bold text-sm border transition ${ad.status === 'vendido' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      {ad.status === 'vendido' ? 'Reativar Venda' : 'Marcar Vendido'}
                    </button>
                  )}

                  <Link href={`/editar-anuncio/${ad.id}`} className="bg-white border border-blue-200 text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition flex justify-center items-center" title="Editar Anúncio">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </Link>

                  <button onClick={() => handleDelete(ad.id)} className="bg-white border border-red-200 text-red-500 hover:bg-red-50 p-2 rounded-xl transition flex justify-center items-center" title="Excluir Permanente">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}