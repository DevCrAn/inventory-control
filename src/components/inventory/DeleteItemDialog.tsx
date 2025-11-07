'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface DeleteItemDialogProps {
  itemId: string
  itemName: string
  redirectAfterDelete?: boolean
}

export function DeleteItemDialog({ 
  itemId, 
  itemName, 
  redirectAfterDelete = false 
}: DeleteItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No estás autenticado')
      }

      // Verificar si el item tiene movimientos
      const { count } = await supabase
        .from('inventory_movements')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)

      if (count && count > 0) {
        toast.error(`No se puede eliminar. El item tiene ${count} movimientos registrados.`)
        setLoading(false)
        return
      }

      // Soft delete
      const { error } = await supabase
        .from('items')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          is_active: false,
        })
        .eq('id', itemId)

      if (error) throw error

      toast.success('Item eliminado exitosamente')
      setOpen(false)

      if (redirectAfterDelete) {
        router.push('/inventario')
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error al eliminar item:', error)
      toast.error(error.message || 'Error al eliminar el item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará el item <strong>"{itemName}"</strong> del inventario.
            <br /><br />
            <strong>Nota:</strong> Esta es una eliminación lógica. 
            El item no se eliminará permanentemente y podrá ser restaurado si es necesario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar Item'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}