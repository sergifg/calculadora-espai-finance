'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import { Simulation, User } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  user: User
  initialSimulations: Simulation[]
}

export default function DashboardClient({ user, initialSimulations }: Props) {
  const [simulations, setSimulations] = useState(initialSimulations)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const filtered = simulations.filter(s =>
    s.nombre_cliente.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta simulación?')) return
    setDeleting(id)
    await supabase.from('simulations').delete().eq('id', id)
    setSimulations(prev => prev.filter(s => s.id !== id))
    setDeleting(null)
  }

  function handleLoad(sim: Simulation) {
    localStorage.setItem('espai_load_simulation', JSON.stringify(sim.datos))
    router.push('/calculadora')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-espai-gris">
      <AppHeader userEmail={user.email} />

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-espai-azul">Mis simulaciones</h2>
            <p className="text-sm text-espai-texto-suave mt-1">{simulations.length} simulaciones guardadas</p>
          </div>
          <button onClick={() => router.push('/calculadora')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva simulación
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre de cliente..."
            className="input-field max-w-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-espai-texto-suave">{search ? 'No hay resultados para esa búsqueda.' : 'Aún no hay simulaciones guardadas.'}</p>
            <button onClick={() => router.push('/calculadora')} className="btn-primary mt-4 mx-auto">
              Crear primera simulación
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((sim) => {
              const res = sim.resultado as any
              const dat = sim.datos as any
              return (
                <div key={sim.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-espai-naranja/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-espai-naranja font-bold text-sm">
                      {sim.nombre_cliente.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-espai-azul truncate">{sim.nombre_cliente}</div>
                    <div className="text-xs text-espai-texto-suave mt-0.5">
                      {formatDate(sim.created_at)} ·
                      Hipoteca {res?.hipoteca ? Math.round(res.hipoteca).toLocaleString('es-ES') + ' €' : '—'} ·
                      Cuota {res?.cuota ? Math.round(res.cuota).toLocaleString('es-ES') + ' €/mes' : '—'} ·
                      TIN {dat?.tin ? dat.tin + '%' : '—'} ·
                      {dat?.plazo ? dat.plazo + ' años' : ''}
                    </div>
                    {sim.notas && <div className="text-xs text-gray-400 mt-0.5 italic truncate">{sim.notas}</div>}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleLoad(sim)}
                      className="text-xs px-3 py-1.5 border border-espai-gris-borde rounded-lg text-espai-azul font-semibold hover:bg-espai-naranja hover:text-white hover:border-espai-naranja transition-colors"
                    >
                      Cargar
                    </button>
                    <button
                      onClick={() => handleDelete(sim.id)}
                      disabled={deleting === sim.id}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                    >
                      {deleting === sim.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
