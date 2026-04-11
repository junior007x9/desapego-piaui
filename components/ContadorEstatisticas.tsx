'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getCountFromServer, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Users, Radio } from 'lucide-react'

export default function ContadorEstatisticas() {
  const [totalUsuarios, setTotalUsuarios] = useState<number | null>(null)
  const [usuariosOnline, setUsuariosOnline] = useState<number | null>(null)

  useEffect(() => {
    // 1. BUSCA O TOTAL DE CADASTRADOS
    async function buscarTotalUsuarios() {
      try {
        // Se você não tiver a coleção 'usuarios', mude para 'anuncios' para mostrar o total de anúncios!
        const snap = await getCountFromServer(collection(db, 'usuarios'))
        setTotalUsuarios(snap.data().count)
      } catch (error) {
        console.error("Erro ao buscar total de usuários. Certifique-se de que a coleção 'usuarios' existe.")
        setTotalUsuarios(0)
      }
    }

    // 2. SISTEMA DE "ONLINE AGORA" (Heartbeat)
    async function registrarEBuscarOnline() {
      try {
        // Gera um ID único para esta aba do navegador da pessoa
        let sessionId = sessionStorage.getItem('sessionId_desapego')
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15)
          sessionStorage.setItem('sessionId_desapego', sessionId)
        }

        // Avisa ao banco de dados: "Estou online agora!"
        await setDoc(doc(db, 'sessoes_ativas', sessionId), {
          ultimaAtividade: new Date() // Usamos a data do dispositivo para facilitar a busca
        })

        // Calcula a hora exata de 5 minutos atrás
        const cincoMinutosAtras = new Date()
        cincoMinutosAtras.setMinutes(cincoMinutosAtras.getMinutes() - 5)

        // Busca no banco todo mundo que deu "Oi" nos últimos 5 minutos
        const q = query(
          collection(db, 'sessoes_ativas'),
          where('ultimaAtividade', '>=', cincoMinutosAtras)
        )

        const onlineSnap = await getDocs(q)
        setUsuariosOnline(onlineSnap.size || 1) // Mostra o tamanho (no mínimo 1, que é a própria pessoa)
      } catch (error) {
        console.error("Erro no sistema de usuários online:", error)
        setUsuariosOnline(1)
      }
    }

    buscarTotalUsuarios()
    registrarEBuscarOnline()

    // O pulo do gato: A cada 3 minutos, avisa o banco que a pessoa ainda está navegando
    // Isso evita gastar as leituras gratuitas do Firebase atoa.
    const intervalo = setInterval(registrarEBuscarOnline, 3 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8">
      
      {/* Card: Online Agora */}
      <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4 min-w-[220px]">
        <div className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Online Agora</p>
          <p className="text-2xl font-black text-emerald-600">
            {usuariosOnline !== null ? usuariosOnline : '--'}
          </p>
        </div>
      </div>

      {/* Card: Total de Cadastros */}
      <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-primary/10 flex items-center gap-4 min-w-[220px]">
        <div className="bg-primary/10 p-3 rounded-full text-primary">
          <Users size={20} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Membros da Comunidade</p>
          <p className="text-2xl font-black text-gray-900">
            {totalUsuarios !== null ? totalUsuarios : '--'}
          </p>
        </div>
      </div>

    </div>
  )
}