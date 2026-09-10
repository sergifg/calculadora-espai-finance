import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CalculatorClient from '@/components/CalculatorClient'

export default async function CalculadoraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <CalculatorClient user={{ id: user.id, email: user.email ?? '' }} />
}
