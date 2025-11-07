#!/bin/bash

echo "🚀 Iniciando setup del Sistema de Inventarios..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Crear proyecto Next.js con TypeScript
echo -e "${BLUE}📦 Creando proyecto Next.js con TypeScript...${NC}"
pnpm create next-app@latest inventario-vehiculos \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd inventario-vehiculos

echo -e "${GREEN}✅ Proyecto Next.js creado${NC}"
echo ""

# 2. Instalar dependencias principales
echo -e "${BLUE}📦 Instalando dependencias principales...${NC}"
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zod react-hook-form @hookform/resolvers
pnpm add @tanstack/react-query
pnpm add @tanstack/react-table
pnpm add date-fns
pnpm add lucide-react
pnpm add react-hot-toast
pnpm add recharts
pnpm add @react-pdf/renderer
pnpm add exceljs

echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# 3. Instalar shadcn/ui
echo -e "${BLUE}🎨 Configurando shadcn/ui...${NC}"
pnpm dlx shadcn-ui@latest init -d

# Instalar componentes básicos de shadcn
echo -e "${BLUE}📦 Instalando componentes shadcn/ui...${NC}"
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add label
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add table
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add dropdown-menu
pnpm dlx shadcn-ui@latest add select
pnpm dlx shadcn-ui@latest add badge
pnpm dlx shadcn-ui@latest add avatar
pnpm dlx shadcn-ui@latest add skeleton
pnpm dlx shadcn-ui@latest add toast
pnpm dlx shadcn-ui@latest add form

echo -e "${GREEN}✅ shadcn/ui configurado${NC}"
echo ""

# 4. Crear estructura de carpetas
echo -e "${BLUE}📁 Creando estructura de carpetas...${NC}"

mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/reset-password
mkdir -p src/app/\(dashboard\)/inventario/nuevo
mkdir -p src/app/\(dashboard\)/inventario/\[id\]
mkdir -p src/app/\(dashboard\)/movimientos/entrada
mkdir -p src/app/\(dashboard\)/movimientos/salida
mkdir -p src/app/\(dashboard\)/reportes
mkdir -p src/app/\(dashboard\)/usuarios
mkdir -p src/app/api/generate-pdf

mkdir -p src/components/layout
mkdir -p src/components/inventory
mkdir -p src/components/movements
mkdir -p src/components/reports
mkdir -p src/components/users
mkdir -p src/components/shared

mkdir -p src/lib/supabase
mkdir -p src/lib/hooks
mkdir -p src/lib/utils
mkdir -p src/lib/pdf
mkdir -p src/lib/excel
mkdir -p src/lib/validations

mkdir -p src/types

echo -e "${GREEN}✅ Estructura de carpetas creada${NC}"
echo ""

# 5. Crear archivo .env.local
echo -e "${BLUE}🔧 Creando archivo .env.local...${NC}"
cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo -e "${GREEN}✅ Archivo .env.local creado${NC}"
echo ""

# 6. Crear archivos base de Supabase
echo -e "${BLUE}📝 Creando archivos de configuración Supabase...${NC}"

# Client
cat > src/lib/supabase/client.ts << 'EOF'
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
EOF

# Server
cat > src/lib/supabase/server.ts << 'EOF'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
EOF

# Middleware
cat > src/lib/supabase/middleware.ts << 'EOF'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
EOF

echo -e "${GREEN}✅ Archivos Supabase creados${NC}"
echo ""

# 7. Crear tipos de base de datos
echo -e "${BLUE}📝 Creando tipos TypeScript...${NC}"

cat > src/types/database.ts << 'EOF'
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'ADMIN' | 'USER'
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'ADMIN' | 'USER'
          is_active?: boolean
          created_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'ADMIN' | 'USER'
          is_active?: boolean
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          type: 'VEHICLE' | 'PART'
          code: string
          name: string
          description: string | null
          brand: string | null
          model: string | null
          year: number | null
          category: string
          unit_cost: number
          current_stock: number
          min_stock: number
          location: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'VEHICLE' | 'PART'
          code: string
          name: string
          description?: string | null
          brand?: string | null
          model?: string | null
          year?: number | null
          category: string
          unit_cost: number
          current_stock?: number
          min_stock?: number
          location: string
          is_active?: boolean
        }
        Update: {
          type?: 'VEHICLE' | 'PART'
          code?: string
          name?: string
          description?: string | null
          brand?: string | null
          model?: string | null
          year?: number | null
          category?: string
          unit_cost?: number
          current_stock?: number
          min_stock?: number
          location?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          item_id: string
          type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT'
          quantity: number
          unit_cost: number
          total_cost: number
          lot_number: string | null
          reason: string
          notes: string | null
          document_url: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          item_id: string
          type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT'
          quantity: number
          unit_cost: number
          total_cost: number
          lot_number?: string | null
          reason: string
          notes?: string | null
          document_url?: string | null
          created_by: string
        }
        Update: {
          notes?: string | null
          document_url?: string | null
        }
      }
      permissions: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          category: string
        }
      }
      user_permissions: {
        Row: {
          user_id: string
          permission_id: string
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          user_id: string
          permission_id: string
          granted_by?: string | null
        }
        Delete: {
          user_id: string
          permission_id: string
        }
      }
    }
  }
}
EOF

echo -e "${GREEN}✅ Tipos TypeScript creados${NC}"
echo ""

# 8. Crear hooks personalizados
echo -e "${BLUE}📝 Creando hooks personalizados...${NC}"

# Hook useUser
cat > src/lib/hooks/useUser.ts << 'EOF'
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(data)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => setProfile(data))
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'ADMIN',
    isActive: profile?.is_active ?? false
  }
}
EOF

# Hook usePermissions
cat > src/lib/hooks/usePermissions.ts << 'EOF'
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePermissions(userId: string | undefined) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchPermissions = async () => {
      const { data } = await supabase
        .from('user_permissions')
        .select(`
          permission:permissions (
            code
          )
        `)
        .eq('user_id', userId)

      const codes = data?.map((p: any) => p.permission.code) ?? []
      setPermissions(codes)
      setLoading(false)
    }

    fetchPermissions()
  }, [userId, supabase])

  const hasPermission = (code: string) => permissions.includes(code)
  
  const hasAnyPermission = (codes: string[]) => 
    codes.some(code => permissions.includes(code))

  const hasAllPermissions = (codes: string[]) =>
    codes.every(code => permissions.includes(code))

  return { 
    permissions, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    loading 
  }
}
EOF

echo -e "${GREEN}✅ Hooks personalizados creados${NC}"
echo ""

# 9. Crear middleware de Next.js
echo -e "${BLUE}📝 Creando middleware...${NC}"

cat > src/middleware.ts << 'EOF'
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
EOF

echo -e "${GREEN}✅ Middleware creado${NC}"
echo ""

# 10. Crear esquemas de validación con Zod
echo -e "${BLUE}📝 Creando esquemas de validación...${NC}"

cat > src/lib/validations/auth.ts << 'EOF'
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const newPasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type NewPasswordInput = z.infer<typeof newPasswordSchema>
EOF

cat > src/lib/validations/inventory.ts << 'EOF'
import { z } from 'zod'

export const itemSchema = z.object({
  type: z.enum(['VEHICLE', 'PART']),
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  unit_cost: z.number().positive('El costo debe ser mayor a 0'),
  min_stock: z.number().int().min(0).default(0),
  location: z.string().min(1, 'La ubicación es requerida'),
})

export const movementSchema = z.object({
  item_id: z.string().uuid('Item inválido'),
  type: z.enum(['ENTRY', 'EXIT', 'TRANSFER', 'ADJUSTMENT']),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  unit_cost: z.number().positive('El costo debe ser mayor a 0'),
  lot_number: z.string().optional(),
  reason: z.string().min(1, 'El motivo es requerido'),
  notes: z.string().optional(),
})

export type ItemInput = z.infer<typeof itemSchema>
export type MovementInput = z.infer<typeof movementSchema>
EOF

echo -e "${GREEN}✅ Esquemas de validación creados${NC}"
echo ""

# 11. Crear utilidades
echo -e "${BLUE}📝 Creando utilidades...${NC}"

cat > src/lib/utils/format.ts << 'EOF'
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
EOF

echo -e "${GREEN}✅ Utilidades creadas${NC}"
echo ""

# 12. Actualizar tsconfig.json
echo -e "${BLUE}📝 Actualizando tsconfig.json...${NC}"

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

echo -e "${GREEN}✅ tsconfig.json actualizado${NC}"
echo ""

# 13. Crear .gitignore
echo -e "${BLUE}📝 Creando .gitignore...${NC}"

cat > .gitignore << 'EOF'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# pnpm
pnpm-lock.yaml
EOF

echo -e "${GREEN}✅ .gitignore creado${NC}"
echo ""

# 14. Crear README con instrucciones
echo -e "${BLUE}📝 Creando README.md...${NC}"

cat > README.md << 'EOF'
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
EOF

echo -e "${GREEN}✅ README.md creado${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ ¡Setup completado exitosamente! ✨${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo ""
echo -e "1. ${BLUE}Configurar Supabase:${NC}"
echo "   - Ve a https://supabase.com y crea un proyecto"
echo "   - Ejecuta el schema SQL en el SQL Editor"
echo "   - Configura Storage para el bucket 'documents'"
echo ""
echo -e "2. ${BLUE}Actualizar variables de entorno:${NC}"
echo "   - Edita .env.local con tus credenciales de Supabase"
echo ""
echo -e "3. ${BLUE}Ejecutar el proyecto:${NC}"
echo "   cd inventario-vehiculos"
echo "   pnpm dev"
echo ""
echo -e "${GREEN}🚀 ¡Happy coding!${NC}"
EOF

chmod +x setup.sh

echo -e "${GREEN}✅ Script creado exitosamente${NC}"
echo ""
echo -e "${YELLOW}Para ejecutar el setup, corre:${NC}"
echo -e "${BLUE}./setup.sh${NC}"