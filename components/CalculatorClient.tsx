'use client'

import { useState, useEffect, useCallback } from 'react'
import AppHeader from '@/components/AppHeader'
import KpiGrid from '@/components/KpiGrid'
import BankTable from '@/components/BankTable'
import AmortTable from '@/components/AmortTable'
import PdfView from '@/components/PdfView'
import {
  calcular, fmt, fmtCuota, DatosCalculo, ResultadoCalculo,
  ITP_POR_CCAA, EURIBOR_ACTUAL, EURIBOR_MES, ESCENARIOS_EURIBOR, pmt
} from '@/lib/finance'

const DEFAULTS: DatosCalculo = {
  precio: 370000,
  precioEscrituracion: 370000,
  fondos: 40000,
  ingresos1: 3500,
  ingresos2: 2415,
  tipoIngresos: 'fijo',
  tin: 2.80,
  plazo: 30,
  tipoHipoteca: 'fija',
  euribor: EURIBOR_ACTUAL,
  diferencial: 0.49,
  tinFijo: 1.85,
  periodoFijo: 3,
  ccaa: 'cataluna',
  itp_pct: ITP_POR_CCAA['cataluna'].pct,
  gasto_tasacion: 700,
  gasto_notaria: 1200,
  gasto_registro: 400,
  gasto_gestoria: 500,
  gasto_espai: 6050,
  gasto_otros: 0,
  seguroVida: 40,
  seguroHogar: 25,
}

export default function CalculatorClient() {
  const [datos, setDatos] = useState<DatosCalculo>(DEFAULTS)
  const [nombreCliente, setNombreCliente] = useState('')
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  const [showAlertas, setShowAlertas] = useState(true)
  const [fecha] = useState(() => new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }))

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

  function handleCcaaChange(ccaa: string) {
    const itp = ITP_POR_CCAA[ccaa]?.pct ?? 8
    setDatos(prev => ({ ...prev, ccaa, itp_pct: itp }))
  }

  if (!resultado) return null

  const tieneAlertas = resultado.alertaRegulatorio.length > 0
  const n30 = datos.plazo * 12
  const cuotaOptimista = pmt((ESCENARIOS_EURIBOR.optimista.valor + datos.diferencial) / 100 / 12, n30, resultado.hipoteca)
  const cuotaPesimista = pmt((ESCENARIOS_EURIBOR.pesimista.valor + datos.diferencial) / 100 / 12, n30, resultado.hipoteca)

  return (
    <>
      {/* Vista normal */}
      <div className="min-h-screen bg-espai-gris no-print">
        <AppHeader euribor={EURIBOR_ACTUAL} />

        {/* Cliente bar */}
        <div className="bg-espai-azul-mid border-b border-white/10">
          <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-4">
            <label className="text-[10px] text-white/60 uppercase tracking-widest whitespace-nowrap">Cliente:</label>
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Nombre del cliente..."
              className="bg-white/10 border border-white/20 text-white placeholder-white/30 px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:border-espai-naranja flex-1 max-w-sm"
            />
            <span className="text-white/30 text-xs hidden sm:block">Aparece en el PDF generado</span>
          </div>
        </div>

        {/* Alertas */}
        {tieneAlertas && showAlertas && (
          <div className="max-w-screen-xl mx-auto px-6 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-red-700 font-bold text-sm mb-1">Alertas regulatorias</p>
                    <ul className="space-y-1">
                      {resultado.alertaRegulatorio.map((alerta, i) => (
                        <li key={i} className="text-red-600 text-xs">· {alerta}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button onClick={() => setShowAlertas(false)} className="text-red-300 hover:text-red-500 text-xs">✕</button>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="max-w-screen-xl mx-auto px-6 pt-4 pb-0 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-espai-texto-suave">
            Euríbor 12M ({EURIBOR_MES}): <strong className="text-espai-naranja">{EURIBOR_ACTUAL.toFixed(3)}%</strong> ·
            Tipos fijos mercado: <strong>2,80% – 2,99%</strong>
            {tieneAlertas && !showAlertas && (
              <button onClick={() => setShowAlertas(true)} className="ml-3 text-red-500 font-semibold hover:underline">⚠ Ver alertas</button>
            )}
          </div>
          <button onClick={() => window.print()} className="btn-primary text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generar PDF
          </button>
        </div>

        <div className="max-w-screen-xl mx-auto px-6 py-4 grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* COL IZQUIERDA */}
          <div className="space-y-4">

            <div className="card">
              <div className="card-title">Datos de la operación</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Precio vivienda (€)</label>
                  <input type="number" className="input-field" value={datos.precio} onChange={e => set('precio', n(e.target.value))} step={1000} />
                </div>
                <div>
                  <label className="label">Precio escrituración (€)</label>
                  <input type="number" className="input-field" value={datos.precioEscrituracion} onChange={e => set('precioEscrituracion', n(e.target.value))} step={1000} />
                  <p className="text-[10px] text-gray-400 mt-1">Base para calcular ITP</p>
                </div>
                <div>
                  <label className="label">Fondos propios (€)</label>
                  <input type="number" className="input-field" value={datos.fondos} onChange={e => set('fondos', n(e.target.value))} step={1000} />
                </div>
                <div>
                  <label className="label">LTV real (%)</label>
                  <input type="number" className="input-field" value={datos.precio > 0 ? Math.round((resultado.hipoteca / datos.precio) * 100) : 0} disabled />
                  <p className={`text-[10px] mt-1 ${resultado.ltv > 80 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                    {resultado.ltv > 80 ? '⚠ Supera 80% — requiere aval' : 'Máx. 80% sin aval'}
                  </p>
                </div>
                <div>
                  <label className="label">Ingresos titular 1 (€/mes)</label>
                  <input type="number" className="input-field" value={datos.ingresos1} onChange={e => set('ingresos1', n(e.target.value))} />
                </div>
                <div>
                  <label className="label">Ingresos titular 2 (€/mes)</label>
                  <input type="number" className="input-field" value={datos.ingresos2} onChange={e => set('ingresos2', n(e.target.value))} />
                </div>
                <div className="col-span-2">
                  <label className="label">Tipo de contrato</label>
                  <select className="input-field" value={datos.tipoIngresos} onChange={e => set('tipoIngresos', e.target.value)}>
                    <option value="fijo">Asalariado contrato fijo (100% ingresos)</option>
                    <option value="autonomo">Autónomo (85% — requiere 2 últimas declaraciones IRPF)</option>
                    <option value="temporal">Contrato temporal / obra (75%)</option>
                    <option value="pensionista">Pensionista (100%)</option>
                  </select>
                  {datos.tipoIngresos !== 'fijo' && (
                    <p className="text-[10px] text-amber-600 mt-1">Ingresos válidos banco: {fmt(resultado.ingresosValidos)}/mes</p>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Parámetros de la hipoteca</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="label">Tipo de hipoteca</label>
                  <select className="input-field" value={datos.tipoHipoteca} onChange={e => set('tipoHipoteca', e.target.value as DatosCalculo['tipoHipoteca'])}>
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
                  <div>
                    <label className="label">Euríbor actual (%)</label>
                    <input type="number" className="input-field" value={datos.euribor} onChange={e => set('euribor', n(e.target.value))} step={0.001} />
                    <p className="text-[10px] text-gray-400 mt-1">Media {EURIBOR_MES}: {EURIBOR_ACTUAL.toFixed(3)}%</p>
                  </div>
                  <div>
                    <label className="label">Diferencial (%)</label>
                    <input type="number" className="input-field" value={datos.diferencial} onChange={e => set('diferencial', n(e.target.value))} step={0.01} />
                  </div>
                </div>
              )}

              {datos.tipoHipoteca === 'mixta' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="label">Período fijo (años)</label>
                    <input type="number" className="input-field" value={datos.periodoFijo} onChange={e => set('periodoFijo', n(e.target.value))} />
                  </div>
                  <div>
                    <label className="label">TIN período fijo (%)</label>
                    <input type="number" className="input-field" value={datos.tinFijo} onChange={e => set('tinFijo', n(e.target.value))} step={0.05} />
                  </div>
                </div>
              )}

              {datos.tipoHipoteca === 'variable' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Escenarios Euríbor</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-[10px] text-green-600 font-semibold">Optimista {ESCENARIOS_EURIBOR.optimista.valor}%</div>
                      <div className="font-bold text-green-700 text-sm">{fmtCuota(cuotaOptimista)}</div>
                    </div>
                    <div className="text-center border-x border-amber-200">
                      <div className="text-[10px] text-amber-600 font-semibold">Actual {datos.euribor.toFixed(3)}%</div>
                      <div className="font-bold text-amber-700 text-sm">{fmtCuota(resultado.cuota)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-red-600 font-semibold">Pesimista {ESCENARIOS_EURIBOR.pesimista.valor}%</div>
                      <div className="font-bold text-red-700 text-sm">{fmtCuota(cuotaPesimista)}</div>
                    </div>
                  </div>
                </div>
              )}

              {datos.tipoHipoteca === 'mixta' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-2">Dos períodos — cuotas distintas</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-gray-500">Años 1–{datos.periodoFijo} ({datos.tinFijo}% fijo)</div>
                      <div className="font-bold text-espai-azul">{fmtCuota(resultado.cuotaMixtaFija)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">Años {datos.periodoFijo + 1}–{datos.plazo} (Eur+{datos.diferencial}%)</div>
                      <div className="font-bold text-orange-700">{fmtCuota(resultado.cuotaMixtaVar)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Plazo: <span className="text-espai-azul font-bold text-sm">{datos.plazo} años</span></label>
                <input type="range" min={5} max={35} value={datos.plazo} onChange={e => set('plazo', parseInt(e.target.value))} className="w-full accent-espai-naranja cursor-pointer mt-1" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>5 años</span><span>35 años</span></div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Seguros vinculados (estimación)</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="label">Seguro de vida (€/mes)</label>
                  <input type="number" className="input-field" value={datos.seguroVida} onChange={e => set('seguroVida', n(e.target.value))} />
                </div>
                <div>
                  <label className="label">Seguro hogar (€/mes)</label>
                  <input type="number" className="input-field" value={datos.seguroHogar} onChange={e => set('seguroHogar', n(e.target.value))} />
                </div>
              </div>
              <div className="bg-espai-gris rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Cuota hipoteca</span><span className="font-semibold">{fmtCuota(resultado.cuota)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-600">+ Seguros</span><span className="font-semibold">{fmtCuota((datos.seguroVida || 0) + (datos.seguroHogar || 0))}</span></div>
                <div className="flex justify-between mt-2 pt-2 border-t border-espai-gris-borde font-bold">
                  <span className="text-espai-azul">CUOTA TOTAL REAL</span>
                  <span className="text-espai-naranja">{fmtCuota(resultado.cuotaTotal)}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Gastos de compraventa</div>
              <div className="mb-3">
                <label className="label">Comunidad Autónoma</label>
                <select className="input-field" value={datos.ccaa} onChange={e => handleCcaaChange(e.target.value)}>
                  {Object.entries(ITP_POR_CCAA).map(([key, val]) => (
                    <option key={key} value={key}>{val.nombre} — ITP {val.pct}%</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-espai-gris-borde">
                  <span className="text-sm text-gray-600">ITP ({datos.itp_pct}% — {ITP_POR_CCAA[datos.ccaa]?.nombre ?? datos.ccaa})</span>
                  <span className="font-semibold text-espai-azul">{fmt(resultado.itp)}</span>
                </div>
                {([
                  { key: 'gasto_tasacion' as const, label: 'Tasación bancaria' },
                  { key: 'gasto_notaria' as const, label: 'Notaría' },
                  { key: 'gasto_registro' as const, label: 'Registro Propiedad' },
                  { key: 'gasto_gestoria' as const, label: 'Gestoría' },
                  { key: 'gasto_espai' as const, label: 'Comisión Espai Finance' },
                  { key: 'gasto_otros' as const, label: 'Otros' },
                ]).map(g => (
                  <div key={g.key} className="flex justify-between items-center py-1.5 border-b border-espai-gris-borde last:border-0">
                    <span className="text-sm text-gray-600">{g.label}</span>
                    <input type="number" value={datos[g.key]} onChange={e => set(g.key, n(e.target.value))}
                      className="w-24 text-right border border-espai-gris-borde rounded px-2 py-1 text-sm font-semibold text-espai-azul focus:outline-none focus:border-espai-naranja" />
                  </div>
                ))}
                <div className="pt-3 mt-1 border-t-2 border-espai-gris-borde space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="font-semibold">Total gastos</span><span className="font-semibold text-espai-azul">{fmt(resultado.totalGastos)}</span></div>
                  <div className="flex justify-between text-sm"><span>Fondos propios</span><span className="font-semibold text-espai-azul">{fmt(datos.fondos)}</span></div>
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
            <div className="rounded-xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #002F4F, #293C5B)', borderLeft: '5px solid #f58134' }}>
              <div className="text-[11px] uppercase tracking-widest text-white/60 mb-1">Cuota mensual hipoteca</div>
              <div className="text-5xl font-bold text-espai-naranja my-2">{fmtCuota(resultado.cuota)}</div>
              {(datos.seguroVida || datos.seguroHogar) ? (
                <div className="text-white/70 text-sm mt-1">
                  + seguros {fmtCuota((datos.seguroVida || 0) + (datos.seguroHogar || 0))} =
                  <span className="text-white font-bold ml-1">{fmtCuota(resultado.cuotaTotal)} total</span>
                </div>
              ) : null}
              <div className="text-xs text-white/40 mt-2">{datos.tin}% TIN · {datos.plazo} años · {fmt(resultado.hipoteca)} hipoteca</div>
            </div>
            <KpiGrid resultado={resultado} plazo={datos.plazo} />
            <BankTable hipoteca={resultado.hipoteca} ingresosMes={datos.ingresos1 + datos.ingresos2} euribor={datos.euribor} currentTin={datos.tin} />
            <AmortTable hipoteca={resultado.hipoteca} tin={datos.tin} plazo={datos.plazo} />
          </div>
        </div>

        <footer className="text-center py-5 text-xs text-espai-texto-suave border-t mt-4" style={{ borderTopColor: '#f58134', borderTopWidth: 3 }}>
          <strong>Espai Finance</strong> · Simulador orientativo · No constituye oferta vinculante · Euríbor {EURIBOR_MES}: {EURIBOR_ACTUAL.toFixed(3)}%
        </footer>
      </div>

      {/* Vista PDF — solo visible al imprimir */}
      <div id="pdf-wrapper">
        <PdfView datos={datos} resultado={resultado} nombreCliente={nombreCliente} fecha={fecha} />
      </div>
    </>
  )
}
