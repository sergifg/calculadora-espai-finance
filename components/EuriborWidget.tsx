'use client'

import { useState, useEffect, useRef } from 'react'

interface DatoEuribor {
  mes: string   // YYYY-MM-DD
  valor: number
}

interface EuriborData {
  actual: { mes: string; valor: number }
  historico: DatoEuribor[]
}

function mesLabel(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
}

function mesLabelLargo(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function MiniGrafico({ datos }: { datos: DatoEuribor[] }) {
  if (datos.length < 2) return null

  const W = 560
  const H = 220
  const PAD = { top: 20, right: 20, bottom: 40, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const valores = datos.map(d => d.valor)
  const minV = Math.min(...valores) - 0.2
  const maxV = Math.max(...valores) + 0.2

  const xScale = (i: number) => PAD.left + (i / (datos.length - 1)) * innerW
  const yScale = (v: number) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH

  const points = datos.map((d, i) => `${xScale(i)},${yScale(d.valor)}`).join(' ')
  const areaPoints = [
    `${xScale(0)},${PAD.top + innerH}`,
    ...datos.map((d, i) => `${xScale(i)},${yScale(d.valor)}`),
    `${xScale(datos.length - 1)},${PAD.top + innerH}`,
  ].join(' ')

  // Ticks eje Y
  const yTicks = []
  const step = (maxV - minV) / 4
  for (let i = 0; i <= 4; i++) {
    const v = minV + step * i
    yTicks.push({ v, y: yScale(v) })
  }

  // Ticks eje X — cada 6 meses
  const xTicks = datos.filter((_, i) => i % 6 === 0 || i === datos.length - 1)
    .map(d => ({ label: mesLabel(d.mes), x: xScale(datos.indexOf(d)) }))

  const ultimo = datos[datos.length - 1]
  const penultimo = datos[datos.length - 2]
  const tendencia = ultimo.valor > penultimo.valor ? '↑' : ultimo.valor < penultimo.valor ? '↓' : '→'
  const tendenciaColor = ultimo.valor > penultimo.valor ? '#dc2626' : '#16a34a'

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
        <defs>
          <linearGradient id="euriborGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f58134" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f58134" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#e3e7f0" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fontSize="9" fill="#727f9f">{t.v.toFixed(1)}%</text>
          </g>
        ))}

        {/* Área */}
        <polygon points={areaPoints} fill="url(#euriborGrad)" />

        {/* Línea */}
        <polyline points={points} fill="none" stroke="#f58134" strokeWidth="2" strokeLinejoin="round" />

        {/* Punto último */}
        <circle cx={xScale(datos.length - 1)} cy={yScale(ultimo.valor)} r="4" fill="#f58134" stroke="white" strokeWidth="1.5" />

        {/* Eje X */}
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={H - 8} textAnchor="middle" fontSize="9" fill="#727f9f">{t.label}</text>
        ))}
      </svg>

      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
        <span>{datos.length} meses de histórico</span>
        <span style={{ color: tendenciaColor }} className="font-semibold">
          {tendencia} {Math.abs(ultimo.valor - penultimo.valor).toFixed(3)}% vs mes anterior
        </span>
        <span>Fuente: FRED / BCE</span>
      </div>
    </div>
  )
}

interface Props {
  euriborFallback: number
  mesFallback: string
}

export default function EuriborWidget({ euriborFallback, mesFallback }: Props) {
  const [data, setData] = useState<EuriborData | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/euribor')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const valor = data?.actual.valor ?? euriborFallback
  const mes = data?.actual.mes
    ? mesLabelLargo(data.actual.mes)
    : mesFallback

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-right hidden sm:block group cursor-pointer hover:opacity-80 transition-opacity"
        title="Ver histórico Euríbor"
      >
        <div className="text-white/50 text-[10px] uppercase tracking-wider">
          Euríbor 12M · {mes}
          <span className="ml-1 text-white/30 group-hover:text-white/60 transition-colors">↗</span>
        </div>
        <div className="text-espai-naranja font-bold text-lg">{valor.toFixed(3)}%</div>
      </button>

      {/* Modal histórico */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            {/* Cabecera modal */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #002F4F, #293C5B)' }}>
              <div>
                <h3 className="text-white font-bold text-base">Euríbor 12M — Histórico</h3>
                <p className="text-white/50 text-xs mt-0.5">Media mensual oficial · Fuente: FRED / BCE</p>
              </div>
              <div className="text-right">
                <div className="text-white/50 text-[10px] uppercase tracking-wider">Último dato</div>
                <div className="text-espai-naranja font-bold text-2xl">{valor.toFixed(3)}%</div>
                <div className="text-white/40 text-[10px]">{mes}</div>
              </div>
              <button onClick={() => setOpen(false)} className="ml-4 text-white/40 hover:text-white text-xl font-bold leading-none">✕</button>
            </div>

            {/* Contenido */}
            <div className="px-6 py-5">
              {loading && (
                <div className="text-center py-8 text-gray-400 text-sm">Cargando datos...</div>
              )}
              {!loading && data && (
                <MiniGrafico datos={data.historico} />
              )}
              {!loading && !data && (
                <div className="text-center py-8 text-red-400 text-sm">No se pudieron cargar los datos históricos.</div>
              )}

              {/* Tabla últimos 12 meses */}
              {data && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">Últimos 12 meses</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {data.historico.slice(-12).reverse().map(d => (
                      <div key={d.mes} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                        <div className="text-[10px] text-gray-400">{mesLabel(d.mes)}</div>
                        <div className="font-bold text-espai-azul text-sm">{d.valor.toFixed(3)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400">
              Dato: media mensual Euríbor 12M · Se actualiza automáticamente los días 1 y 15 de cada mes · No constituye asesoramiento financiero
            </div>
          </div>
        </div>
      )}
    </>
  )
}
