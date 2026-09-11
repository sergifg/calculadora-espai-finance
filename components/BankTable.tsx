'use client'

import { BANCOS_PRESET, pmt, fmt, fmtPct, fmtCuota, EURIBOR_ACTUAL } from '@/lib/finance'

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
  // Calcular el mínimo de intereses para resaltar la mejor opción
  const totales = BANCOS_PRESET.map((banco) => {
    const tin = banco.tipo === 'fija'
      ? banco.tin
      : euribor + (banco as any).dif
    const n = banco.plazo * 12
    const r = (tin / 100) / 12
    const cuota = pmt(r, n, hipoteca)
    return cuota * n - hipoteca
  })
  const minIntereses = Math.min(...totales)

  return (
    <div className="card">
      <div className="card-title">Comparativa de mercado · {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-espai-azul text-white">
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">Banco</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">Tipo</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">TIN / TAE</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Cuota/mes</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Esfuerzo</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Total intereses</th>
            </tr>
          </thead>
          <tbody>
            {BANCOS_PRESET.map((banco, idx) => {
              const esBanco = banco as any
              const tin = banco.tipo === 'fija'
                ? banco.tin
                : euribor + esBanco.dif

              // Para mixta: cuota del período fijo (más relevante en la comparativa)
              let cuota: number
              let tinLabel: string
              let cuotaLabel: string

              if (banco.tipo === 'mixta') {
                const rFijo = (esBanco.tinFijo / 100) / 12
                const nTotal = banco.plazo * 12
                const cuotaFija = pmt(rFijo, nTotal, hipoteca)
                // Saldo tras período fijo
                let saldo = hipoteca
                for (let m = 0; m < esBanco.periodoFijo * 12; m++) {
                  const intM = saldo * rFijo
                  saldo -= (cuotaFija - intM)
                }
                const rVar = ((euribor + esBanco.dif) / 100) / 12
                const nVar = nTotal - esBanco.periodoFijo * 12
                const cuotaVar = pmt(rVar, nVar, Math.max(0, saldo))

                cuota = cuotaFija
                tinLabel = `${esBanco.tinFijo.toFixed(2)}% fijo ${esBanco.periodoFijo}a → Eur+${esBanco.dif.toFixed(2)}%`
                cuotaLabel = `${fmtCuota(cuotaFija)} → ${fmtCuota(cuotaVar)}`
              } else {
                const r = (tin / 100) / 12
                const n = banco.plazo * 12
                cuota = pmt(r, n, hipoteca)
                tinLabel = banco.tipo === 'fija'
                  ? `${banco.tin.toFixed(2)}%`
                  : `Eur+${esBanco.dif.toFixed(2)}% = ${tin.toFixed(2)}%`
                cuotaLabel = fmtCuota(cuota)
              }

              const n = banco.plazo * 12
              const r = (tin / 100) / 12
              const cuotaRef = pmt(r, n, hipoteca)
              const totalInt = totales[idx]
              const esMejor = Math.abs(totalInt - minIntereses) < 1
              const esf = ingresosMes > 0 ? (cuota / ingresosMes) * 100 : 0
              const esfColor = esf < 30 ? 'text-green-600' : esf < 35 ? 'text-amber-600' : 'text-red-600'
              const diferencia = totalInt - minIntereses

              return (
                <tr
                  key={banco.id}
                  className={`border-b border-espai-gris-borde hover:bg-gray-50 transition-colors ${
                    esMejor ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-espai-azul flex items-center gap-1.5">
                      {banco.nombre}
                      {esMejor && <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold">MEJOR</span>}
                    </div>
                    {esBanco.tae && (
                      <div className="text-[10px] text-gray-400">TAE {esBanco.tae.toFixed(2)}%</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tagStyle[banco.tipo]}`}>
                      {banco.tipo === 'fija' ? 'Fija' : banco.tipo === 'variable' ? 'Variable' : 'Mixta'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[140px]">{tinLabel}</td>
                  <td className="px-3 py-2.5 text-right">
                    {banco.tipo === 'mixta' ? (
                      <div>
                        <div className="font-bold text-xs">{cuotaLabel.split(' → ')[0]}</div>
                        <div className="text-[10px] text-gray-400">→ {cuotaLabel.split(' → ')[1]}</div>
                      </div>
                    ) : (
                      <span className="font-bold">{fmtCuota(cuota)}</span>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold ${esfColor}`}>{fmtPct(esf)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className={`font-semibold text-sm ${esMejor ? 'text-green-700' : 'text-gray-700'}`}>
                      {fmt(totalInt)}
                    </div>
                    {!esMejor && diferencia > 0 && (
                      <div className="text-[10px] text-red-400">+{fmt(diferencia)} más</div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-400">
        <span>* Tipos orientativos. Confirmar con cada entidad antes de comprometerse.</span>
        <span>· Euríbor usado: <strong>{euribor.toFixed(3)}%</strong></span>
        <span>· TAE incluye gastos de constitución estimados.</span>
      </div>
    </div>
  )
}
