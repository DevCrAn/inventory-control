import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ItemsTable } from '@/components/inventory/ItemsTable'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default async function InventarioPage() {
  const supabase = await createServerSupabaseClient()

  // Obtener solo items NO eliminados (deleted_at IS NULL)
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .is('deleted_at', null)  
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 mt-1">
            Gestiona vehículos y refacciones
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/inventario/eliminados">
            <Button variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Papelera
            </Button>
          </Link>
          <Link href="/inventario/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabla de Items */}
      <ItemsTable items={items || []} />
    </div>
  )
}