export interface Titular {
  nombre: string
  brutoAnual: number
  tipoContrato: 'fijo' | 'autonomo' | 'temporal' | 'pensionista'
}

export interface GastoExtra {
  label: string
  importe: number
}

export interface DatosCalculo {
  precio: number
  precioEscrituracion: number
  fondos: number
  tipoVivienda: 'primera' | 'segunda'
  ccaa: string
  itp_pct: number
  titulares: Titular[]
  tin: number
  plazo: number
  tipoHipoteca: 'fija' | 'variable' | 'mixta'
  euribor: number
  diferencial: number
  tinFijo: number
  periodoFijo: number
  gasto_tasacion: number
  gasto_notaria: number
  gasto_registro: number
  gasto_gestoria: number
  gasto_espai: number
  gastosExtra: GastoExtra[]
  seguroVida: number
  seguroHogar: number
}

export interface ResultadoCalculo {
  hipoteca: number
  cuota: number
  cuotaTotal: number
  cuotaMixtaFija: number
  cuotaMixtaVar: number
  ltv: number
  esfuerzo: number
  esfuerzoReal: number
  ingresosValidos: number
  totalIntereses: number
  totalPagado: number
  tasacionMinima: number
  totalGastos: number
  totalNecesario: number
  itp: number
  alertaLtv: 'ok' | 'aviso' | 'critico'
  alertaEsfuerzo: 'ok' | 'aviso' | 'critico'
  alertaRegulatorio: string[]
}

// Coeficiente de ingresos válidos por tipo contrato (criterio bancario)
const COEF_INGRESOS: Record<string, number> = {
  fijo: 1.0,
  autonomo: 0.85,
  temporal: 0.75,
  pensionista: 1.0,
}

// ITP por CCAA (2026)
export const ITP_POR_CCAA: Record<string, { nombre: string; pct: number }> = {
  cataluna:    { nombre: 'Cataluña',           pct: 11 },
  madrid:      { nombre: 'Madrid',             pct: 6  },
  andalucia:   { nombre: 'Andalucía',          pct: 7  },
  valencia:    { nombre: 'Com. Valenciana',    pct: 10 },
  euskadi:     { nombre: 'País Vasco',         pct: 7  },
  navarra:     { nombre: 'Navarra',            pct: 6  },
  galicia:     { nombre: 'Galicia',            pct: 10 },
  aragon:      { nombre: 'Aragón',             pct: 8  },
  castilla_la: { nombre: 'Castilla-La Mancha', pct: 9  },
  castilla_le: { nombre: 'Castilla y León',    pct: 8  },
  asturias:    { nombre: 'Asturias',           pct: 8  },
  cantabria:   { nombre: 'Cantabria',          pct: 10 },
  la_rioja:    { nombre: 'La Rioja',           pct: 7  },
  murcia:      { nombre: 'Murcia',             pct: 8  },
  extremadura: { nombre: 'Extremadura',        pct: 8  },
  baleares:    { nombre: 'Baleares',           pct: 11 },
  canarias:    { nombre: 'Canarias',           pct: 6.5},
}

export function brutoAnualANetoMensual(bruto: number): number {
  const ss = bruto * 0.0635
  const baseIrpf = bruto - ss
  let irpf = 0
  if (baseIrpf <= 12450) irpf = baseIrpf * 0.19
  else if (baseIrpf <= 20200) irpf = 12450 * 0.19 + (baseIrpf - 12450) * 0.24
  else if (baseIrpf <= 35200) irpf = 12450 * 0.19 + 7750 * 0.24 + (baseIrpf - 20200) * 0.30
  else if (baseIrpf <= 60000) irpf = 12450 * 0.19 + 7750 * 0.24 + 15000 * 0.30 + (baseIrpf - 35200) * 0.37
  else if (baseIrpf <= 300000) irpf = 12450 * 0.19 + 7750 * 0.24 + 15000 * 0.30 + 24800 * 0.37 + (baseIrpf - 60000) * 0.45
  else irpf = 12450 * 0.19 + 7750 * 0.24 + 15000 * 0.30 + 24800 * 0.37 + 240000 * 0.45 + (baseIrpf - 300000) * 0.47
  return Math.max(0, (bruto - ss - irpf) / 12)
}

export function pmt(r: number, n: number, P: number): number {
  if (r === 0) return P / n
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function calcular(datos: DatosCalculo): ResultadoCalculo {
  const hipoteca = Math.max(0, datos.precio - datos.fondos)

  // Calcular ingresos por titular
  let ingresosValidos = 0
  let ingresosBrutos = 0
  const alertasAutonomo: string[] = []

  for (const titular of datos.titulares) {
    const netoMensual = brutoAnualANetoMensual(titular.brutoAnual)
    const coef = COEF_INGRESOS[titular.tipoContrato] ?? 1.0
    const ingresoValidoTitular = netoMensual * coef
    ingresosValidos += ingresoValidoTitular
    ingresosBrutos += netoMensual

    if (titular.tipoContrato === 'autonomo') {
      alertasAutonomo.push(`${titular.nombre}: banco computará aprox. ${Math.round(coef * 100)}% de los ingresos declarados. Necesitarás 2 últimas declaraciones de IRPF.`)
    }
  }

  const r = (datos.tin / 100) / 12
  const n = datos.plazo * 12
  const cuota = pmt(r, n, hipoteca)
  const totalPagado = cuota * n
  const totalIntereses = totalPagado - hipoteca
  const ltv = datos.precio > 0 ? (hipoteca / datos.precio) * 100 : 0

  // Cuotas hipoteca mixta (dos períodos reales)
  let cuotaMixtaFija = cuota
  let cuotaMixtaVar = cuota
  if (datos.tipoHipoteca === 'mixta' && datos.periodoFijo > 0) {
    const rFijo = (datos.tinFijo / 100) / 12
    const nFijo = datos.periodoFijo * 12
    const nTotal = datos.plazo * 12
    cuotaMixtaFija = pmt(rFijo, nTotal, hipoteca)

    // Saldo pendiente tras período fijo
    let saldo = hipoteca
    for (let m = 0; m < nFijo; m++) {
      const intM = saldo * rFijo
      saldo -= (cuotaMixtaFija - intM)
    }
    const rVar = ((datos.euribor + datos.diferencial) / 100) / 12
    const nVar = nTotal - nFijo
    cuotaMixtaVar = pmt(rVar, nVar, Math.max(0, saldo))
  }

  // Cuota total con seguros
  const seguros = (datos.seguroVida || 0) + (datos.seguroHogar || 0)
  const cuotaTotal = cuota + seguros

  const esfuerzo = ingresosBrutos > 0 ? (cuota / ingresosBrutos) * 100 : 0
  const esfuerzoReal = ingresosValidos > 0 ? (cuotaTotal / ingresosValidos) * 100 : 0

  const itp = datos.precioEscrituracion * (datos.itp_pct / 100)
  const totalGastosExtra = (datos.gastosExtra ?? []).reduce((s, g) => s + g.importe, 0)
  const totalGastos = itp + datos.gasto_tasacion + datos.gasto_notaria +
    datos.gasto_registro + datos.gasto_gestoria + datos.gasto_espai + totalGastosExtra

  // Alertas regulatorias (Circular 6/2023 Banco de España)
  const alertaRegulatorio: string[] = []
  const esfuerzoMax = ingresosValidos < 3000 ? 35 : 40
  if (esfuerzoReal > esfuerzoMax)
    alertaRegulatorio.push(`Esfuerzo ${esfuerzoReal.toFixed(1)}% supera el límite bancario (${esfuerzoMax}%). Operación con riesgo de denegación.`)
  const ltvMax = datos.tipoVivienda === 'segunda' ? 70 : 80
  if (ltv > ltvMax)
    alertaRegulatorio.push(`LTV ${ltv.toFixed(1)}% supera el ${ltvMax}% (${datos.tipoVivienda === 'segunda' ? 'segunda residencia' : 'primera residencia'}). Requiere aval o mayor aportación.`)
  if (datos.plazo > 30 && datos.precio < 250000)
    alertaRegulatorio.push(`Plazo de ${datos.plazo} años puede ser rechazado para este importe. Los bancos suelen limitar a 25-30 años para hipotecas < 250.000€.`)

  // Añadir alertas autónomo
  alertaRegulatorio.push(...alertasAutonomo)

  return {
    hipoteca,
    cuota,
    cuotaTotal,
    cuotaMixtaFija,
    cuotaMixtaVar,
    ltv,
    esfuerzo,
    esfuerzoReal,
    ingresosValidos,
    totalIntereses,
    totalPagado,
    tasacionMinima: hipoteca / (datos.tipoVivienda === 'segunda' ? 0.70 : 0.80),
    totalGastos,
    totalNecesario: datos.fondos + totalGastos,
    itp,
    alertaLtv: ltv <= ltvMax ? 'ok' : ltv <= ltvMax + 10 ? 'aviso' : 'critico',
    alertaEsfuerzo: esfuerzoReal <= 30 ? 'ok' : esfuerzoReal <= 35 ? 'aviso' : 'critico',
    alertaRegulatorio,
  }
}

// Euríbor 12M — septiembre 2026 (media acumulada mes)
export const EURIBOR_ACTUAL = 2.527
export const EURIBOR_MES = 'septiembre 2026'

// Escenarios Euríbor para hipoteca variable
export const ESCENARIOS_EURIBOR = {
  optimista: { valor: 1.5,  label: 'Optimista (Eur 1.5%)' },
  actual:    { valor: 2.527, label: 'Actual (Eur 2.527%)' },
  pesimista: { valor: 4.5,  label: 'Pesimista (Eur 4.5%)' },
}

export const BANCOS_PRESET = [
  // Fijas
  { id: 'caixabank',      nombre: 'CaixaBank',          tipo: 'fija'     as const, tin: 2.80, plazo: 30, tae: 2.95, comision: 0 },
  { id: 'santander',      nombre: 'Santander',           tipo: 'fija'     as const, tin: 2.85, plazo: 30, tae: 3.00, comision: 0 },
  { id: 'bbva',           nombre: 'BBVA',                tipo: 'fija'     as const, tin: 2.85, plazo: 30, tae: 3.01, comision: 0 },
  { id: 'sabadell',       nombre: 'Sabadell',            tipo: 'fija'     as const, tin: 2.90, plazo: 30, tae: 3.04, comision: 0 },
  { id: 'bankinter',      nombre: 'Bankinter',           tipo: 'fija'     as const, tin: 2.90, plazo: 30, tae: 3.05, comision: 0 },
  { id: 'ibercaja',       nombre: 'Ibercaja',            tipo: 'fija'     as const, tin: 2.95, plazo: 30, tae: 3.10, comision: 0 },
  { id: 'abanca',         nombre: 'Abanca',              tipo: 'fija'     as const, tin: 2.99, plazo: 30, tae: 3.14, comision: 0 },
  { id: 'unicaja',        nombre: 'Unicaja Banco',       tipo: 'fija'     as const, tin: 3.00, plazo: 30, tae: 3.15, comision: 0 },
  { id: 'deutsche',       nombre: 'Deutsche Bank',       tipo: 'fija'     as const, tin: 3.05, plazo: 30, tae: 3.20, comision: 0 },
  // Variables
  { id: 'openbank',       nombre: 'Openbank',            tipo: 'variable' as const, dif: 0.45, plazo: 30, tae: 2.92, comision: 0 },
  { id: 'ing',            nombre: 'ING',                 tipo: 'variable' as const, dif: 0.49, plazo: 30, tae: 2.97, comision: 0 },
  { id: 'kutxabank',      nombre: 'Kutxabank',           tipo: 'variable' as const, dif: 0.49, plazo: 30, tae: 2.97, comision: 0 },
  { id: 'evo',            nombre: 'EVO Banco',           tipo: 'variable' as const, dif: 0.48, plazo: 30, tae: 2.95, comision: 0 },
  { id: 'uci',            nombre: 'UCI',                 tipo: 'variable' as const, dif: 0.65, plazo: 30, tae: 3.12, comision: 0 },
  { id: 'cajamar',        nombre: 'Cajamar',             tipo: 'variable' as const, dif: 0.55, plazo: 30, tae: 3.02, comision: 0 },
  { id: 'triodos',        nombre: 'Triodos Bank',        tipo: 'variable' as const, dif: 0.59, plazo: 30, tae: 3.06, comision: 0 },
  { id: 'targobank',      nombre: 'Targobank',           tipo: 'variable' as const, dif: 0.60, plazo: 30, tae: 3.07, comision: 0 },
  { id: 'caixaenginyers', nombre: "Caixa d'Enginyers",  tipo: 'variable' as const, dif: 0.55, plazo: 30, tae: 3.02, comision: 0 },
  // Mixtas
  { id: 'sabadell_m',     nombre: 'Sabadell Mixta 3a',   tipo: 'mixta'   as const, tinFijo: 1.85, dif: 0.75, periodoFijo: 3,  plazo: 30, tae: 2.88, comision: 0 },
  { id: 'bankinter_m',    nombre: 'Bankinter Mixta 5a',   tipo: 'mixta'   as const, tinFijo: 1.90, dif: 0.70, periodoFijo: 5,  plazo: 30, tae: 2.90, comision: 0 },
  { id: 'caixabank_m',    nombre: 'CaixaBank Mixta 10a',  tipo: 'mixta'   as const, tinFijo: 2.10, dif: 0.65, periodoFijo: 10, plazo: 30, tae: 2.95, comision: 0 },
  { id: 'caixaguissona',  nombre: 'Caixa Guissona Mixta', tipo: 'mixta'   as const, tinFijo: 2.00, dif: 0.60, periodoFijo: 5,  plazo: 30, tae: 2.89, comision: 0 },
] as const

export function generarAmortizacion(hipoteca: number, tinAnual: number, plazoAnios: number) {
  const r = (tinAnual / 100) / 12
  const n = plazoAnios * 12
  const cuota = pmt(r, n, hipoteca)
  let saldo = hipoteca
  const filas = []

  for (let anio = 1; anio <= plazoAnios; anio++) {
    let capAnio = 0, intAnio = 0
    for (let mes = 0; mes < 12; mes++) {
      if (saldo <= 0) break
      const intMes = saldo * r
      const capMes = Math.min(cuota - intMes, saldo)
      intAnio += intMes
      capAnio += capMes
      saldo -= capMes
    }
    filas.push({ anio, cuotaAnual: cuota * 12, capital: capAnio, intereses: intAnio, saldo: Math.max(0, saldo) })
  }
  return filas
}

export function fmt(n: number): string {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n)) + ' €'
}

export function fmtPct(n: number): string {
  return n.toFixed(1) + '%'
}

export function fmtCuota(n: number): string {
  return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €/mes'
}
