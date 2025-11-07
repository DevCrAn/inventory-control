# Sistema de Gestión de Inventarios

Sistema web para gestionar inventarios de vehículos y refacciones en México.

## Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: Tailwind CSS + shadcn/ui
- **Gestión de paquetes**: pnpm

## Configuración Inicial

### 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve al SQL Editor y ejecuta el schema de la base de datos
3. Copia las credenciales del proyecto

### 2. Variables de Entorno

Edita `.env.local` con tus credenciales de Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Instalar dependencias
```bash
pnpm install
```

### 4. Ejecutar en desarrollo
```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto
```
src/
├── app/                    # Rutas de Next.js
│   ├── (auth)/            # Páginas de autenticación
│   └── (dashboard)/       # Páginas del dashboard
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── layout/           # Layout components
│   └── inventory/        # Componentes de inventario
├── lib/                   # Lógica compartida
│   ├── supabase/         # Configuración Supabase
│   ├── hooks/            # React hooks personalizados
│   ├── validations/      # Esquemas Zod
│   └── utils/            # Utilidades
└── types/                 # Tipos TypeScript
```

## Scripts Disponibles

- `pnpm dev` - Servidor de desarrollo
- `pnpm build` - Build de producción
- `pnpm start` - Servidor de producción
- `pnpm lint` - Linter ESLint

## Licencia

Propietario - Todos los derechos reservados
