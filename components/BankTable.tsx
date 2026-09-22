'use client'

import { useState, useEffect } from 'react'
import { BANCOS_PRESET, pmt, fmt, fmtPct, fmtCuota } from '@/lib/finance'
import BankRateWidget from '@/components/BankRateWidget'

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

interface BancoData {
  banco_id: string
  banco_nombre: string
  tipo: string
  historico: any[]
  actual: any
}

export default function BankTable({ hipoteca, ingresosMes, euribor, currentTin }: Props) {
  const [bancosData, setBancosData] = useState<Record<string, BancoData>>({})
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/banks')
      .then(r => r.json())
      .then(d => {
        if (d.bancos) {
          const map: Record<string, BancoData> = {}
          for (const b of d.bancos) map[b.banco_id] = b
          setBancosData(map)
        }
      })
      .catch(() => {})
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/banks/sync', {
        method: 'POST',
        headers: { 'x-cron-secret': 'espai2026cron' },
      })
      // Recargar datos
      const r = await fetch('/api/banks')
      const d = await r.json()
      if (d.bancos) {
        const map: Record<string, BancoData> = {}
        for (const b of d.bancos) map[b.banco_id] = b
        setBancosData(map)
      }
      setLastSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
    } catch {}
    setSyncing(false)
  }

  // Calcular el mínimo de intereses para resaltar la mejor opción
  const totales = BANCOS_PRESET.map((banco) => {
    const esBanco = banco as any
    const tin = banco.tipo === 'fija' ? banco.tin : euribor + esBanco.dif
    const n = banco.plazo * 12
    const r = (tin / 100) / 12
    const cuota = pmt(r, n, hipoteca)
    return cuota * n - hipoteca
  })
  const minIntereses = Math.min(...totales)

  return (
    <div className="card">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="card-title mb-0 pb-0 border-0">
          Comparativa de mercado · {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-[10px] text-espai-texto-suave hover:text-espai-naranja transition-colors font-semibold border border-espai-gris-borde rounded-lg px-2.5 py-1.5 hover:border-espai-naranja disabled:opacity-50"
            title="Actualizar tipos desde fuentes externas"
          >
            <svg className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Actualizando...' : 'Actualizar tipos'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-3 py-1.5 border border-espai-gris-borde rounded-lg text-espai-azul-mid font-semibold hover:bg-espai-naranja hover:text-white hover:border-espai-naranja transition-colors">
            {expanded ? 'Ocultar ▲' : 'Ver tabla ▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {lastSync && (
            <p className="text-[10px] text-green-600 mt-2">✓ Actualizado a las {lastSync}</p>
          )}
          <div className="border-b border-espai-gris-borde my-3" />

          <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-espai-azul text-white">
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">Banco</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide hidden sm:table-cell">Tipo</th>
              <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wide">TIN / TAE</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide">Cuota/mes</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide hidden md:table-cell">Esfuerzo</th>
              <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wide hidden lg:table-cell">Total intereses</th>
            </tr>
          </thead>
          <tbody>
            {BANCOS_PRESET.map((banco, idx) => {
              const esBanco = banco as any
              const tin = banco.tipo === 'fija' ? banco.tin : euribor + esBanco.dif

              let cuota: number
              let tinLabel: string
              let cuotaLabel: string

              if (banco.tipo === 'mixta') {
                const rFijo = (esBanco.tinFijo / 100) / 12
                const nTotal = banco.plazo * 12
                const cuotaFija = pmt(rFijo, nTotal, hipoteca)
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
              const totalInt = totales[idx]
              const esMejor = Math.abs(totalInt - minIntereses) < 1
              const esf = ingresosMes > 0 ? (cuota / ingresosMes) * 100 : 0
              const esfColor = esf < 30 ? 'text-green-600' : esf < 35 ? 'text-amber-600' : 'text-red-600'
              const diferencia = totalInt - minIntereses
              const bancoSuap = bancosData[banco.id]

              return (
                <tr
                  key={banco.id}
                  className={`border-b border-espai-gris-borde hover:bg-gray-50 transition-colors ${esMejor ? 'bg-green-50' : ''}`}
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-espai-azul flex items-center gap-1.5 flex-wrap">
                      {banco.nombre}
                      {esMejor && <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold">MEJOR</span>}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {esBanco.tae && (
                        <span className="text-[10px] text-gray-400">TAE {esBanco.tae.toFixed(2)}%</span>
                      )}
                      <BankRateWidget
                        bancoId={banco.id}
                        bancoNombre={banco.nombre}
                        tipo={banco.tipo}
                        bancoData={bancoSuap ?? null}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tagStyle[banco.tipo]}`}>
                      {banco.tipo === 'fija' ? 'Fija' : banco.tipo === 'variable' ? 'Variable' : 'Mixta'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[120px]">{tinLabel}</td>
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
                  <td className={`px-3 py-2.5 text-right font-bold hidden md:table-cell ${esfColor}`}>{fmtPct(esf)}</td>
                  <td className="px-3 py-2.5 text-right hidden lg:table-cell">
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
          </div>
        </>
      )}
    </div>
  )
}
