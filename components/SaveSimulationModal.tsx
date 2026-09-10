'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DatosCalculo, ResultadoCalculo } from '@/lib/finance'

interface Props {
  userId: string
  nombreCliente: string
  datos: DatosCalculo
  resultado: ResultadoCalculo
  onClose: () => void
  onSaved: () => void
}

export default function SaveSimulationModal({ userId, nombreCliente, datos, resultado, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(nombreCliente)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleSave() {
    if (!nombre.trim()) { setError('El nombre del cliente es obligatorio'); return }
    setLoading(true)
    setError('')

    const { error } = await supabase.from('simulations').insert({
      asesor_id: userId,
      nombre_cliente: nombre.trim(),
      datos: datos as unknown as Record<string, unknown>,
      resultado: resultado as unknown as Record<string, unknown>,
      notas: notas.trim() || null,
    })

    if (error) {
      setError('Error al guardar: ' + error.message)
    } else {
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-bold text-espai-azul mb-4">Guardar simulación</h2>

        <div className="space-y-4">
          <div>
            <label className="label">Nombre del cliente *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              placeholder="Nombre Apellidos"
            />
          </div>

          <div>
            <label className="label">Notas internas (opcional)</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Observaciones sobre esta simulación..."
            />
          </div>

          <div className="bg-espai-gris rounded-lg p-3 text-xs text-espai-texto-suave">
            <strong>Resumen:</strong> {nombre || '—'} ·
            Hipoteca {resultado?.hipoteca ? Math.round(resultado.hipoteca).toLocaleString('es-ES') + ' €' : '—'} ·
            Cuota {resultado?.cuota ? resultado.cuota.toFixed(0) + ' €/mes' : '—'}
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Guardando...' : 'Guardar simulación'}
          </button>
        </div>
      </div>
    </div>
  )
}
