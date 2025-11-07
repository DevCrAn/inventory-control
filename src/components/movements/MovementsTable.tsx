'use client'

import { useState } from 'react'
import { 
  Search, 
  Filter,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
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
import { formatCurrency, formatDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface Movement {
  id: string
  type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  unit_cost: number
  total_cost: number
  reason: string
  notes: string | null
  document_url: string | null
  created_at: string
  item: {
    id: string
    code: string
    name: string
    type: 'VEHICLE' | 'PART'
    category: string
  } | null
  user: {
    name: string
    email: string
  } | null
}

interface MovementsTableProps {
  movements: Movement[]
}

export function MovementsTable({ movements }: MovementsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Filtrar movimientos
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.item?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.item?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.user?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || movement.type === typeFilter

    return matchesSearch && matchesType
  })

  // Paginación
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage)

  // Estadísticas
  const stats = {
    total: movements.length,
    entries: movements.filter(m => m.type === 'ENTRY').length,
    exits: movements.filter(m => m.type === 'EXIT').length,
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'ENTRY':
        return {
          label: 'Entrada',
          icon: ArrowUpRight,
          color: 'text-green-600',
          bg: 'bg-green-100',
        }
      case 'EXIT':
        return {
          label: 'Salida',
          icon: ArrowDownRight,
          color: 'text-red-600',
          bg: 'bg-red-100',
        }
      case 'TRANSFER':
        return {
          label: 'Traslado',
          icon: Filter,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
        }
      case 'ADJUSTMENT':
        return {
          label: 'Ajuste',
          icon: Filter,
          color: 'text-purple-600',
          bg: 'bg-purple-100',
        }
      default:
        return {
          label: type,
          icon: Filter,
          color: 'text-gray-600',
          bg: 'bg-gray-100',
        }
    }
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.entries}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Salidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.exits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por item, usuario, motivo..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ENTRY">Entradas</SelectItem>
                <SelectItem value="EXIT">Salidas</SelectItem>
                <SelectItem value="TRANSFER">Traslados</SelectItem>
                <SelectItem value="ADJUSTMENT">Ajustes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {currentMovements.length > 0 ? (
            <>
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Costo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Motivo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Usuario
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {currentMovements.map((movement) => {
                        const typeConfig = getTypeConfig(movement.type)
                        const Icon = typeConfig.icon

                        return (
                        <tr key={movement.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                                <div className={cn('p-1.5 rounded', typeConfig.bg)}>
                                <Icon className={cn('h-4 w-4', typeConfig.color)} />
                                </div>
                                <span className={cn('text-sm font-medium', typeConfig.color)}>
                                {typeConfig.label}
                                </span>
                            </div>
                            </td>
                            <td className="px-4 py-4">
                            {movement.item ? (
                                <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {movement.item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {movement.item.code}
                                </p>
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400">Item eliminado</span>
                            )}
                            </td>
                            <td className="px-4 py-4">
                            <span className={cn(
                                'text-sm font-semibold',
                                movement.type === 'ENTRY' ? 'text-green-600' : 'text-red-600'
                            )}>
                                {movement.type === 'ENTRY' ? '+' : '-'}{movement.quantity}
                            </span>
                            </td>
                            <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(movement.total_cost)}
                            </p>
                            </td>
                            <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">{movement.reason}</p>
                            </td>
                            <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">
                                {movement.user?.name || 'Usuario eliminado'}
                            </p>
                            </td>
                            <td className="px-4 py-4">
                            <p className="text-xs text-gray-500">
                                {formatDateTime(movement.created_at)}
                            </p>
                            </td>
                            <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                                {movement.document_url && (
                                    <a
                                    href={movement.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                >
                                    <Button variant="ghost" size="sm" title="Descargar PDF">
                                    <Download className="h-4 w-4" />
                                    </Button>
                                </a>
                                )}
                            </div>
                            </td>
                        </tr>
                        )
                    })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredMovements.length)} de {filteredMovements.length}
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
              <p className="text-gray-500">No se encontraron movimientos</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}