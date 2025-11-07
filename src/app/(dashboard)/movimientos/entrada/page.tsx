import { createServerSupabaseClient } from '@/lib/supabase/server'
import { EntryForm } from '@/components/movements/EntryForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function EntradaPage() {
  const supabase = await createServerSupabaseClient()

  // Obtener items activos para el selector
  const { data: items } = await supabase
    .from('items')
    .select('id, code, name, type, brand, model, category, unit_cost, current_stock')
    .is('deleted_at', null)
    .eq('is_active', true)
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
          <h1 className="text-3xl font-bold text-gray-900">Registrar Entrada</h1>
          <p className="text-gray-500 mt-1">
            Ingresa nuevas unidades al inventario
          </p>
        </div>
      </div>

      {/* Formulario */}
      <EntryForm items={items || []} />
    </div>
  )
}