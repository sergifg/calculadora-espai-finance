'use client'

import Link from 'next/link'

interface Props {
  euribor?: number
}

export default function AppHeader({ euribor = 2.527 }: Props) {
  return (
    <header className="bg-espai-azul border-b-4 border-espai-naranja no-print">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src="https://www.espaifinance.com/wp-content/uploads/2023/11/logo-espaifinance-white.webp"
            alt="Espai Finance"
            className="h-9 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="w-px h-8 bg-white/20" />
          <div>
            <h1 className="text-white font-bold text-base">Calculadora Hipotecaria</h1>
            <p className="text-white/50 text-[10px]">Herramienta profesional de asesores</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-white/50 text-[10px] uppercase tracking-wider">Euríbor 12M · sep 2026</div>
            <div className="text-espai-naranja font-bold text-lg">{euribor.toFixed(3)}%</div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/calculadora" className="text-white/70 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              Calculadora
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
