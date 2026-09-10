export interface DatosCalculo {
  precio: number
  precioEscrituracion: number
  fondos: number
  ingresos1: number
  ingresos2: number
  tin: number
  plazo: number
  tipoHipoteca: 'fija' | 'variable' | 'mixta'
  euribor: number
  diferencial?: number
  tinFijo?: number
  periodoFijo?: number
  itp_pct: number
  gasto_tasacion: number
  gasto_notaria: number
  gasto_registro: number
  gasto_gestoria: number
  gasto_espai: number
  gasto_otros: number
}

export interface ResultadoCalculo {
  hipoteca: number
  cuota: number
  ltv: number
  esfuerzo: number
  totalIntereses: number
  totalPagado: number
  tasacionMinima: number
  totalGastos: number
  totalNecesario: number
  itp: number
}

export function pmt(r: number, n: number, P: number): number {
  if (r === 0) return P / n
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function calcular(datos: DatosCalculo): ResultadoCalculo {
  const hipoteca = Math.max(0, datos.precio - datos.fondos)
  const ingresosMes = datos.ingresos1 + datos.ingresos2
  const r = (datos.tin / 100) / 12
  const n = datos.plazo * 12
  const cuota = pmt(r, n, hipoteca)
  const totalPagado = cuota * n
  const totalIntereses = totalPagado - hipoteca
  const ltv = datos.precio > 0 ? (hipoteca / datos.precio) * 100 : 0
  const esfuerzo = ingresosMes > 0 ? (cuota / ingresosMes) * 100 : 0
  const itp = datos.precioEscrituracion * (datos.itp_pct / 100)
  const totalGastos = itp + datos.gasto_tasacion + datos.gasto_notaria +
    datos.gasto_registro + datos.gasto_gestoria + datos.gasto_espai + datos.gasto_otros

  return {
    hipoteca,
    cuota,
    ltv,
    esfuerzo,
    totalIntereses,
    totalPagado,
    tasacionMinima: hipoteca / 0.8,
    totalGastos,
    totalNecesario: datos.fondos + totalGastos,
    itp,
  }
}

export const BANCOS_PRESET = [
  { id: 'caixabank',   nombre: 'CaixaBank',         tipo: 'fija'     as const, tin: 2.55, plazo: 30 },
  { id: 'bbva',        nombre: 'BBVA',               tipo: 'fija'     as const, tin: 2.55, plazo: 30 },
  { id: 'ibercaja',    nombre: 'Ibercaja',           tipo: 'fija'     as const, tin: 2.55, plazo: 25 },
  { id: 'march',       nombre: 'Banca March',        tipo: 'fija'     as const, tin: 2.65, plazo: 30 },
  { id: 'kutxa',       nombre: 'Kutxabank',          tipo: 'variable' as const, dif: 0.49, plazo: 30 },
  { id: 'sabadell_v',  nombre: 'Sabadell Variable',  tipo: 'variable' as const, dif: 0.50, plazo: 30 },
  { id: 'sabadell_m',  nombre: 'Sabadell Mixta 3a',  tipo: 'mixta'    as const, tinFijo: 1.80, dif: 0.70, periodoFijo: 3, plazo: 30 },
  { id: 'pibank',      nombre: 'Pibank Mixta 4a',    tipo: 'mixta'    as const, tinFijo: 1.99, dif: 0.68, periodoFijo: 4, plazo: 30 },
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
