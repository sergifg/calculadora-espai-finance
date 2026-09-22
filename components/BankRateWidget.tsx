'use client'

import { useState, useEffect } from 'react'

interface DatoBanco {
  mes: string
  tin: number | null
  tae: number | null
  diferencial: number | null
  tin_fijo: number | null
  periodo_fijo: number | null
  fuente: string
}

interface BancoData {
  banco_id: string
  banco_nombre: string
  tipo: string
  historico: DatoBanco[]
  actual: DatoBanco
}

function mesLabel(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
}

function mesLabelLargo(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function valorPrincipal(d: DatoBanco): number | null {
  return d.tin ?? d.diferencial ?? null
}

function labelValor(banco: BancoData): string {
  const a = banco.actual
  if (banco.tipo === 'fija') return a.tin ? `${a.tin.toFixed(2)}% TIN` : '—'
  if (banco.tipo === 'variable') return a.diferencial ? `Eur+${a.diferencial.toFixed(2)}%` : '—'
  if (banco.tipo === 'mixta') return a.tin_fijo ? `${a.tin_fijo.toFixed(2)}% fijo ${a.periodo_fijo}a` : '—'
  return '—'
}

function GraficaBanco({ datos, tipo }: { datos: DatoBanco[], tipo: string }) {
  if (datos.length < 2) return null

  const valores = datos.map(d => valorPrincipal(d)).filter(v => v !== null) as number[]
  if (valores.length < 2) return null

  const W = 560, H = 200
  const PAD = { top: 20, right: 20, bottom: 40, left: 45 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const minV = Math.min(...valores) - 0.1
  const maxV = Math.max(...valores) + 0.1

  const datosConValor = datos.filter(d => valorPrincipal(d) !== null)
  const xScale = (i: number) => PAD.left + (i / (datosConValor.length - 1)) * innerW
  const yScale = (v: number) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH

  const points = datosConValor.map((d, i) => `${xScale(i)},${yScale(valorPrincipal(d)!)}`).join(' ')
  const areaPoints = [
    `${xScale(0)},${PAD.top + innerH}`,
    ...datosConValor.map((d, i) => `${xScale(i)},${yScale(valorPrincipal(d)!)}`),
    `${xScale(datosConValor.length - 1)},${PAD.top + innerH}`,
  ].join(' ')

  const yTicks = []
  const step = (maxV - minV) / 4
  for (let i = 0; i <= 4; i++) {
    const v = minV + step * i
    yTicks.push({ v, y: yScale(v) })
  }

  const xTicks = datosConValor
    .filter((_, i) => i % Math.max(1, Math.floor(datosConValor.length / 4)) === 0 || i === datosConValor.length - 1)
    .map((d, _, arr) => ({ label: mesLabel(d.mes), x: xScale(datosConValor.indexOf(d)) }))

  const ultimo = datosConValor[datosConValor.length - 1]
  const penultimo = datosConValor[datosConValor.length - 2]
  const vUlt = valorPrincipal(ultimo)!
  const vPen = valorPrincipal(penultimo)!
  const tendencia = vUlt > vPen ? '↑' : vUlt < vPen ? '↓' : '→'
  const tendenciaColor = vUlt > vPen ? '#dc2626' : '#16a34a'

  const etiquetaY = tipo === 'variable' ? 'Diferencial (%)' : 'TIN (%)'

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
        <defs>
          <linearGradient id="bankGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#002F4F" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#002F4F" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#e3e7f0" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fontSize="9" fill="#727f9f">{t.v.toFixed(2)}%</text>
          </g>
        ))}
        <polygon points={areaPoints} fill="url(#bankGrad)" />
        <polyline points={points} fill="none" stroke="#002F4F" strokeWidth="2" strokeLinejoin="round" />
        <circle cx={xScale(datosConValor.length - 1)} cy={yScale(vUlt)} r="4" fill="#f58134" stroke="white" strokeWidth="1.5" />
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={H - 8} textAnchor="middle" fontSize="9" fill="#727f9f">{t.label}</text>
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
        <span>{datosConValor.length} meses de histórico</span>
        <span style={{ color: tendenciaColor }} className="font-semibold">
          {tendencia} {Math.abs(vUlt - vPen).toFixed(3)}% vs mes anterior
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${ultimo.fuente === 'manual' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
          {ultimo.fuente === 'manual' ? 'dato manual' : 'scraping'}
        </span>
      </div>
    </div>
  )
}

interface Props {
  bancoId: string
  bancoNombre: string
  tipo: string
  bancoData: BancoData | null
}

export default function BankRateWidget({ bancoId, bancoNombre, tipo, bancoData }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const { actual, historico } = bancoData ?? { actual: null, historico: [] as DatoBanco[] }
  const mesActual = actual ? mesLabelLargo(actual.mes) : 'sin datos'

  const tagColor = tipo === 'fija'
    ? 'bg-blue-100 text-blue-700'
    : tipo === 'variable'
    ? 'bg-green-100 text-green-700'
    : 'bg-orange-100 text-orange-700'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] text-espai-naranja hover:underline font-semibold ml-1 cursor-pointer"
        title={`Ver histórico ${bancoNombre}`}
      >
        ↗ histórico
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Cabecera */}
            <div className="px-6 py-4 flex items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, #002F4F, #293C5B)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-base truncate">{bancoNombre}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tagColor}`}>
                    {tipo === 'fija' ? 'Fija' : tipo === 'variable' ? 'Variable' : 'Mixta'}
                  </span>
                </div>
                <p className="text-white/50 text-xs">Evolución tipos hipotecarios · {mesActual}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white/50 text-[10px] uppercase tracking-wider">Dato actual</div>
                <div className="text-espai-naranja font-bold text-xl">{bancoData ? labelValor(bancoData) : '—'}</div>
                {actual?.tae && <div className="text-white/40 text-[10px]">TAE {actual.tae.toFixed(2)}%</div>}
              </div>
              <button onClick={() => setOpen(false)} className="ml-2 text-white/40 hover:text-white text-xl font-bold leading-none">✕</button>
            </div>

            {/* Gráfica */}
            <div className="px-6 py-5">
              {(!bancoData || historico.length === 0) && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <div className="text-3xl mb-2">📊</div>
                  <p>Histórico no disponible aún para este banco.</p>
                  <p className="text-xs mt-1">Los datos se actualizan mensualmente.</p>
                </div>
              )}
              {bancoData && historico.length > 0 && <GraficaBanco datos={historico} tipo={tipo} />}

              {/* Tabla últimos meses */}
              {bancoData && historico.length > 0 && <div className="mt-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Histórico reciente</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {historico.slice(-6).reverse().map(d => (
                    <div key={d.mes} className="bg-gray-50 rounded-lg px-2 py-2 text-center">
                      <div className="text-[10px] text-gray-400">{mesLabel(d.mes)}</div>
                      {tipo === 'fija' && <div className="font-bold text-espai-azul text-sm">{d.tin?.toFixed(2)}%</div>}
                      {tipo === 'variable' && <div className="font-bold text-espai-azul text-sm">+{d.diferencial?.toFixed(2)}%</div>}
                      {tipo === 'mixta' && <div className="font-bold text-espai-azul text-sm">{d.tin_fijo?.toFixed(2)}%</div>}
                      {d.tae && <div className="text-[9px] text-gray-400">TAE {d.tae.toFixed(2)}%</div>}
                    </div>
                  ))}
                </div>
              </div>}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
              <span>Tipos orientativos · Confirmar con cada entidad antes de comprometerse</span>
              <span className="text-espai-naranja font-semibold">Espai Finance</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
