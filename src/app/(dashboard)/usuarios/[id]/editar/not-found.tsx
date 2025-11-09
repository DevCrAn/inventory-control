import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserX, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <UserX className="h-24 w-24 text-gray-300 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Usuario No Encontrado</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        El usuario que buscas no existe o ha sido eliminado.
      </p>
      <Link href="/usuarios">
        <Button>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Usuarios
        </Button>
      </Link>
    </div>
  )
}