'use client'

import { BANCOS_PRESET, pmt, fmt, fmtPct, fmtCuota } from '@/lib/finance'

interface Props {
  hipoteca: number
  ingresosMes: number
  euribor: number
  currentTin: number
}

const tagStyle = {
  fija: 'bg-blue-100 text-blue-700',
  variable: 'bg-green-100 text-green-700',
  mixta: 'bg-orange-100 text-orange-700',
}

export default function BankTable({ hipoteca, ingresosMes, euribor, currentTin }: Props) {
  return (
    <div className="card">
      <div className="card-title">Comparativa de mercado · sep 2026</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-espai-azul text-white">
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">Banco</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">Tipo</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">TIN</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Cuota/mes</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Esfuerzo</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Total intereses</th>
            </tr>
          </thead>
          <tbody>
            {BANCOS_PRESET.map((banco) => {
              const tin = banco.tipo === 'fija'
                ? banco.tin
                : banco.tipo === 'variable'
                  ? euribor + (banco as any).dif
                  : euribor + (banco as any).dif
              const plazo = banco.plazo
              const r = (tin / 100) / 12
              const n = plazo * 12
              const cuota = pmt(r, n, hipoteca)
              const totalInt = cuota * n - hipoteca
              const esf = ingresosMes > 0 ? (cuota / ingresosMes) * 100 : 0
              const esfColor = esf < 30 ? 'text-green-600' : esf < 35 ? 'text-amber-600' : 'text-red-600'
              const isHighlighted = Math.abs(tin - currentTin) < 0.01

              let tinLabel = ''
              if (banco.tipo === 'fija') tinLabel = `${banco.tin.toFixed(2)}%`
              else if (banco.tipo === 'variable') tinLabel = `Eur+${(banco as any).dif.toFixed(2)}% = ${tin.toFixed(2)}%`
              else tinLabel = `${(banco as any).tinFijo.toFixed(2)}% → Eur+${(banco as any).dif.toFixed(2)}%`

              return (
                <tr
                  key={banco.id}
                  className={`border-b border-espai-gris-borde hover:bg-gray-50 transition-colors ${
                    isHighlighted ? 'bg-orange-50 font-semibold' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 font-medium text-espai-azul">{banco.nombre}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tagStyle[banco.tipo]}`}>
                      {banco.tipo.charAt(0).toUpperCase() + banco.tipo.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">{tinLabel}</td>
                  <td className="px-3 py-2.5 text-right font-bold">{fmtCuota(cuota)}</td>
                  <td className={`px-3 py-2.5 text-right font-bold ${esfColor}`}>{fmtPct(esf)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500 text-xs">{fmt(totalInt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-300 mt-2">* Tipos orientativos sep. 2026. Consultar condiciones con cada entidad.</p>
    </div>
  )
}
