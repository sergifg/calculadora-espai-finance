import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: simulations } = await supabase
    .from('simulations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email ?? '' }}
      initialSimulations={simulations ?? []}
    />
  )
}
