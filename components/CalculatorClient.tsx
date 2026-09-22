'use client'

import { useState, useEffect, useCallback } from 'react'
import AppHeader from '@/components/AppHeader'
import KpiGrid from '@/components/KpiGrid'
import BankTable from '@/components/BankTable'
import AmortTable from '@/components/AmortTable'
import PdfView from '@/components/PdfView'
import {
  calcular, fmt, fmtCuota, DatosCalculo, ResultadoCalculo, Titular,
  ITP_POR_CCAA, EURIBOR_ACTUAL, EURIBOR_MES, ESCENARIOS_EURIBOR, pmt, brutoAnualANetoMensual
} from '@/lib/finance'

const DEFAULTS: DatosCalculo = {
  precio: 370000,
  precioEscrituracion: 370000,
  fondos: 40000,
  tipoVivienda: 'primera',
  ccaa: 'cataluna',
  itp_pct: ITP_POR_CCAA['cataluna'].pct,
  titulares: [
    { nombre: 'Titular 1', brutoAnual: 42000, tipoContrato: 'fijo' }
  ],
  tin: 2.80,
  plazo: 30,
  tipoHipoteca: 'fija',
  euribor: EURIBOR_ACTUAL,
  diferencial: 0.49,
  tinFijo: 1.85,
  periodoFijo: 3,
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
  const [tabActivo, setTabActivo] = useState<'compradores' | 'vivienda' | 'gastos'>('compradores')
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

  function addTitular() {
    if (datos.titulares.length < 3) {
      setDatos(prev => ({
        ...prev,
        titulares: [...prev.titulares, { nombre: `Titular ${prev.titulares.length + 1}`, brutoAnual: 30000, tipoContrato: 'fijo' }]
      }))
    }
  }

  function removeTitular(idx: number) {
    if (datos.titulares.length > 1) {
      setDatos(prev => ({
        ...prev,
        titulares: prev.titulares.filter((_, i) => i !== idx)
      }))
    }
  }

  function updateTitular(idx: number, field: keyof Titular, value: string | number) {
    setDatos(prev => ({
      ...prev,
      titulares: prev.titulares.map((t, i) =>
        i === idx ? { ...t, [field]: value } : t
      )
    }))
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
        <AppHeader />

        {/* Cliente bar */}
        <div className="bg-espai-azul-mid border-b border-white/10">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3">
            <label className="text-[10px] text-white/50 uppercase tracking-widest whitespace-nowrap">
              <span className="hidden sm:inline">Cliente:</span>
              <span className="sm:hidden">👤</span>
            </label>
            <input
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Nombre del cliente (aparece en el PDF)..."
              className="bg-white/10 border border-white/20 text-white placeholder-white/20 px-3 py-1.5 rounded-lg text-sm font-semibold focus:outline-none focus:border-espai-naranja flex-1 max-w-sm"
            />
          </div>
        </div>

        {/* Alertas */}
        {tieneAlertas && showAlertas && (
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-4">
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
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-0 flex items-center justify-between gap-2">
          <div className="text-xs text-espai-texto-suave hidden sm:block">
            Euríbor 12M ({EURIBOR_MES}): <strong className="text-espai-naranja">{EURIBOR_ACTUAL.toFixed(3)}%</strong> ·
            Tipos fijos mercado: <strong>2,80% – 2,99%</strong>
            {tieneAlertas && !showAlertas && (
              <button onClick={() => setShowAlertas(true)} className="ml-3 text-red-500 font-semibold hover:underline">⚠ Ver alertas</button>
            )}
          </div>
          {tieneAlertas && !showAlertas && (
            <button onClick={() => setShowAlertas(true)} className="text-red-500 font-semibold text-xs hover:underline sm:hidden">⚠ Ver alertas</button>
          )}
          <button onClick={() => window.print()} className="btn-primary text-sm ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Generar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>

        {/* Layout principal: en mobile las columnas se apilan, col derecha sube (order) */}
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex flex-col xl:grid xl:grid-cols-2 gap-4">

          {/* COL IZQUIERDA — formularios con tabs (en mobile va debajo, order-2) */}
          <div className="order-2 xl:order-1">
            <div className="card p-0 overflow-hidden">

              {/* Tabs */}
              <div className="flex border-b border-espai-gris-borde">
                {([
                  { key: 'compradores', label: 'Compradores', icon: '👤' },
                  { key: 'vivienda',    label: 'Vivienda',    icon: '🏠' },
                  { key: 'gastos',      label: 'Gastos',      icon: '📋' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setTabActivo(tab.key)}
                    className={`flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
                      tabActivo === tab.key
                        ? 'border-espai-naranja text-espai-naranja bg-white'
                        : 'border-transparent text-espai-texto-suave hover:text-espai-azul bg-gray-50'
                    }`}
                  >
                    <span className="sm:hidden">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-5 space-y-4">

                {/* ── TAB: COMPRADORES ── */}
                {tabActivo === 'compradores' && (
                  <>
                    <div className="space-y-3">
                      {datos.titulares.map((titular, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-espai-naranja">
                              Titular {idx + 1}
                            </span>
                            {datos.titulares.length > 1 && (
                              <button onClick={() => removeTitular(idx)} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-semibold">
                                Eliminar ✕
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="label">Nombre (opcional)</label>
                              <input type="text" className="input-field" placeholder="Ej: María García"
                                value={titular.nombre} onChange={e => updateTitular(idx, 'nombre', e.target.value)} />
                            </div>
                            <div>
                              <label className="label">Salario bruto anual (€)</label>
                              <input type="number" className="input-field" value={titular.brutoAnual}
                                onChange={e => updateTitular(idx, 'brutoAnual', n(e.target.value))} step={1000} />
                              <p className="text-[10px] text-espai-naranja font-semibold mt-1">
                                ≈ {fmt(brutoAnualANetoMensual(titular.brutoAnual))}/mes netos
                              </p>
                            </div>
                            <div>
                              <label className="label">Tipo de contrato</label>
                              <select className="input-field" value={titular.tipoContrato}
                                onChange={e => updateTitular(idx, 'tipoContrato', e.target.value)}>
                                <option value="fijo">Contrato fijo (100%)</option>
                                <option value="autonomo">Autónomo — RETA (85%)</option>
                                <option value="temporal">Temporal / obra (75%)</option>
                                <option value="pensionista">Pensionista (100%)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={addTitular} disabled={datos.titulares.length >= 3}
                      className={`w-full py-2.5 rounded-lg font-semibold text-sm border-2 border-dashed transition-colors ${
                        datos.titulares.length >= 3
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-espai-naranja text-espai-naranja hover:bg-espai-naranja hover:text-white'
                      }`}>
                      + Añadir titular {datos.titulares.length >= 3 ? '(máx. 3)' : ''}
                    </button>

                    <div className="bg-espai-azul/5 border border-espai-azul/20 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-xs text-espai-azul-mid font-semibold">Ingresos válidos banco</span>
                      <span className="text-espai-azul font-bold">{fmt(resultado.ingresosValidos)}/mes</span>
                    </div>
                  </>
                )}

                {/* ── TAB: VIVIENDA ── */}
                {tabActivo === 'vivienda' && (
                  <>
                    {/* Tipo de vivienda */}
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { val: 'primera', label: 'Primera residencia', sub: 'Banco financia hasta 80%' },
                        { val: 'segunda', label: 'Segunda residencia',  sub: 'Banco financia hasta 70%' },
                      ] as const).map(opt => (
                        <button key={opt.val} onClick={() => set('tipoVivienda', opt.val)}
                          className={`rounded-xl p-3 text-left border-2 transition-all ${
                            datos.tipoVivienda === opt.val
                              ? 'border-espai-naranja bg-orange-50'
                              : 'border-espai-gris-borde bg-white hover:border-gray-300'
                          }`}>
                          <div className={`text-xs font-bold mb-0.5 ${datos.tipoVivienda === opt.val ? 'text-espai-naranja' : 'text-espai-azul'}`}>
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-gray-400">{opt.sub}</div>
                        </button>
                      ))}
                    </div>

                    {/* Precios */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Precio de compra (€)</label>
                        <input type="number" className="input-field" value={datos.precio}
                          onChange={e => set('precio', n(e.target.value))} step={1000} />
                        <p className="text-[10px] text-gray-400 mt-1">Precio real de la operación</p>
                      </div>
                      <div>
                        <label className="label">Precio de escritura (€)</label>
                        <input type="number" className="input-field" value={datos.precioEscrituracion}
                          onChange={e => set('precioEscrituracion', n(e.target.value))} step={1000} />
                        <p className="text-[10px] text-gray-400 mt-1">Base para calcular ITP</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Aportación del comprador (€)</label>
                        <input type="number" className="input-field" value={datos.fondos}
                          onChange={e => set('fondos', n(e.target.value))} step={1000} />
                        <p className="text-[10px] text-gray-400 mt-1">Fondos propios disponibles (sin incluir gastos)</p>
                      </div>
                      <div>
                        <label className="label">Comunidad Autónoma</label>
                        <select className="input-field" value={datos.ccaa} onChange={e => handleCcaaChange(e.target.value)}>
                          {Object.entries(ITP_POR_CCAA).map(([key, val]) => (
                            <option key={key} value={key}>{val.nombre} — ITP {val.pct}%</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* KPIs calculados */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        {
                          label: 'Capital hipotecario',
                          value: fmt(resultado.hipoteca),
                          sub: 'Precio − aportación',
                          color: 'neutral',
                        },
                        {
                          label: 'LTV',
                          value: `${resultado.ltv.toFixed(1)}%`,
                          sub: resultado.ltv > (datos.tipoVivienda === 'segunda' ? 70 : 80) ? `⚠ Supera ${datos.tipoVivienda === 'segunda' ? '70' : '80'}%` : '✓ Dentro del límite',
                          color: resultado.ltv > (datos.tipoVivienda === 'segunda' ? 70 : 80) ? 'rojo' : 'verde',
                        },
                        {
                          label: 'Tasación mínima',
                          value: fmt(resultado.tasacionMinima),
                          sub: `Para LTV ${datos.tipoVivienda === 'segunda' ? '70' : '80'}% banco`,
                          color: 'neutral',
                        },
                      ].map(kpi => (
                        <div key={kpi.label} className={`rounded-lg p-2.5 text-center border ${
                          kpi.color === 'rojo' ? 'bg-red-50 border-red-200' :
                          kpi.color === 'verde' ? 'bg-green-50 border-green-200' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1">{kpi.label}</div>
                          <div className={`font-bold text-sm ${
                            kpi.color === 'rojo' ? 'text-red-700' :
                            kpi.color === 'verde' ? 'text-green-700' :
                            'text-espai-azul'
                          }`}>{kpi.value}</div>
                          <div className={`text-[9px] mt-0.5 ${kpi.color === 'rojo' ? 'text-red-500' : kpi.color === 'verde' ? 'text-green-600' : 'text-gray-400'}`}>{kpi.sub}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── TAB: GASTOS ── */}
                {tabActivo === 'gastos' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-espai-gris-borde">
                        <span className="text-sm text-gray-600">ITP ({datos.itp_pct}% — {ITP_POR_CCAA[datos.ccaa]?.nombre ?? datos.ccaa})</span>
                        <span className="font-semibold text-espai-azul">{fmt(resultado.itp)}</span>
                      </div>
                      {([
                        { key: 'gasto_tasacion' as const, label: 'Tasación bancaria' },
                        { key: 'gasto_notaria'  as const, label: 'Notaría' },
                        { key: 'gasto_registro' as const, label: 'Registro de la Propiedad' },
                        { key: 'gasto_gestoria' as const, label: 'Gestoría' },
                        { key: 'gasto_espai'    as const, label: 'Comisión Espai Finance' },
                        { key: 'gasto_otros'    as const, label: 'Otros gastos' },
                      ]).map(g => (
                        <div key={g.key} className="flex justify-between items-center py-2 border-b border-espai-gris-borde last:border-0">
                          <span className="text-sm text-gray-600">{g.label}</span>
                          <input type="number" value={datos[g.key]} onChange={e => set(g.key, n(e.target.value))}
                            className="w-28 text-right border border-espai-gris-borde rounded-lg px-2 py-1.5 text-sm font-semibold text-espai-azul focus:outline-none focus:border-espai-naranja bg-gray-50 focus:bg-white transition-colors" />
                        </div>
                      ))}
                    </div>

                    <div className="bg-espai-azul rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm text-white/70">
                        <span>Fondos propios</span>
                        <span className="font-semibold text-white">{fmt(datos.fondos)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white/70">
                        <span>Total gastos</span>
                        <span className="font-semibold text-white">{fmt(resultado.totalGastos)}</span>
                      </div>
                      <div className="border-t border-white/20 pt-2 flex justify-between items-center">
                        <span className="text-white font-bold text-sm uppercase tracking-wider">Liquidez necesaria</span>
                        <span className="text-espai-naranja font-bold text-xl">{fmt(resultado.totalNecesario)}</span>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Card hipoteca — siempre visible debajo de los tabs */}
            <div className="card mt-4">
              <div className="card-title">Parámetros de la hipoteca</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
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
                      <div className="text-[10px] text-red-600 font-semibond">Pesimista {ESCENARIOS_EURIBOR.pesimista.valor}%</div>
                      <div className="font-bold text-red-700 text-sm">{fmtCuota(cuotaPesimista)}</div>
                    </div>
                  </div>
                </div>
              )}

              {datos.tipoHipoteca === 'mixta' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-2">Dos períodos</p>
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

              <div className="mb-3">
                <label className="label">Plazo: <span className="text-espai-azul font-bold text-sm">{datos.plazo} años</span></label>
                <input type="range" min={5} max={35} value={datos.plazo} onChange={e => set('plazo', parseInt(e.target.value))} className="w-full accent-espai-naranja cursor-pointer mt-1" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>5 años</span><span>35 años</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-espai-gris-borde">
                <div>
                  <label className="label">Seguro de vida (€/mes)</label>
                  <input type="number" className="input-field" value={datos.seguroVida} onChange={e => set('seguroVida', n(e.target.value))} />
                </div>
                <div>
                  <label className="label">Seguro hogar (€/mes)</label>
                  <input type="number" className="input-field" value={datos.seguroHogar} onChange={e => set('seguroHogar', n(e.target.value))} />
                </div>
              </div>
              {(datos.seguroVida > 0 || datos.seguroHogar > 0) && (
                <div className="mt-3 bg-espai-gris rounded-lg p-3 text-sm flex justify-between items-center">
                  <span className="text-gray-500">Cuota hipoteca + seguros</span>
                  <span className="font-bold text-espai-naranja">{fmtCuota(resultado.cuotaTotal)}</span>
                </div>
              )}
            </div>
          </div>

          {/* COL DERECHA — resultados (en mobile va arriba, order-1) */}
          <div className="space-y-4 order-1 xl:order-2">
            <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #002F4F, #293C5B)', borderLeft: '5px solid #f58134' }}>
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Cuota mensual</div>
                    <div className="text-4xl sm:text-5xl font-bold text-espai-naranja leading-none">{fmtCuota(resultado.cuota)}</div>
                    {(datos.seguroVida || datos.seguroHogar) ? (
                      <div className="text-white/60 text-xs mt-1.5">
                        + seguros {fmtCuota((datos.seguroVida || 0) + (datos.seguroHogar || 0))} =
                        <span className="text-white font-bold ml-1">{fmtCuota(resultado.cuotaTotal)}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider">Hipoteca</div>
                    <div className="text-white font-bold text-lg">{fmt(resultado.hipoteca)}</div>
                    <div className="text-white/40 text-[10px] mt-1">{datos.tin}% TIN · {datos.plazo}a</div>
                  </div>
                </div>
              </div>
              {/* Barra de esfuerzo */}
              <div className="px-4 sm:px-6 pb-4">
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                  <span>Esfuerzo mensual</span>
                  <span className={resultado.esfuerzoReal > 35 ? 'text-red-400 font-bold' : resultado.esfuerzoReal > 30 ? 'text-amber-400 font-bold' : 'text-green-400 font-bold'}>
                    {resultado.esfuerzoReal.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${resultado.esfuerzoReal > 35 ? 'bg-red-400' : resultado.esfuerzoReal > 30 ? 'bg-amber-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(resultado.esfuerzoReal, 50) * 2}%` }}
                  />
                </div>
              </div>
              {/* Hint mobile — solo en xs */}
              <div className="xl:hidden bg-white/5 px-4 py-2 text-center">
                <span className="text-white/30 text-[10px]">↓ Ajusta los datos abajo para recalcular</span>
              </div>
            </div>
            <KpiGrid resultado={resultado} plazo={datos.plazo} />
            <BankTable hipoteca={resultado.hipoteca} ingresosMes={resultado.ingresosValidos} euribor={datos.euribor} currentTin={datos.tin} />
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
