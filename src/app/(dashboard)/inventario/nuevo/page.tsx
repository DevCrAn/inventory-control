import { ItemForm } from '@/components/inventory/ItemForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NuevoItemPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventario">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Item</h1>
          <p className="text-gray-500 mt-1">
            Registra un nuevo vehículo o refacción en el inventario
          </p>
        </div>
      </div>

      {/* Formulario */}
      <ItemForm />
    </div>
  )
}