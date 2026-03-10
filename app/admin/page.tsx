'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { DollarSign, Users, ShoppingBag, Ban, CheckCircle, Trash2, Loader2, Flag, AlertTriangle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const [ads, setAds] = useState<any[]>([])
  const [denuncias, setDenuncias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // 🔒 Num projeto real, coloque aqui a verificação do seu e-mail de administrador
      // ex: if (user?.email !== 'seu@email.com') router.push('/')
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
      // 1. Puxa todos os anúncios do Firebase
      const snapshotAds = await getDocs(collection(db, 'anuncios'))
      const listaAds: any[] = []
      snapshotAds.forEach(doc => listaAds.push({ id: doc.id, ...doc.data() }))
      listaAds.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setAds(listaAds)

      // 2. Puxa todas as denúncias pendentes
      const snapshotDenuncias = await getDocs(collection(db, 'denuncias'))
      const listaDenuncias: any[] = []
      snapshotDenuncias.forEach(doc => {
        const data = doc.data()
        if (data.status === 'pendente') {
          listaDenuncias.push({ id: doc.id, ...data })
        }
      })
      listaDenuncias.sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
      setDenuncias(listaDenuncias)

    } catch (error) {
      console.error("Erro ao buscar dados admin", error)
    } finally {
      setLoading(false)
    }
  }

  // AÇÃO 1: Excluir um anúncio normal da plataforma
  const handleDeleteAd = async (id: string) => {
    if (!confirm("Tem a certeza que deseja excluir este anúncio permanentemente?")) return
    try {
      await deleteDoc(doc(db, 'anuncios', id))
      setAds(ads.filter(ad => ad.id !== id))
      alert("Anúncio excluído com sucesso.")
    } catch (error) {
      alert("Erro ao excluir anúncio.")
    }
  }

  // AÇÃO 2: Excluir o anúncio denunciado E resolver a denúncia
  const handleAprovarDenuncia = async (anuncioId: string, denunciaId: string) => {
    if (!confirm("🚨 ATENÇÃO: Isso vai APAGAR O ANÚNCIO da plataforma e marcar a denúncia como resolvida. Confirmar exclusão?")) return
    try {
      // Apaga o anúncio
      await deleteDoc(doc(db, 'anuncios', anuncioId))
      
      // Marca a denúncia como resolvida
      await updateDoc(doc(db, 'denuncias', denunciaId), { status: 'resolvido' })
      
      // Atualiza a tela
      setAds(ads.filter(ad => ad.id !== anuncioId))
      setDenuncias(denuncias.filter(d => d.id !== denunciaId))
      alert("Golpe evitado! Anúncio apagado e denúncia resolvida.")
    } catch (error) {
      alert("Erro ao processar a denúncia.")
    }
  }

  // AÇÃO 3: Ignorar denúncia falsa
  const handleIgnorarDenuncia = async (denunciaId: string) => {
    if (!confirm("Deseja ignorar esta denúncia? O anúncio CONTINUARÁ no ar.")) return
    try {
      await updateDoc(doc(db, 'denuncias', denunciaId), { status: 'ignorado' })
      setDenuncias(denuncias.filter(d => d.id !== denunciaId))
    } catch (error) {
      alert("Erro ao ignorar denúncia.")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Painel Administrativo</h1>
        
        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-xl text-primary">
              <ShoppingBag size={28}/>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total de Anúncios</p>
              <p className="text-3xl font-black text-gray-800">{ads.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
            <div className={`p-4 rounded-xl ${denuncias.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-red-50 text-red-500'}`}>
              <Flag size={28}/>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Denúncias Pendentes</p>
              <p className={`text-3xl font-black ${denuncias.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{denuncias.length}</p>
            </div>
          </div>
        </div>

        {/* MÓDULO 1: CENTRAL DE DENÚNCIAS */}
        {denuncias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 overflow-hidden mb-10">
            <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={24} />
              <h2 className="text-xl font-black text-red-700">Ação Necessária: Denúncias da Comunidade</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="p-4 font-bold">Motivo da Denúncia</th>
                    <th className="p-4 font-bold">Anúncio Denunciado</th>
                    <th className="p-4 font-bold">Data</th>
                    <th className="p-4 font-bold text-center">Decisão do Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {denuncias.map(denuncia => (
                    <tr key={denuncia.id} className="hover:bg-red-50/50 transition-colors">
                      <td className="p-4">
                        <span className="bg-red-100 text-red-700 font-bold text-xs px-3 py-1.5 rounded-lg">
                          {denuncia.motivo}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800 line-clamp-1">{denuncia.anuncioTitulo}</p>
                        <Link href={`/anuncio/${denuncia.anuncioId}`} target="_blank" className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1">
                          Ver Anúncio Suspeito <ExternalLink size={12}/>
                        </Link>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-500">
                        {denuncia.criadoEm?.toDate ? denuncia.criadoEm.toDate().toLocaleDateString('pt-BR') : 'Hoje'}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                             onClick={() => handleAprovarDenuncia(denuncia.anuncioId, denuncia.id)} 
                             className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-1"
                             title="Apagar Anúncio Fraude"
                           >
                             <Trash2 size={14}/> Apagar Anúncio
                           </button>
                           <button 
                             onClick={() => handleIgnorarDenuncia(denuncia.id)} 
                             className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-bold text-xs transition shadow-sm flex items-center gap-1"
                             title="Alarme falso"
                           >
                             <CheckCircle size={14}/> Ignorar
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MÓDULO 2: GESTÃO GLOBAL DE ANÚNCIOS (Sempre visível) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-black text-gray-800">Todos os Anúncios ({ads.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold">Título do Anúncio</th>
                  <th className="p-4 font-bold">Preço</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-center">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-800 line-clamp-1">{ad.titulo}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">{ad.categoria}</p>
                    </td>
                    <td className="p-4 font-black text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ad.preco || 0)}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full font-bold ${
                        ad.status === 'ativo' ? 'bg-green-100 text-green-700' : 
                        ad.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 
                        ad.status === 'expirado' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {ad.status === 'pendente' ? 'Aguardando Pag.' : ad.status || 'erro'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleDeleteAd(ad.id)} 
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
              <div className="p-10 text-center text-gray-500 font-bold bg-gray-50">
                Nenhum anúncio cadastrado na plataforma ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}