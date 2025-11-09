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
import { UserX, UserCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface DeactivateUserDialogProps {
  userId: string
  userName: string
  isActive: boolean
}

export function DeactivateUserDialog({ 
  userId, 
  userName, 
  isActive 
}: DeactivateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleToggleStatus = async () => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No estás autenticado')
      }

      // Prevenir desactivar al propio usuario
      if (userId === user.id) {
        throw new Error('No puedes desactivar tu propia cuenta')
      }

      // Actualizar estado
      const { error } = await supabase
        .from('users')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      toast.success(
        isActive 
          ? 'Usuario desactivado exitosamente'
          : 'Usuario activado exitosamente'
      )
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Error al cambiar estado:', error)
      toast.error(error.message || 'Error al cambiar estado del usuario')
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
          className={isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
          title={isActive ? 'Desactivar usuario' : 'Activar usuario'}
        >
          {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? '¿Desactivar usuario?' : '¿Activar usuario?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                Estás a punto de desactivar a <strong>{userName}</strong>.
                <br /><br />
                El usuario no podrá iniciar sesión hasta que sea reactivado.
                Esta acción no elimina al usuario ni sus datos.
              </>
            ) : (
              <>
                Estás a punto de activar a <strong>{userName}</strong>.
                <br /><br />
                El usuario podrá iniciar sesión nuevamente con sus credenciales actuales.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleToggleStatus()
            }}
            disabled={loading}
            className={isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              isActive ? 'Desactivar Usuario' : 'Activar Usuario'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}