'use client'

import { DatosCalculo, ResultadoCalculo, fmt, fmtPct, fmtCuota, ITP_POR_CCAA, EURIBOR_ACTUAL, EURIBOR_MES, BANCOS_PRESET, pmt, brutoAnualANetoMensual } from '@/lib/finance'

interface Props {
  datos: DatosCalculo
  resultado: ResultadoCalculo
  nombreCliente: string
  fecha: string
}

export default function PdfView({ datos, resultado, nombreCliente, fecha }: Props) {
  const ingresosMes = datos.titulares.reduce((sum, t) => sum + brutoAnualANetoMensual(t.brutoAnual), 0)
  const ccaaNombre = ITP_POR_CCAA[datos.ccaa]?.nombre ?? datos.ccaa

  const tipoLabel: Record<string, string> = {
    fija: 'Fija', variable: 'Variable', mixta: 'Mixta'
  }
  const contratoLabel: Record<string, string> = {
    fijo: 'Asalariado fijo', autonomo: 'Autónomo', temporal: 'Temporal', pensionista: 'Pensionista'
  }

  const titularesResumen = datos.titulares.length === 1
    ? `${datos.titulares[0].nombre || 'Titular'}: ${fmt(brutoAnualANetoMensual(datos.titulares[0].brutoAnual))}/mes netos (bruto: ${fmt(datos.titulares[0].brutoAnual)}/año)`
    : `${datos.titulares.length} titulares · Ingresos válidos: ${fmt(resultado.ingresosValidos)}/mes`

  const kpis = [
    { label: 'Capital hipoteca', value: fmt(resultado.hipoteca) },
    { label: 'LTV', value: fmtPct(resultado.ltv), alert: resultado.ltv > 80 },
    { label: 'Esfuerzo real', value: fmtPct(resultado.esfuerzoReal), alert: resultado.esfuerzoReal > 35 },
    { label: 'Total intereses', value: fmt(resultado.totalIntereses) },
    { label: 'Total pagado', value: fmt(resultado.totalPagado) },
    { label: 'Tasación mínima', value: fmt(resultado.tasacionMinima) },
  ]

  // Bancos — top 4 más relevantes
  const bancos = BANCOS_PRESET.slice(0, 5).map(banco => {
    const b = banco as any
    const tin = banco.tipo === 'fija' ? banco.tin : datos.euribor + b.dif
    const r = (tin / 100) / 12
    const n = banco.plazo * 12
    const cuota = pmt(r, n, resultado.hipoteca)
    const esf = ingresosMes > 0 ? (cuota / ingresosMes) * 100 : 0
    const totalInt = cuota * n - resultado.hipoteca
    return { nombre: banco.nombre, tipo: banco.tipo, tin: tin.toFixed(2), cuota, esf, totalInt }
  })
  const minInt = Math.min(...bancos.map(b => b.totalInt))

  return (
    <div id="pdf-view" className="pdf-page">
      {/* CABECERA */}
      <div className="pdf-header">
        <div className="pdf-header-left">
          <div className="pdf-logo-text">ESPAI FINANCE</div>
          <div className="pdf-logo-sub">Asesoría Hipotecaria</div>
        </div>
        <div className="pdf-header-right">
          <div className="pdf-doc-title">Simulación Hipotecaria</div>
          {nombreCliente && <div className="pdf-doc-client">{nombreCliente}</div>}
          <div className="pdf-doc-date">{fecha}</div>
        </div>
      </div>

      {/* LÍNEA NARANJA */}
      <div className="pdf-divider" />

      {/* CUOTA DESTACADA */}
      <div className="pdf-cuota-hero">
        <div className="pdf-cuota-main">
          <span className="pdf-cuota-label">Cuota mensual</span>
          <span className="pdf-cuota-value">{fmtCuota(resultado.cuota)}</span>
          {(datos.seguroVida || datos.seguroHogar) && (
            <span className="pdf-cuota-total">+ seguros = <strong>{fmtCuota(resultado.cuotaTotal)}</strong> total</span>
          )}
        </div>
        <div className="pdf-cuota-params">
          <span>{tipoLabel[datos.tipoHipoteca]} · {datos.tin}% TIN · {datos.plazo} años</span>
          <span>{fmt(resultado.hipoteca)} financiado · {ccaaNombre}</span>
          <span>{titularesResumen}</span>
        </div>
      </div>

      {/* BODY — DOS COLUMNAS */}
      <div className="pdf-body">

        {/* COLUMNA IZQUIERDA */}
        <div className="pdf-col">

          {/* KPIs */}
          <div className="pdf-section-title">Indicadores clave</div>
          <div className="pdf-kpi-grid">
            {kpis.map(k => (
              <div key={k.label} className={`pdf-kpi ${k.alert ? 'pdf-kpi-alert' : ''}`}>
                <div className="pdf-kpi-label">{k.label}</div>
                <div className="pdf-kpi-value">{k.value}</div>
              </div>
            ))}
          </div>

          {/* GASTOS */}
          <div className="pdf-section-title" style={{ marginTop: '10px' }}>Gastos de compraventa</div>
          <table className="pdf-table">
            <tbody>
              <tr><td>ITP ({datos.itp_pct}% — {ccaaNombre})</td><td>{fmt(resultado.itp)}</td></tr>
              <tr><td>Tasación</td><td>{fmt(datos.gasto_tasacion)}</td></tr>
              <tr><td>Notaría</td><td>{fmt(datos.gasto_notaria)}</td></tr>
              <tr><td>Registro</td><td>{fmt(datos.gasto_registro)}</td></tr>
              <tr><td>Gestoría</td><td>{fmt(datos.gasto_gestoria)}</td></tr>
              {datos.gasto_espai > 0 && <tr><td>Espai Finance</td><td>{fmt(datos.gasto_espai)}</td></tr>}
              {(datos.gastosExtra ?? []).filter(g => g.importe > 0).map((g, i) => (
                <tr key={i}><td>{g.label || 'Otros'}</td><td>{fmt(g.importe)}</td></tr>
              ))}
              <tr className="pdf-table-total"><td>Total gastos</td><td>{fmt(resultado.totalGastos)}</td></tr>
              <tr className="pdf-table-total"><td>Fondos propios</td><td>{fmt(datos.fondos)}</td></tr>
              <tr className="pdf-table-highlight"><td>TOTAL NECESARIO</td><td>{fmt(resultado.totalNecesario)}</td></tr>
            </tbody>
          </table>

          {/* SEGUROS */}
          {(datos.seguroVida > 0 || datos.seguroHogar > 0) && (
            <>
              <div className="pdf-section-title" style={{ marginTop: '10px' }}>Seguros estimados</div>
              <table className="pdf-table">
                <tbody>
                  {datos.seguroVida > 0 && <tr><td>Seguro de vida</td><td>{fmtCuota(datos.seguroVida)}</td></tr>}
                  {datos.seguroHogar > 0 && <tr><td>Seguro hogar</td><td>{fmtCuota(datos.seguroHogar)}</td></tr>}
                  <tr className="pdf-table-highlight"><td>Cuota total real</td><td>{fmtCuota(resultado.cuotaTotal)}</td></tr>
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* COLUMNA DERECHA */}
        <div className="pdf-col">

          {/* COMPARATIVA BANCOS */}
          <div className="pdf-section-title">Comparativa de mercado</div>
          <table className="pdf-table pdf-table-bancos">
            <thead>
              <tr>
                <th>Banco</th>
                <th>Tipo</th>
                <th>TIN</th>
                <th>Cuota</th>
                <th>Esfuerzo</th>
                <th>Intereses</th>
              </tr>
            </thead>
            <tbody>
              {bancos.map(b => (
                <tr key={b.nombre} className={Math.abs(b.totalInt - minInt) < 1 ? 'pdf-table-best' : ''}>
                  <td>{b.nombre}{Math.abs(b.totalInt - minInt) < 1 ? ' ★' : ''}</td>
                  <td>{b.tipo === 'fija' ? 'Fija' : b.tipo === 'variable' ? 'Var.' : 'Mixta'}</td>
                  <td>{b.tin}%</td>
                  <td>{fmtCuota(b.cuota)}</td>
                  <td className={b.esf > 35 ? 'pdf-alert-text' : ''}>{fmtPct(b.esf)}</td>
                  <td>{fmt(b.totalInt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pdf-table-note">★ Opción con menor coste total · Euríbor {EURIBOR_MES}: {EURIBOR_ACTUAL.toFixed(3)}%</div>

          {/* ALERTAS */}
          {resultado.alertaRegulatorio.length > 0 && (
            <>
              <div className="pdf-section-title pdf-section-alert" style={{ marginTop: '10px' }}>Alertas regulatorias</div>
              <div className="pdf-alertas">
                {resultado.alertaRegulatorio.map((a, i) => (
                  <div key={i} className="pdf-alerta-item">⚠ {a}</div>
                ))}
              </div>
            </>
          )}

          {/* MIXTA */}
          {datos.tipoHipoteca === 'mixta' && (
            <>
              <div className="pdf-section-title" style={{ marginTop: '10px' }}>Hipoteca mixta — dos períodos</div>
              <table className="pdf-table">
                <tbody>
                  <tr>
                    <td>Años 1–{datos.periodoFijo} (TIN {datos.tinFijo}% fijo)</td>
                    <td>{fmtCuota(resultado.cuotaMixtaFija)}</td>
                  </tr>
                  <tr>
                    <td>Años {datos.periodoFijo + 1}–{datos.plazo} (Eur+{datos.diferencial}% var.)</td>
                    <td>{fmtCuota(resultado.cuotaMixtaVar)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* PIE */}
      <div className="pdf-footer">
        <div className="pdf-footer-line" />
        <div className="pdf-footer-text">
          <strong>Espai Finance</strong> · Simulación orientativa generada el {fecha} · No constituye oferta vinculante ni asesoramiento financiero regulado ·
          Tipos de interés orientativos sujetos a cambio · ITP según CCAA ({ccaaNombre} {datos.itp_pct}%) ·
          Euríbor 12M ({EURIBOR_MES}): {EURIBOR_ACTUAL.toFixed(3)}%
        </div>
      </div>
    </div>
  )
}
