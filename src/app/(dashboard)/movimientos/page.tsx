import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MovementsTable } from '@/components/movements/MovementsTable'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Link from 'next/link'

export default async function MovimientosPage() {
  const supabase = await createServerSupabaseClient()

  // Obtener movimientos con items y usuarios
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      item:items(id, code, name, type, category),
      user:users(name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-gray-500 mt-1">
            Historial completo de entradas y salidas
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/movimientos/entrada">
            <Button variant="outline">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Nueva Entrada
            </Button>
          </Link>
          <Link href="/movimientos/salida">
            <Button>
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Nueva Salida
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <MovementsTable movements={movements || []} />
    </div>
  )
}