'use client'

import Link from 'next/link'
import EuriborWidget from '@/components/EuriborWidget'
import { EURIBOR_ACTUAL, EURIBOR_MES } from '@/lib/finance'

export default function AppHeader() {
  return (
    <header className="bg-espai-azul border-b-4 border-espai-naranja no-print">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="https://www.espaifinance.com/wp-content/uploads/2023/11/logo-espaifinance-white.webp"
            alt="Espai Finance"
            className="h-7 sm:h-9 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="w-px h-8 bg-white/20 hidden sm:block" />
          <div className="hidden sm:block">
            <h1 className="text-white font-bold text-base">Calculadora Hipotecaria</h1>
            <p className="text-white/50 text-[10px]">Herramienta profesional de asesores</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <EuriborWidget euriborFallback={EURIBOR_ACTUAL} mesFallback={EURIBOR_MES} />
        </div>
      </div>
    </header>
  )
}
