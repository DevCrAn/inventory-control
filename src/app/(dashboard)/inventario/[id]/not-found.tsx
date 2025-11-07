import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PackageX, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <PackageX className="h-24 w-24 text-gray-300 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Item No Encontrado</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        El item que buscas no existe o ha sido eliminado del inventario.
      </p>
      <div className="flex gap-3">
        <Link href="/inventario">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Inventario
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline">
            Ir al Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}