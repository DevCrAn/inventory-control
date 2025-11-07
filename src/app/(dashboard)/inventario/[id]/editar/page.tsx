import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ItemForm } from '@/components/inventory/ItemForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// ← CAMBIO: params es Promise
export default async function EditarItemPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // ← Await params
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Obtener item
  const { data: item, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !item) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/inventario/${item.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Item</h1>
          <p className="text-gray-500 mt-1">
            {item.name} ({item.code})
          </p>
        </div>
      </div>

      {/* Formulario con datos precargados */}
      <ItemForm 
        initialData={{
          id: item.id,
          type: item.type,
          code: item.code,
          name: item.name,
          description: item.description,
          brand: item.brand,
          model: item.model,
          year: item.year,
          category: item.category,
          unit_cost: item.unit_cost,
          min_stock: item.min_stock,
          location: item.location,
        }}
        isEditing={true}
      />
    </div>
  )
}