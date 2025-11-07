import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ExitForm } from '@/components/movements/ExitForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SalidaPage() {
  const supabase = await createServerSupabaseClient()

  // Obtener items activos con stock disponible
  const { data: items } = await supabase
    .from('items')
    .select('id, code, name, type, brand, model, category, unit_cost, current_stock, min_stock')
    .is('deleted_at', null)
    .eq('is_active', true)
    .gt('current_stock', 0)  // Solo items con stock
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registrar Salida</h1>
          <p className="text-gray-500 mt-1">
            Registra consumo, venta o traslado de inventario
          </p>
        </div>
      </div>

      {/* Formulario */}
      <ExitForm items={items || []} />
    </div>
  )
}