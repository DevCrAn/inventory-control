// src/app/(dashboard)/inventario/[id]/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, Pencil, Package, Calendar, User, MapPin, DollarSign, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DeleteItemDialog } from '@/components/inventory/DeleteItemDialog'

// ← CAMBIO IMPORTANTE: params ahora es Promise
export default async function ItemDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // ← Await params
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Obtener item (ahora usando id)
  const { data: item, error } = await supabase
    .from('items')
    .select(`
      *,
      created_by_user:users!items_created_by_fkey(name, email)
    `)
    .eq('id', id)
    .single()

  if (error || !item) {
    notFound()
  }

  // Obtener movimientos recientes del item
  const { data: movements } = await supabase
    .from('inventory_movements')
    .select(`
      *,
      user:users(name)
    `)
    .eq('item_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const isLowStock = item.current_stock <= item.min_stock
  const isOutOfStock = item.current_stock === 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventario">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
              <Badge variant={item.type === 'VEHICLE' ? 'default' : 'secondary'}>
                {item.type === 'VEHICLE' ? 'Vehículo' : 'Refacción'}
              </Badge>
            </div>
            <p className="text-gray-500">Código: {item.code}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/inventario/${item.id}/editar`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <DeleteItemDialog 
            itemId={item.id}
            itemName={item.name}
            redirectAfterDelete={true}
          />
        </div>
      </div>

      {/* Alerta de stock */}
      {isOutOfStock && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sin Stock:</strong> Este item no tiene unidades disponibles
          </AlertDescription>
        </Alert>
      )}

      {isLowStock && !isOutOfStock && (
        <Alert className="border-warning bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            <strong>Stock Bajo:</strong> El stock actual está por debajo del mínimo ({item.min_stock} unidades)
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Detalles */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Descripción</p>
                  <p className="text-gray-900">{item.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {item.brand && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Marca</p>
                    <p className="text-gray-900">{item.brand}</p>
                  </div>
                )}

                {item.model && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Modelo</p>
                    <p className="text-gray-900">{item.model}</p>
                  </div>
                )}

                {item.year && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Año</p>
                    <p className="text-gray-900">{item.year}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Categoría</p>
                  <p className="text-gray-900">{item.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movimientos Recientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Movimientos Recientes</CardTitle>
                  <CardDescription>Últimas 10 transacciones</CardDescription>
                </div>
                <Link href={`/movimientos?item=${item.id}`}>
                  <Button variant="ghost" size="sm">Ver todos</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {movements && movements.length > 0 ? (
                <div className="space-y-3">
                  {movements.map((movement: any) => (
                    <div key={movement.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={movement.type === 'ENTRY' ? 'default' : 'secondary'}>
                            {movement.type === 'ENTRY' ? 'Entrada' : 
                             movement.type === 'EXIT' ? 'Salida' : 
                             movement.type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {movement.type === 'ENTRY' ? '+' : '-'}{movement.quantity} unidades
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {movement.user?.name} • {formatDate(movement.created_at)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{movement.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(movement.total_cost)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay movimientos registrados
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className={`text-4xl font-bold ${
                  isOutOfStock ? 'text-danger' : 
                  isLowStock ? 'text-warning' : 
                  'text-gray-900'
                }`}>
                  {item.current_stock}
                </p>
                <p className="text-sm text-gray-500 mt-1">unidades disponibles</p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Stock mínimo</p>
                  <p className="text-lg font-semibold text-gray-900">{item.min_stock}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Link href={`/movimientos/entrada?item=${item.id}`} className="flex-1">
                  <Button className="w-full" size="sm">Entrada</Button>
                </Link>
                <Link href={`/movimientos/salida?item=${item.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">Salida</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Costo Unitario</p>
                  <p className="text-sm font-semibold">{formatCurrency(item.unit_cost)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Valor Total</p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(item.current_stock * item.unit_cost)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="text-sm font-semibold">{item.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Fecha de Registro</p>
                  <p className="text-sm font-semibold">{formatDate(item.created_at)}</p>
                </div>
              </div>

              {item.created_by_user && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Creado por</p>
                    <p className="text-sm font-semibold">{item.created_by_user.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}