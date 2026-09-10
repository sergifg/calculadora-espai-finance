export interface Simulation {
  id: string
  asesor_id: string
  nombre_cliente: string
  datos: Record<string, unknown>
  resultado: Record<string, unknown>
  notas: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
}
