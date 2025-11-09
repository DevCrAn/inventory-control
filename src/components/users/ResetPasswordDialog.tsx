'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Loader2, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ResetPasswordDialogProps {
  userId: string
  userName: string
}

export function ResetPasswordDialog({ 
  userId, 
  userName 
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const generateRandomPassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setNewPassword(password)
    setConfirmPassword(password)
    setGeneratedPassword(password)
  }

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      toast.success('Contraseña copiada al portapapeles')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = async () => {
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No estás autenticado')
      }

      // Obtener email del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // En Supabase, necesitamos usar la API de admin para cambiar contraseña
      // Como no tenemos acceso directo a la API de admin desde el cliente,
      // vamos a enviar un email de reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        userData.email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/new`,
        }
      )

      if (resetError) throw resetError

      toast.success('Email de reset enviado exitosamente')
      setOpen(false)
      setNewPassword('')
      setConfirmPassword('')
      setGeneratedPassword(null)
      router.refresh()
    } catch (error: any) {
      console.error('Error al resetear contraseña:', error)
      toast.error(error.message || 'Error al resetear contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Resetear contraseña">
          <Key className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetear Contraseña</DialogTitle>
          <DialogDescription>
            Envía un email de reset de contraseña a {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Se enviará un email al usuario con un enlace para restablecer su contraseña.
              El enlace será válido por 24 horas.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Usuario: <span className="font-normal">{userName}</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleReset} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Enviar Email de Reset
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}