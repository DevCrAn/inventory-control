'use client'

import { useState } from 'react'
import { 
  Package, 
  Search, 
  Filter,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Plus
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
import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { DeleteItemDialog } from './DeleteItemDialog'

interface Item {
  id: string
  type: 'VEHICLE' | 'PART'
  code: string
  name: string
  description: string | null
  brand: string | null
  model: string | null
  category: string
  unit_cost: number
  current_stock: number
  min_stock: number
  location: string
  is_active: boolean
}

interface ItemsTableProps {
  items: Item[]
}

export function ItemsTable({ items }: ItemsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtrar items
  const filteredItems = items.filter(item => {
    // Búsqueda por texto
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase())

    // Filtro por tipo
    const matchesType = typeFilter === 'all' || item.type === typeFilter

    // Filtro por stock
    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = item.current_stock <= item.min_stock
    } else if (stockFilter === 'out') {
      matchesStock = item.current_stock === 0
    } else if (stockFilter === 'ok') {
      matchesStock = item.current_stock > item.min_stock
    }

    return matchesSearch && matchesType && matchesStock
  })

  // Paginación
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredItems.slice(startIndex, endIndex)

  // Estadísticas
  const stats = {
    total: items.length,
    vehicles: items.filter(i => i.type === 'VEHICLE').length,
    parts: items.filter(i => i.type === 'PART').length,
    lowStock: items.filter(i => i.current_stock <= i.min_stock).length,
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vehículos</CardDescription>
            <CardTitle className="text-2xl">{stats.vehicles}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Refacciones</CardDescription>
            <CardTitle className="text-2xl">{stats.parts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Stock Bajo</CardDescription>
            <CardTitle className="text-2xl text-warning">{stats.lowStock}</CardTitle>
          </CardHeader>
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
                  placeholder="Buscar por nombre, código, marca..."
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="VEHICLE">Vehículos</SelectItem>
                  <SelectItem value="PART">Refacciones</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="ok">Stock OK</SelectItem>
                  <SelectItem value="low">Stock Bajo</SelectItem>
                  <SelectItem value="out">Sin Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Tabla */}
          {currentItems.length > 0 ? (
            <>
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Costo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((item) => {
                        const isLowStock = item.current_stock <= item.min_stock
                        const isOutOfStock = item.current_stock === 0

                        return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  item.type === 'VEHICLE' ? 'bg-blue-100' : 'bg-purple-100'
                                )}>
                                  <Package className={cn(
                                    "h-4 w-4",
                                    item.type === 'VEHICLE' ? 'text-blue-600' : 'text-purple-600'
                                  )} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {item.code} {item.brand && `• ${item.brand}`}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {item.category}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <Badge variant={item.type === 'VEHICLE' ? 'default' : 'secondary'}>
                                {item.type === 'VEHICLE' ? 'Vehículo' : 'Refacción'}
                              </Badge>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {isOutOfStock && (
                                  <AlertTriangle className="h-4 w-4 text-danger" />
                                )}
                                {isLowStock && !isOutOfStock && (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                )}
                                <div>
                                  <p className={cn(
                                    "text-sm font-semibold",
                                    isOutOfStock ? 'text-danger' : isLowStock ? 'text-warning' : 'text-gray-900'
                                  )}>
                                    {item.current_stock}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Min: {item.min_stock}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm text-gray-900">{item.location}</p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.unit_cost)}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link href={`/inventario/${item.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/inventario/${item.id}/editar`}>
                                  <Button variant="ghost" size="sm">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <DeleteItemDialog 
                                  itemId={item.id}
                                  itemName={item.name}
                                />
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
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredItems.length)} de {filteredItems.length} items
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
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
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
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No se encontraron items
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || typeFilter !== 'all' || stockFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer item al inventario'}
              </p>
              {!searchTerm && typeFilter === 'all' && stockFilter === 'all' && (
                <Link href="/inventario/nuevo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Item
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}