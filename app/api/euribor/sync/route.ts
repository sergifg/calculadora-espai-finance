import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Protección simple: solo Vercel Cron o llamada con secret pueden ejecutar esto
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true // sin secret configurado, permitir (dev)
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${cronSecret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // FRED API — serie EURIBOR12MD (Euríbor 12M mensual)
  // Devuelve los últimos 3 meses para asegurarnos de tener el más reciente
  const fredUrl = [
    'https://api.stlouisfed.org/fred/series/observations',
    '?series_id=EURIBOR12MD',
    '&api_key=', process.env.FRED_API_KEY,
    '&file_type=json',
    '&frequency=m',         // mensual
    '&aggregation_method=avg',
    '&sort_order=desc',
    '&limit=3',
    '&observation_start=2020-01-01',
  ].join('')

  let inserted = 0
  let skipped = 0

  try {
    const res = await fetch(fredUrl)
    if (!res.ok) throw new Error(`FRED error: ${res.status}`)

    const json = await res.json()
    const observations: { date: string; value: string }[] = json.observations ?? []

    for (const obs of observations) {
      if (obs.value === '.' || obs.value === '') continue // dato no disponible

      const mes = obs.date // ya viene como YYYY-MM-DD (día 1 del mes)
      const valor = parseFloat(obs.value)

      const { error } = await supabase
        .from('euribor_historico')
        .insert({ mes, valor, fuente: 'FRED' })

      if (error) {
        if (error.code === '23505') skipped++ // duplicate key — ya existe
        else throw error
      } else {
        inserted++
      }
    }

    return NextResponse.json({
      ok: true,
      inserted,
      skipped,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
