'use client'
import { useEffect, useState } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div 
      className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  )
}