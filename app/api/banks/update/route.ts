import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { banco_id, mes, tipo, tin, tae, diferencial, tin_fijo, periodo_fijo, plazo, notas } = body

  if (!banco_id || !mes || !tipo) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabase
    .from('bank_rates')
    .upsert({
      banco_id,
      mes,
      tipo,
      tin: tin || null,
      tae: tae || null,
      diferencial: diferencial || null,
      tin_fijo: tin_fijo || null,
      periodo_fijo: periodo_fijo || null,
      plazo: plazo || 30,
      notas: notas || null,
      fuente: 'manual',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'banco_id,mes,tipo' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
