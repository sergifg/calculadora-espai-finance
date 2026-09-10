'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-espai-azul flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-4">
          <img
            src="https://www.espaifinance.com/wp-content/uploads/2023/11/logo-espaifinance-white.webp"
            alt="Espai Finance"
            className="h-10 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {!sent ? (
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-espai-azul">Acceso asesores</h1>
                <p className="text-sm text-espai-texto-suave mt-1">
                  Introduce tu email profesional. Te enviamos un enlace de acceso.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Email profesional</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@espaifinance.com"
                    required
                    className="input-field"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>
              </form>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Acceso restringido a asesores de Espai Finance
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-espai-azul mb-2">Revisa tu email</h2>
              <p className="text-sm text-espai-texto-suave">
                Hemos enviado un enlace de acceso a <strong>{email}</strong>.
                El enlace caduca en 1 hora.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-espai-naranja hover:underline"
              >
                Usar otro email
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center p-4 text-white/30 text-xs">
        Espai Finance · Herramienta interna de asesores
      </footer>
    </div>
  )
}
