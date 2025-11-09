'use client'

import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Shield, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Permission {
  id: string
  code: string
  name: string
  category: string
  description: string | null
}

interface UserPermissionsDialogProps {
  userId: string
  userName: string
  permissions: Permission[]
}

export function UserPermissionsDialog({ 
  userId, 
  userName, 
  permissions 
}: UserPermissionsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Agrupar permisos por categoría
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const categoryNames: Record<string, string> = {
    inventory: 'Inventario',
    reports: 'Reportes',
    users: 'Usuarios',
    audit: 'Auditoría',
  }

  useEffect(() => {
    if (open) {
      fetchUserPermissions()
    }
  }, [open])

  const fetchUserPermissions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission_id')
        .eq('user_id', userId)
        .is('revoked_at', null)

      if (error) throw error

      setUserPermissions(data.map(p => p.permission_id))
    } catch (error: any) {
      console.error('Error al cargar permisos:', error)
      toast.error('Error al cargar permisos del usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (permissionId: string) => {
    setUserPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSelectAll = (categoryPermissions: Permission[]) => {
    const categoryIds = categoryPermissions.map(p => p.id)
    const allSelected = categoryIds.every(id => userPermissions.includes(id))
    
    if (allSelected) {
      setUserPermissions(prev => prev.filter(id => !categoryIds.includes(id)))
    } else {
      setUserPermissions(prev => [...new Set([...prev, ...categoryIds])])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No estás autenticado')
      }

      // Obtener permisos actuales
      const { data: currentPermissions, error: fetchError } = await supabase
        .from('user_permissions')
        .select('permission_id')
        .eq('user_id', userId)
        .is('revoked_at', null)

      if (fetchError) throw fetchError

      const currentIds = currentPermissions?.map(p => p.permission_id) || []
      
      // Calcular cambios
      const toAdd = userPermissions.filter(id => !currentIds.includes(id))
      const toRevoke = currentIds.filter(id => !userPermissions.includes(id))

      // Agregar nuevos permisos
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(
            toAdd.map(permissionId => ({
              user_id: userId,
              permission_id: permissionId,
              granted_by: user.id,
            }))
          )

        if (insertError) throw insertError
      }

      // Revocar permisos
      if (toRevoke.length > 0) {
        const { error: revokeError } = await supabase
          .from('user_permissions')
          .update({
            revoked_at: new Date().toISOString(),
            revoked_by: user.id,
          })
          .eq('user_id', userId)
          .in('permission_id', toRevoke)
          .is('revoked_at', null)

        if (revokeError) throw revokeError
      }

      toast.success('Permisos actualizados exitosamente')
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error('Error al guardar permisos:', error)
      toast.error(error.message || 'Error al guardar permisos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Gestionar permisos">
          <Shield className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Permisos de {userName}</DialogTitle>
          <DialogDescription>
            Selecciona los permisos que deseas asignar a este usuario
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
              const allSelected = categoryPermissions.every(p => userPermissions.includes(p.id))
              const someSelected = categoryPermissions.some(p => userPermissions.includes(p.id))

              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {categoryNames[category] || category}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {categoryPermissions.length} permisos disponibles
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(categoryPermissions)}
                      >
                        {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={userPermissions.includes(permission.id)}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {permission.name}
                            </label>
                            {permission.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {permission.description}
                              </p>
                            )}
                            <Badge variant="secondary" className="text-xs mt-1">
                              {permission.code}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Total seleccionados:</strong> {userPermissions.length} de {permissions.length} permisos
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}