import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <FileText className="h-24 w-24 text-gray-300 mb-6" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Página No Encontrada</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        La página de reportes que buscas no existe.
      </p>
      <Link href="/reportes">
        <Button>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Reportes
        </Button>
      </Link>
    </div>
  )
}