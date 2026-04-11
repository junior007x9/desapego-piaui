'use client'
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getCountFromServer, query, where, getDocs, setDoc, doc } from 'firebase/firestore'
import { Users } from 'lucide-react'

export default function ContadorEstatisticas() {
  const [totalUsuarios, setTotalUsuarios] = useState<number | null>(null)
  const [usuariosOnline, setUsuariosOnline] = useState<number | null>(null)

  useEffect(() => {
    async function buscarTotalUsuarios() {
      try {
        const snap = await getCountFromServer(collection(db, 'usuarios'))
        setTotalUsuarios(snap.data().count)
      } catch (error) {
        setTotalUsuarios(0)
      }
    }

    async function registrarEBuscarOnline() {
      try {
        let sessionId = sessionStorage.getItem('sessionId_desapego')
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15)
          sessionStorage.setItem('sessionId_desapego', sessionId)
        }

        await setDoc(doc(db, 'sessoes_ativas', sessionId), {
          ultimaAtividade: new Date() 
        })

        const cincoMinutosAtras = new Date()
        cincoMinutosAtras.setMinutes(cincoMinutosAtras.getMinutes() - 5)

        const q = query(
          collection(db, 'sessoes_ativas'),
          where('ultimaAtividade', '>=', cincoMinutosAtras)
        )

        const onlineSnap = await getDocs(q)
        setUsuariosOnline(onlineSnap.size || 1) 
      } catch (error) {
        setUsuariosOnline(1)
      }
    }

    buscarTotalUsuarios()
    registrarEBuscarOnline()

    const intervalo = setInterval(registrarEBuscarOnline, 3 * 60 * 1000)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/90 text-xs md:text-sm font-medium shadow-sm">
         
         <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>{usuariosOnline !== null ? usuariosOnline : '--'} online</span>
         </div>
         
         <div className="w-1 h-1 bg-white/30 rounded-full"></div>
         
         <div className="flex items-center gap-1.5">
            <Users size={14} className="opacity-70" />
            <span>{totalUsuarios !== null ? totalUsuarios : '--'} membros</span>
         </div>

      </div>
    </div>
  )
}