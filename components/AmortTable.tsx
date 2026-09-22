'use client'

import { useState } from 'react'
import { generarAmortizacion, fmt } from '@/lib/finance'

interface Props {
  hipoteca: number
  tin: number
  plazo: number
}

export default function AmortTable({ hipoteca, tin, plazo }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const filas = generarAmortizacion(hipoteca, tin, plazo)
  const visibles = showAll ? filas : filas.slice(0, 5)

  return (
    <div className="card">
      <div
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="card-title mb-0">Tabla de amortización año a año</div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs px-3 py-1.5 border border-espai-gris-borde rounded-lg text-espai-azul-mid font-semibold hover:bg-espai-naranja hover:text-white hover:border-espai-naranja transition-colors">
          {expanded ? 'Ocultar ▲' : 'Ver tabla ▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-espai-azul text-white">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">Año</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Cuota anual</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide hidden sm:table-cell">Capital amort.</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Intereses</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide hidden sm:table-cell">Capital pendiente</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((fila) => (
                <tr
                  key={fila.anio}
                  className={`border-b border-espai-gris-borde ${
                    fila.anio === plazo ? 'bg-orange-50 font-semibold' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-2">{fila.anio}</td>
                  <td className="px-3 py-2 text-right">{fmt(fila.cuotaAnual)}</td>
                  <td className="px-3 py-2 text-right hidden sm:table-cell">{fmt(fila.capital)}</td>
                  <td className="px-3 py-2 text-right">{fmt(fila.intereses)}</td>
                  <td className="px-3 py-2 text-right font-medium text-espai-azul hidden sm:table-cell">{fmt(fila.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!showAll && filas.length > 5 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowAll(true) }}
              className="mt-2 w-full text-center text-sm text-espai-naranja hover:underline py-2"
            >
              Mostrar todos los {filas.length} años ▼
            </button>
          )}
        </div>
      )}
    </div>
  )
}
