# Calculadora Hipotecaria · Espai Finance

Herramienta SaaS para asesores hipotecarios de Espai Finance.

## Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Auth + DB:** Supabase (magic link + Postgres)
- **Hosting:** Vercel

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

### 3. Crear base de datos en Supabase
Ejecutar el contenido de `supabase/schema.sql` en el SQL Editor de Supabase.

### 4. Desarrollo local
```bash
npm run dev
# http://localhost:3000
```

### 5. Deploy en Vercel
1. Conectar repo en vercel.com
2. Añadir las variables de entorno en Vercel Dashboard
3. Deploy automático en cada push a `main`

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |

## Configuración de Supabase Auth

En Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `https://tu-dominio.vercel.app`
- **Redirect URLs:** `https://tu-dominio.vercel.app/auth/callback`

## Estructura

```
app/
├── login/          # Pantalla de login con magic link
├── calculadora/    # Calculadora principal
├── dashboard/      # Historial de simulaciones
└── auth/callback/  # Callback de Supabase Auth

components/
├── CalculatorClient.tsx   # Calculadora completa
├── DashboardClient.tsx    # Panel de simulaciones
├── AppHeader.tsx          # Cabecera con nav
├── KpiGrid.tsx            # KPIs con semáforos
├── BankTable.tsx          # Comparativa bancos
├── AmortTable.tsx         # Tabla amortización
└── SaveSimulationModal.tsx # Modal guardar

lib/
├── finance.ts    # Lógica financiera (PMT, LTV, etc.)
├── types.ts      # TypeScript types
└── supabase/     # Clientes Supabase (client, server, middleware)
```
