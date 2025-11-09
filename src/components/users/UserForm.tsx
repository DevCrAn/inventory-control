'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, UserPlus, Shield, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// Schema de validación
const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  role: z.enum(['ADMIN', 'USER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type UserFormData = z.infer<typeof userSchema>

interface Permission {
  id: string
  code: string
  name: string
  category: string
  description: string | null
}

interface UserFormProps {
  permissions: Permission[]
  initialData?: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'USER'
  }
  isEditing?: boolean
}

export function UserForm({ permissions, initialData, isEditing = false }: UserFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: initialData?.email || '',
      name: initialData?.name || '',
      password: '',
      confirmPassword: '',
      role: initialData?.role || 'USER',
    },
  })

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

  const selectedRole = watch('role')

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSelectAll = (categoryPermissions: Permission[]) => {
    const categoryIds = categoryPermissions.map(p => p.id)
    const allSelected = categoryIds.every(id => selectedPermissions.includes(id))
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryIds.includes(id)))
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryIds])])
    }
  }

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        throw new Error('No estás autenticado')
      }

      if (isEditing && initialData) {
        // Modo edición: solo actualizar datos básicos
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: data.name,
            role: data.role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id)

        if (updateError) throw updateError

        toast.success('Usuario actualizado exitosamente')
        router.push('/usuarios')
      } else {
        // Modo creación: crear usuario en Auth y en tabla users
        
        // 1. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name: data.name,
            }
          }
        })

        if (authError) {
          if (authError.message.includes('already registered')) {
            throw new Error('Este email ya está registrado')
          }
          throw authError
        }

        if (!authData.user) {
          throw new Error('Error al crear usuario')
        }

        // 2. Crear perfil en tabla users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            name: data.name,
            role: data.role,
            is_active: true,
            created_by: currentUser.id,
          })

        if (profileError) throw profileError

        // 3. Asignar permisos seleccionados
        if (selectedPermissions.length > 0) {
          const { error: permissionsError } = await supabase
            .from('user_permissions')
            .insert(
              selectedPermissions.map(permissionId => ({
                user_id: authData.user.id,
                permission_id: permissionId,
                granted_by: currentUser.id,
              }))
            )

          if (permissionsError) throw permissionsError
        }

        toast.success('Usuario creado exitosamente')
        router.push('/usuarios')
      }

      router.refresh()
    } catch (error: any) {
      console.error('Error al guardar usuario:', error)
      toast.error(error.message || 'Error al guardar el usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información Básica */}
      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg">Información del Usuario</CardTitle>
          <CardDescription>
            Datos básicos de la cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="usuario@empresa.com"
                className={`bg-gray-50 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isEditing}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500">
                  El email no puede ser modificado
                </p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="John Doe"
                className={`bg-gray-50 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Contraseñas (solo en creación) */}
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  className={`bg-gray-50 ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="••••••••"
                  className={`bg-gray-50 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Rol */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('role')}
              onValueChange={(value: 'ADMIN' | 'USER') => setValue('role', value)}
            >
              <SelectTrigger className={`bg-gray-50 ${errors.role ? 'border-red-500' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>Usuario</span>
                  </div>
                </SelectItem>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Administrador</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {selectedRole === 'ADMIN' 
                ? 'Los administradores tienen acceso total al sistema'
                : 'Los usuarios requieren permisos específicos para cada función'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permisos (solo en creación y si no es admin) */}
      {!isEditing && selectedRole === 'USER' && (
        <Card className="shadow-md border-gray-200">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-lg">Permisos del Usuario</CardTitle>
            <CardDescription>
              Selecciona los permisos que tendrá este usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Los permisos pueden ser modificados posteriormente desde la gestión de usuarios
              </AlertDescription>
            </Alert>

            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
              const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p.id))

              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {categoryNames[category] || category}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {categoryPermissions.length} permisos
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(categoryPermissions)}
                      >
                        {allSelected ? 'Deseleccionar' : 'Seleccionar todo'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission.name}
                            </label>
                            {permission.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Permisos seleccionados:</strong> {selectedPermissions.length} de {permissions.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedRole === 'ADMIN' && !isEditing && (
        <Alert className="border-primary bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Los administradores tienen acceso automático a todas las funciones del sistema.
            No es necesario asignar permisos individuales.
          </AlertDescription>
        </Alert>
      )}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Actualizar Usuario
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}