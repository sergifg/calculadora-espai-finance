import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 3600 // cache 1 hora

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('euribor_historico')
    .select('mes, valor')
    .order('mes', { ascending: true })

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'No data' }, { status: 500 })
  }

  const ultimo = data[data.length - 1]

  return NextResponse.json({
    actual: {
      mes: ultimo.mes,
      valor: Number(ultimo.valor),
    },
    historico: data.map(d => ({
      mes: d.mes,
      valor: Number(d.valor),
    })),
  })
}
