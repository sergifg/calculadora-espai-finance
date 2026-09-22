'use client'

import { ResultadoCalculo } from '@/lib/finance'
import { fmt, fmtPct } from '@/lib/finance'

interface Props {
  resultado: ResultadoCalculo | null
  plazo: number
}

type ColorKey = 'verde' | 'amarillo' | 'rojo' | 'neutral'

function semaforo(val: number, umbralVerde: number, umbralAmarillo: number): ColorKey {
  if (val <= umbralVerde) return 'verde'
  if (val <= umbralAmarillo) return 'amarillo'
  return 'rojo'
}

const colorMap = {
  verde: { card: 'border-green-200 bg-green-50', value: 'text-green-700', dot: 'bg-green-500' },
  amarillo: { card: 'border-amber-200 bg-amber-50', value: 'text-amber-700', dot: 'bg-amber-500' },
  rojo: { card: 'border-red-200 bg-red-50', value: 'text-red-600', dot: 'bg-red-500' },
  neutral: { card: 'border-espai-gris-borde bg-white', value: 'text-espai-azul', dot: '' },
}

export default function KpiGrid({ resultado, plazo }: Props) {
  if (!resultado) return null

  const ltvColor = semaforo(resultado.ltv, 80, 90)
  const esfuerzoColor = semaforo(resultado.esfuerzoReal, 30, 35)

  const kpis = [
    {
      label: 'Capital hipoteca',
      value: fmt(resultado.hipoteca),
      sub: 'Precio − fondos propios',
      color: 'neutral' as const,
    },
    {
      label: 'LTV real',
      value: fmtPct(resultado.ltv),
      sub: resultado.ltv > 80 ? '⚠ Supera 80%' : 'Hipoteca / Precio',
      color: ltvColor as ColorKey,
      dot: true,
    },
    {
      label: 'Esfuerzo real',
      value: fmtPct(resultado.esfuerzoReal),
      sub: 'Cuota total / Ingresos válidos',
      color: esfuerzoColor as ColorKey,
      dot: true,
    },
    {
      label: 'Total intereses',
      value: fmt(resultado.totalIntereses),
      sub: `a ${plazo} años`,
      color: 'neutral' as const,
    },
    {
      label: 'Total pagado',
      value: fmt(resultado.totalPagado),
      sub: 'Capital + intereses',
      color: 'neutral' as const,
    },
    {
      label: 'Tasación mínima',
      value: fmt(resultado.tasacionMinima),
      sub: 'Para LTV 80% banco',
      color: 'neutral' as const,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4">
      {kpis.map((kpi) => {
        const c = colorMap[kpi.color]
        return (
          <div key={kpi.label} className={`kpi-card border ${c.card}`}>
            <div className="kpi-label">
              {kpi.dot && (
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${c.dot} align-middle`} />
              )}
              {kpi.label}
            </div>
            <div className={`kpi-value ${c.value}`}>{kpi.value}</div>
            <div className="kpi-sub hidden sm:block">{kpi.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
