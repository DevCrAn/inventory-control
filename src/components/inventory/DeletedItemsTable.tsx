'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCcw, Loader2, Package, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import toast from 'react-hot-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DeletedItem {
  id: string
  type: 'VEHICLE' | 'PART'
  code: string
  name: string
  category: string
  deleted_at: string
  deleted_by_user?: {
    name: string
    email: string
  }
}

interface DeletedItemsTableProps {
  items: DeletedItem[]
}

export function DeletedItemsTable({ items }: DeletedItemsTableProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleRestore = async (itemId: string) => {
    setRestoringId(itemId)

    try {
      const { error } = await supabase
        .from('items')
        .update({
          deleted_at: null,
          deleted_by: null,
          is_active: true,
        })
        .eq('id', itemId)

      if (error) throw error

      toast.success('Item restaurado exitosamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error al restaurar item:', error)
      toast.error(error.message || 'Error al restaurar el item')
    } finally {
      setRestoringId(null)
    }
  }

  const handlePermanentDelete = async (itemId: string) => {
    setDeletingId(itemId)

    try {
      // Verificar que no tenga movimientos
      const { count } = await supabase
        .from('inventory_movements')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)

      if (count && count > 0) {
        toast.error('No se puede eliminar permanentemente. El item tiene movimientos asociados.')
        setDeletingId(null)
        return
      }

      // Hard delete
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      toast.success('Item eliminado permanentemente')
      router.refresh()
    } catch (error: any) {
      console.error('Error al eliminar permanentemente:', error)
      toast.error(error.message || 'Error al eliminar el item')
    } finally {
      setDeletingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay items eliminados
          </h3>
          <p className="text-sm text-gray-500">
            Los items eliminados aparecerán aquí
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2 bg-white rounded-lg">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {item.type === 'VEHICLE' ? 'Vehículo' : 'Refacción'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Código: {item.code} • Categoría: {item.category}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Eliminado el {formatDate(item.deleted_at)}
                    {item.deleted_by_user && ` por ${item.deleted_by_user.name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(item.id)}
                  disabled={restoringId === item.id || deletingId === item.id}
                >
                  {restoringId === item.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Restaurando...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={restoringId === item.id || deletingId === item.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará <strong>"{item.name}"</strong> de forma permanente.
                        <br /><br />
                        <strong className="text-red-600">⚠️ Esta acción no se puede deshacer.</strong>
                        <br /><br />
                        Solo puedes eliminar permanentemente items que no tengan movimientos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault()
                          handlePermanentDelete(item.id)
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar Permanentemente
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}