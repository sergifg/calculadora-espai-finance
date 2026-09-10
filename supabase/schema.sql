-- ============================================================
-- Calculadora Hipotecaria Espai Finance — Schema v1.0
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de simulaciones
CREATE TABLE IF NOT EXISTS public.simulations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre_cliente text NOT NULL,
  datos        jsonb NOT NULL,    -- inputs de la calculadora
  resultado    jsonb NOT NULL,    -- cuota, LTV, esfuerzo, etc.
  notas        text,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS simulations_asesor_id_idx ON public.simulations(asesor_id);
CREATE INDEX IF NOT EXISTS simulations_created_at_idx ON public.simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS simulations_nombre_cliente_idx ON public.simulations USING gin(to_tsvector('spanish', nombre_cliente));

-- RLS: cada asesor solo ve sus propias simulaciones
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asesores_own_simulations" ON public.simulations
  FOR ALL
  USING (auth.uid() = asesor_id)
  WITH CHECK (auth.uid() = asesor_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.simulations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
