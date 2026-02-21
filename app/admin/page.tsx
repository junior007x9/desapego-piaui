'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { DollarSign, Users, ShoppingBag, Ban, CheckCircle, Trash2, AlertTriangle } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ads, setAds] = useState<any[]>([])
  const [stats, setStats] = useState({ revenue: 0, totalAds: 0, totalUsers: 0 })

  useEffect(() => {
    async function checkAdminAndLoadData() {
      // 1. Verifica se é Admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.is_admin) {
        alert("Acesso negado. Área restrita.")
        return router.push('/')
      }

      // 2. Carrega Dados para Estatísticas
      // Buscar todos os anúncios (mesmo os não pagos para ter controle)
      const { data: allAds } = await supabase
        .from('ads')
        .select('*, plans(price), profiles(full_name, email)')
        .order('created_at', { ascending: false })

      if (allAds) {
        setAds(allAds)
        
        // Calcular Financeiro (Soma dos preços dos planos de anúncios ativos/pagos)
        // Nota: Em um sistema real, teríamos uma tabela de 'transações', mas aqui somamos pelo plano
        const revenue = allAds
          .filter(ad => ad.status === 'active' || ad.status === 'sold')
          .reduce((acc, curr) => acc + (curr.plans?.price || 0), 0)
        
        setStats({
          revenue,
          totalAds: allAds.length,
          totalUsers: new Set(allAds.map(ad => ad.user_id)).size // Usuários únicos que anunciaram
        })
      }
      
      setLoading(false)
    }
    checkAdminAndLoadData()
  }, [])

  // Função para Banir/Desbanir
  const toggleBan = async (ad: any) => {
    const newStatus = ad.status === 'banned' ? 'active' : 'banned'
    const confirmMsg = newStatus === 'banned' 
      ? "Tem certeza que deseja BANIR este anúncio? Ele sumirá do site." 
      : "Deseja reativar este anúncio?"

    if (!confirm(confirmMsg)) return

    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', ad.id)

    if (!error) {
      setAds(ads.map(item => item.id === ad.id ? { ...item, status: newStatus } : item))
    }
  }

  if (loading) return <div className="p-10 text-center text-primary font-bold">Carregando Painel Administrativo...</div>

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
           🛡️ Painel do Administrador
        </h1>

        {/* --- CARDS FINANCEIROS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-gray-500 text-sm font-bold uppercase">Faturamento Estimado</p>
                   <h2 className="text-3xl font-bold text-green-600">R$ {stats.revenue.toLocaleString('pt-BR')}</h2>
                </div>
                <div className="p-3 bg-green-100 rounded-lg text-green-600"><DollarSign /></div>
             </div>
             <p className="text-xs text-gray-400 mt-2">Baseado em anúncios ativos/vendidos</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-gray-500 text-sm font-bold uppercase">Total de Anúncios</p>
                   <h2 className="text-3xl font-bold text-blue-600">{stats.totalAds}</h2>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><ShoppingBag /></div>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-gray-500 text-sm font-bold uppercase">Anunciantes Ativos</p>
                   <h2 className="text-3xl font-bold text-purple-600">{stats.totalUsers}</h2>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Users /></div>
             </div>
          </div>
        </div>

        {/* --- LISTA DE ANÚNCIOS PARA MODERAÇÃO --- */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
             <h3 className="font-bold text-gray-700">Gerenciar Anúncios</h3>
             <span className="text-xs bg-gray-100 px-2 py-1 rounded">Últimos atualizados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Vendedor</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{ad.title}</div>
                      <div className="text-xs text-gray-400">{ad.id}</div>
                    </td>
                    <td className="p-4">
                      <div>{ad.profiles?.full_name}</div>
                      <div className="text-xs text-gray-400">{ad.profiles?.email}</div>
                    </td>
                    <td className="p-4 text-green-600 font-bold">
                       R$ {ad.price.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        ad.status === 'active' ? 'bg-green-100 text-green-700' :
                        ad.status === 'banned' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ad.status === 'active' ? 'Ativo' : 
                         ad.status === 'banned' ? 'Banido' : ad.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleBan(ad)}
                        className={`p-2 rounded hover:text-white transition ${
                           ad.status === 'banned' 
                           ? 'bg-green-100 text-green-600 hover:bg-green-600' 
                           : 'bg-red-100 text-red-600 hover:bg-red-600'
                        }`}
                        title={ad.status === 'banned' ? "Reativar" : "Banir Anúncio"}
                      >
                        {ad.status === 'banned' ? <CheckCircle size={16}/> : <Ban size={16}/>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}