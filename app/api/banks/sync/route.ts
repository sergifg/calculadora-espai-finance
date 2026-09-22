import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Aquí irá el scraping con Firecrawl en la siguiente fase
  // Por ahora devuelve OK para que el cron y el botón funcionen
  return NextResponse.json({
    ok: true,
    message: 'Sync manual — scraping automático pendiente de implementar',
    timestamp: new Date().toISOString(),
  })
}
