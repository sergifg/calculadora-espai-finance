'use client'

import Link from 'next/link'
import EuriborWidget from '@/components/EuriborWidget'
import { EURIBOR_ACTUAL, EURIBOR_MES } from '@/lib/finance'

export default function AppHeader() {
  return (
    <header className="bg-espai-azul border-b-4 border-espai-naranja no-print">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="https://www.espaifinance.com/wp-content/uploads/2023/11/logo-espaifinance-white.webp"
            alt="Espai Finance"
            className="h-6 sm:h-9 object-contain flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="w-px h-7 bg-white/20 hidden sm:block flex-shrink-0" />
          <div className="hidden sm:block min-w-0">
            <h1 className="text-white font-bold text-base leading-tight">Calculadora Hipotecaria</h1>
            <p className="text-white/50 text-[10px]">Herramienta profesional de asesores</p>
          </div>
          {/* Mobile: subtítulo compacto */}
          <span className="sm:hidden text-white/40 text-[10px] uppercase tracking-wider">Calculadora</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <EuriborWidget euriborFallback={EURIBOR_ACTUAL} mesFallback={EURIBOR_MES} />
        </div>
      </div>
    </header>
  )
}
