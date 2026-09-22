import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 3600

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('bank_rates')
    .select('banco_id, banco_nombre, mes, tipo, tin, tae, diferencial, tin_fijo, periodo_fijo, plazo, fuente')
    .order('mes', { ascending: true })

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'No data' }, { status: 500 })
  }

  // Agrupar por banco_id
  const porBanco: Record<string, any> = {}
  for (const row of data) {
    if (!porBanco[row.banco_id]) {
      porBanco[row.banco_id] = {
        banco_id: row.banco_id,
        banco_nombre: row.banco_nombre,
        tipo: row.tipo,
        historico: [],
        actual: null,
      }
    }
    porBanco[row.banco_id].historico.push({
      mes: row.mes,
      tin: row.tin ? Number(row.tin) : null,
      tae: row.tae ? Number(row.tae) : null,
      diferencial: row.diferencial ? Number(row.diferencial) : null,
      tin_fijo: row.tin_fijo ? Number(row.tin_fijo) : null,
      periodo_fijo: row.periodo_fijo,
      fuente: row.fuente,
    })
  }

  // Último dato de cada banco
  for (const banco of Object.values(porBanco)) {
    banco.actual = banco.historico[banco.historico.length - 1]
  }

  return NextResponse.json({ bancos: Object.values(porBanco) })
}
