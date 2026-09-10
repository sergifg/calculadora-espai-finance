'use client'

import { useState, useEffect, useCallback } from 'react'
import AppHeader from '@/components/AppHeader'
import KpiGrid from '@/components/KpiGrid'
import BankTable from '@/components/BankTable'
import AmortTable from '@/components/AmortTable'
import SaveSimulationModal from '@/components/SaveSimulationModal'
import { calcular, fmt, fmtCuota, DatosCalculo, ResultadoCalculo } from '@/lib/finance'
import { User } from '@/lib/types'

const DEFAULTS: DatosCalculo = {
  precio: 370000,
  precioEscrituracion: 370000,
  fondos: 40000,
  ingresos1: 3500,
  ingresos2: 2415,
  tin: 2.55,
  plazo: 30,
  tipoHipoteca: 'fija',
  euribor: 3.103,
  diferencial: 0.49,
  tinFijo: 1.80,
  periodoFijo: 3,
  itp_pct: 10,
  gasto_tasacion: 700,
  gasto_notaria: 1200,
  gasto_registro: 400,
  gasto_gestoria: 500,
  gasto_espai: 6050,
  gasto_otros: 0,
}

interface Props { user: User }

export default function CalculatorClient({ user }: Props) {
  const [datos, setDatos] = useState<DatosCalculo>(DEFAULTS)
  const [nombreCliente, setNombreCliente] = useState('')
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  const [showSave, setShowSave] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('espai_load_simulation')
    if (stored) {
      try { setDatos(JSON.parse(stored)) } catch {}
      localStorage.removeItem('espai_load_simulation')
    }
  }, [])

  useEffect(() => {
    setResultado(calcular(datos))
  }, [datos])

  const set = useCallback((key: keyof DatosCalculo, value: number | string) => {
    setDatos(prev => ({ ...prev, [key]: value }))
  }, [])

  const n = (val: string) => parseFloat(val) || 0

  function handlePrint() {
    const title = document.title
    document.title = `Simulación Hipotecaria${nombreCliente ? ' · ' + nombreCliente : ''} · Espai Finance`
    window.print()
    setTimeout(() => { document.title = title }, 1000)
  }

  if (!resultado) return null

  const ingresosMes = datos.ingresos1 + datos.ingresos2

  return (
    <div className="min-h-screen bg-espai-gris">
      <AppHeader userEmail={user.email} />

      {/* Cliente bar */}
      <div className="bg-espai-azul-mid border-b border-white/10 no-print">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">
          <label className="text-[10px] text-white/60 uppercase tracking-widest whitespace-nowrap">Cliente:</label>
          <input
            type="text"
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            placeholder="Nombre del cliente..."
            className="bg-white/10 border border-white/20 text-white placeholder-white/30 px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:border-espai-naranja flex-1 max-w-sm"
          />
          <span className="text-white/30 text-xs">Aparece en el PDF generado</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-screen-xl mx-auto px-6 pt-4 pb-0 flex items-center justify-between no-print">
        <div className="text-xs text-espai-texto-suave">
          Datos de mercado: <strong>septiembre 2026</strong> ·
          Euríbor 12M: <strong>3,103%</strong> ·
          Tipos fijos: <strong>2,55% – 2,70%</strong>
        </div>
        <div className="flex items-center gap-2">
          {savedOk && (
            <span className="text-green-600 text-xs font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              ✓ Guardado
            </span>
          )}
          <button onClick={() => setShowSave(true)} className="btn-secondary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Guardar
          </button>
          <button onClick={handlePrint} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-4 grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* COL IZQUIERDA */}
        <div className="space-y-4">

          {/* Datos operación */}
          <div className="card">
            <div className="card-title">Datos de la operación</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Precio vivienda (€)</label>
                <input type="number" className="input-field" value={datos.precio} onChange={e => set('precio', n(e.target.value))} step={1000} /></div>
              <div><label className="label">Precio escrituración (€)</label>
                <input type="number" className="input-field" value={datos.precioEscrituracion} onChange={e => set('precioEscrituracion', n(e.target.value))} step={1000} />
                <p className="text-[10px] text-gray-400 mt-1">Base para calcular ITP</p></div>
              <div><label className="label">Fondos propios (€)</label>
                <input type="number" className="input-field" value={datos.fondos} onChange={e => set('fondos', n(e.target.value))} step={1000} /></div>
              <div><label className="label">LTV solicitado (%)</label>
                <input type="number" className="input-field" value={datos.precio > 0 ? Math.round((resultado.hipoteca / datos.precio) * 100) : 0} disabled />
                <p className="text-[10px] text-gray-400 mt-1">Máx. 80% sin aval</p></div>
              <div><label className="label">Ingresos titular 1 (€/mes)</label>
                <input type="number" className="input-field" value={datos.ingresos1} onChange={e => set('ingresos1', n(e.target.value))} /></div>
              <div><label className="label">Ingresos titular 2 (€/mes)</label>
                <input type="number" className="input-field" value={datos.ingresos2} onChange={e => set('ingresos2', n(e.target.value))} /></div>
            </div>
          </div>

          {/* Parámetros hipoteca */}
          <div className="card">
            <div className="card-title">Parámetros de la hipoteca</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label">Tipo de hipoteca</label>
                <select
                  className="input-field"
                  value={datos.tipoHipoteca}
                  onChange={e => set('tipoHipoteca', e.target.value as DatosCalculo['tipoHipoteca'])}
                >
                  <option value="fija">Fija</option>
                  <option value="variable">Variable</option>
                  <option value="mixta">Mixta</option>
                </select>
              </div>
              <div>
                <label className="label">TIN anual (%)</label>
                <input type="number" className="input-field" value={datos.tin} onChange={e => set('tin', n(e.target.value))} step={0.05} />
              </div>
            </div>

            {datos.tipoHipoteca !== 'fija' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="label">Euríbor actual (%)</label>
                  <input type="number" className="input-field" value={datos.euribor} onChange={e => set('euribor', n(e.target.value))} step={0.001} /></div>
                <div><label className="label">Diferencial (%)</label>
                  <input type="number" className="input-field" value={datos.diferencial} onChange={e => set('diferencial', n(e.target.value))} step={0.01} /></div>
              </div>
            )}

            {datos.tipoHipoteca === 'mixta' && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="label">Período fijo (años)</label>
                  <input type="number" className="input-field" value={datos.periodoFijo} onChange={e => set('periodoFijo', n(e.target.value))} /></div>
                <div><label className="label">TIN período fijo (%)</label>
                  <input type="number" className="input-field" value={datos.tinFijo} onChange={e => set('tinFijo', n(e.target.value))} step={0.05} /></div>
              </div>
            )}

            <div>
              <label className="label">Plazo: <span className="text-espai-azul font-bold text-sm">{datos.plazo} años</span></label>
              <input
                type="range" min={5} max={35} value={datos.plazo}
                onChange={e => set('plazo', parseInt(e.target.value))}
                className="w-full accent-espai-naranja cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>5 años</span><span>35 años</span>
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="card">
            <div className="card-title">Gastos de compraventa</div>
            <div className="space-y-2">
              {[
                { label: `ITP (${datos.itp_pct}% s/ precio escrituración)`, value: resultado.itp, readOnly: true },
              ].map(g => (
                <div key={g.label} className="flex justify-between items-center py-1.5 border-b border-espai-gris-borde">
                  <span className="text-sm text-gray-600">
                    ITP (<input type="number" className="w-10 text-center border border-espai-gris-borde rounded text-xs py-0.5" value={datos.itp_pct} onChange={e => set('itp_pct', n(e.target.value))} step={0.5} />% s/ escrituración)
                  </span>
                  <span className="font-semibold text-espai-azul">{fmt(resultado.itp)}</span>
                </div>
              ))}
              {[
                { key: 'gasto_tasacion' as const, label: 'Tasación bancaria' },
                { key: 'gasto_notaria' as const, label: 'Notaría' },
                { key: 'gasto_registro' as const, label: 'Registro Propiedad' },
                { key: 'gasto_gestoria' as const, label: 'Gestoría' },
                { key: 'gasto_espai' as const, label: 'Comisión Espai Finance' },
                { key: 'gasto_otros' as const, label: 'Otros' },
              ].map(g => (
                <div key={g.key} className="flex justify-between items-center py-1.5 border-b border-espai-gris-borde last:border-0">
                  <span className="text-sm text-gray-600">{g.label}</span>
                  <input
                    type="number"
                    value={datos[g.key]}
                    onChange={e => set(g.key, n(e.target.value))}
                    className="w-24 text-right border border-espai-gris-borde rounded px-2 py-1 text-sm font-semibold text-espai-azul focus:outline-none focus:border-espai-naranja"
                  />
                </div>
              ))}

              <div className="pt-3 mt-1 border-t-2 border-espai-gris-borde space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Total gastos</span>
                  <span className="font-semibold text-espai-azul">{fmt(resultado.totalGastos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fondos propios</span>
                  <span className="font-semibold text-espai-azul">{fmt(datos.fondos)}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-1">
                  <span className="text-espai-azul">TOTAL LIQUIDEZ NECESARIA</span>
                  <span className="text-espai-naranja">{fmt(resultado.totalNecesario)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COL DERECHA */}
        <div className="space-y-4">

          {/* Cuota grande */}
          <div className="rounded-xl p-6 text-center" style={{background: 'linear-gradient(135deg, #002F4F, #293C5B)', borderLeft: '5px solid #f58134'}}>
            <div className="text-[11px] uppercase tracking-widest text-white/60 mb-1">Cuota mensual estimada</div>
            <div className="text-5xl font-bold text-espai-naranja my-3">{fmtCuota(resultado.cuota)}</div>
            <div className="text-xs text-white/50">
              {datos.tin}% TIN · {datos.plazo} años · {fmt(resultado.hipoteca)} hipoteca
            </div>
          </div>

          <KpiGrid resultado={resultado} plazo={datos.plazo} />
          <BankTable hipoteca={resultado.hipoteca} ingresosMes={ingresosMes} euribor={datos.euribor} currentTin={datos.tin} />
          <AmortTable hipoteca={resultado.hipoteca} tin={datos.tin} plazo={datos.plazo} />
        </div>
      </div>

      <footer className="text-center py-5 text-xs text-espai-texto-suave border-t border-espai-gris-borde mt-4" style={{borderTopColor: '#f58134', borderTopWidth: 3}}>
        <strong>Espai Finance</strong> · Simulador orientativo · Euríbor 12M: 3,103% (sep. 2026) ·
        No constituye oferta vinculante
      </footer>

      {showSave && resultado && (
        <SaveSimulationModal
          userId={user.id}
          nombreCliente={nombreCliente}
          datos={datos}
          resultado={resultado}
          onClose={() => setShowSave(false)}
          onSaved={() => { setSavedOk(true); setTimeout(() => setSavedOk(false), 3000) }}
        />
      )}
    </div>
  )
}
