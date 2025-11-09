'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Shield, 
  ShieldAlert,
  Eye,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Key
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { UserPermissionsDialog } from './UserPermissionsDialog'
import { DeactivateUserDialog } from './DeactivateUserDialog'
import { ResetPasswordDialog } from './ResetPasswordDialog'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  is_active: boolean
  created_at: string
  deleted_at: string | null
  created_by_user?: {
    name: string
    email: string
  } | null
}

interface Permission {
  id: string
  code: string
  name: string
  category: string
  description: string | null
}

interface UsersTableProps {
  users: User[]
  permissions: Permission[]
}

export function UsersTable({ users, permissions }: UsersTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    // Búsqueda por texto
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro por rol
    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    // Filtro por estado
    let matchesStatus = true
    if (statusFilter === 'active') {
      matchesStatus = user.is_active && !user.deleted_at
    } else if (statusFilter === 'inactive') {
      matchesStatus = !user.is_active && !user.deleted_at
    } else if (statusFilter === 'deleted') {
      matchesStatus = user.deleted_at !== null
    }

    return matchesSearch && matchesRole && matchesStatus
  })

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Estadísticas
  const stats = {
    total: users.filter(u => !u.deleted_at).length,
    admins: users.filter(u => u.role === 'ADMIN' && !u.deleted_at).length,
    active: users.filter(u => u.is_active && !u.deleted_at).length,
    inactive: users.filter(u => !u.is_active && !u.deleted_at).length,
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-400">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">Usuario</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="deleted">Eliminados</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Tabla */}
          {currentUsers.length > 0 ? (
            <>
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Creado
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <Badge 
                              variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                              className="flex items-center gap-1 w-fit"
                            >
                              {user.role === 'ADMIN' ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <ShieldAlert className="h-3 w-3" />
                              )}
                              {user.role}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            {user.deleted_at ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <UserX className="h-3 w-3" />
                                Eliminado
                              </Badge>
                            ) : user.is_active ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1 w-fit">
                                <UserCheck className="h-3 w-3" />
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <UserX className="h-3 w-3" />
                                Inactivo
                              </Badge>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                {formatDate(user.created_at)}
                              </p>
                              {user.created_by_user && (
                                <p className="text-xs text-gray-500">
                                  por {user.created_by_user.name}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {!user.deleted_at && (
                                <>
                                  <UserPermissionsDialog 
                                    userId={user.id}
                                    userName={user.name}
                                    permissions={permissions}
                                  />
                                  
                                  <Link href={`/usuarios/${user.id}/editar`}>
                                    <Button variant="ghost" size="sm" title="Editar">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>

                                  <ResetPasswordDialog
                                    userId={user.id}
                                    userName={user.name}
                                  />

                                  <DeactivateUserDialog
                                    userId={user.id}
                                    userName={user.name}
                                    isActive={user.is_active}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}