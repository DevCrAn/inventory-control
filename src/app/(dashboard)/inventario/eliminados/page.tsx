import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DeletedItemsTable } from '@/components/inventory/DeletedItemsTable'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ItemsEliminadosPage() {
  const supabase = await createServerSupabaseClient()

  // Obtener items eliminados
  const { data: items } = await supabase
    .from('items')
    .select(`
      *,
      deleted_by_user:users!items_deleted_by_fkey(name, email)
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventario">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Items Eliminados</h1>
          <p className="text-gray-500 mt-1">
            Items que han sido eliminados del inventario
          </p>
        </div>
      </div>

      <DeletedItemsTable items={items || []} />
    </div>
  )
}