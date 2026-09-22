'use client'

import { useState, useEffect } from 'react'
import AppHeader from '@/components/AppHeader'

interface BancoRate {
  id: string
  banco_id: string
  banco_nombre: string
  mes: string
  tipo: string
  tin: number | null
  tae: number | null
  diferencial: number | null
  tin_fijo: number | null
  periodo_fijo: number | null
  plazo: number
  fuente: string
  notas: string | null
}

const ADMIN_SECRET = 'espai2026cron'

function mesLabel(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export default function AdminPage() {
  const [rates, setRates] = useState<BancoRate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<BancoRate>>({})
  const [filtro, setFiltro] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'err', texto: string } | null>(null)

  async function cargarDatos() {
    setLoading(true)
    const r = await fetch('/api/banks')
    const d = await r.json()
    if (d.bancos) {
      const todos: BancoRate[] = []
      for (const b of d.bancos) {
        for (const h of b.historico) {
          todos.push({ ...h, banco_id: b.banco_id, banco_nombre: b.banco_nombre, tipo: b.tipo, id: `${b.banco_id}_${h.mes}` })
        }
      }
      todos.sort((a, b) => b.mes.localeCompare(a.mes) || a.banco_nombre.localeCompare(b.banco_nombre))
      setRates(todos)
    }
    setLoading(false)
  }

  useEffect(() => { cargarDatos() }, [])

  async function guardar(rate: BancoRate) {
    setSaving(rate.id)
    try {
      const r = await fetch('/api/banks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        setMsg({ tipo: 'ok', texto: 'Guardado correctamente' })
        setEditando(null)
        await cargarDatos()
      } else {
        setMsg({ tipo: 'err', texto: 'Error al guardar' })
      }
    } catch {
      setMsg({ tipo: 'err', texto: 'Error de conexión' })
    }
    setSaving(null)
    setTimeout(() => setMsg(null), 3000)
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/banks/sync', {
        method: 'POST',
        headers: { 'x-cron-secret': ADMIN_SECRET },
      })
      setMsg({ tipo: 'ok', texto: 'Sincronización completada' })
      await cargarDatos()
    } catch {
      setMsg({ tipo: 'err', texto: 'Error en sincronización' })
    }
    setSyncing(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const ratesFiltradas = rates.filter(r => {
    const matchNombre = r.banco_nombre.toLowerCase().includes(filtro.toLowerCase())
    const matchTipo = tipoFiltro ? r.tipo === tipoFiltro : true
    return matchNombre && matchTipo
  })

  // Solo últimos datos de cada banco
  const ultimosMes = rates.filter((r, idx, arr) =>
    arr.findIndex(x => x.banco_id === r.banco_id && x.tipo === r.tipo) === idx
  )

  return (
    <div className="min-h-screen bg-espai-gris">
      <AppHeader />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-espai-azul">Gestión de tipos bancarios</h1>
            <p className="text-sm text-espai-texto-suave mt-1">Edita y actualiza los tipos hipotecarios de cada entidad</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-espai-azul hover:bg-espai-azul-light text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Actualizando...' : 'Sincronizar tipos'}
            </button>
          </div>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.tipo === 'ok' ? '✓' : '✕'} {msg.texto}
          </div>
        )}

        {/* Resumen último mes */}
        <div className="card mb-6">
          <div className="card-title">Tipos actuales por banco</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-espai-azul text-white">
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wide">Banco</th>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wide">Tipo</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wide">TIN</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wide">TAE</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wide">Diferencial</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wide">Mes</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wide">Fuente</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {ultimosMes.map(rate => (
                  <tr key={rate.id} className="border-b border-espai-gris-borde hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-espai-azul">{rate.banco_nombre}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rate.tipo === 'fija' ? 'bg-blue-100 text-blue-700' : rate.tipo === 'variable' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {rate.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{rate.tin ? `${rate.tin.toFixed(2)}%` : '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{rate.tae ? `${rate.tae.toFixed(2)}%` : '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{rate.diferencial ? `+${rate.diferencial.toFixed(2)}%` : '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-400 text-xs">{mesLabel(rate.mes)}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${rate.fuente === 'manual' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {rate.fuente}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => { setEditando(rate.id); setForm({ ...rate }) }}
                        className="text-espai-naranja hover:underline text-xs font-semibold"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal edición */}
        {editando && form && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditando(null) }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, #002F4F, #293C5B)' }}>
                <h3 className="text-white font-bold text-base">{form.banco_nombre}</h3>
                <p className="text-white/50 text-xs">{form.tipo} · {form.mes && mesLabel(form.mes)}</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">TIN (%)</label>
                    <input type="number" step="0.01" className="input-field"
                      value={form.tin ?? ''} onChange={e => setForm(f => ({ ...f, tin: parseFloat(e.target.value) || null }))} />
                  </div>
                  <div>
                    <label className="label">TAE (%)</label>
                    <input type="number" step="0.01" className="input-field"
                      value={form.tae ?? ''} onChange={e => setForm(f => ({ ...f, tae: parseFloat(e.target.value) || null }))} />
                  </div>
                  {form.tipo !== 'fija' && (
                    <div>
                      <label className="label">Diferencial (%)</label>
                      <input type="number" step="0.01" className="input-field"
                        value={form.diferencial ?? ''} onChange={e => setForm(f => ({ ...f, diferencial: parseFloat(e.target.value) || null }))} />
                    </div>
                  )}
                  {form.tipo === 'mixta' && (
                    <div>
                      <label className="label">TIN fijo (%)</label>
                      <input type="number" step="0.01" className="input-field"
                        value={form.tin_fijo ?? ''} onChange={e => setForm(f => ({ ...f, tin_fijo: parseFloat(e.target.value) || null }))} />
                    </div>
                  )}
                  <div>
                    <label className="label">Mes (YYYY-MM-DD)</label>
                    <input type="date" className="input-field"
                      value={form.mes ?? ''} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Fuente</label>
                    <select className="input-field" value={form.fuente ?? 'manual'} onChange={e => setForm(f => ({ ...f, fuente: e.target.value }))}>
                      <option value="manual">Manual (Espai Finance)</option>
                      <option value="scraping">Scraping</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Notas</label>
                  <input type="text" className="input-field" placeholder="Observaciones opcionales..."
                    value={form.notas ?? ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button onClick={() => setEditando(null)} className="btn-secondary text-sm">Cancelar</button>
                <button
                  onClick={() => guardar(rates.find(r => r.id === editando)!)}
                  disabled={saving === editando}
                  className="btn-primary text-sm"
                >
                  {saving === editando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
