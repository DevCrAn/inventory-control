'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import { TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react'

interface Movement {
  type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  total_cost: number
  created_at: string
}

interface Item {
  id: string
  name: string
  type: 'VEHICLE' | 'PART'
  category: string
  current_stock: number
  min_stock: number
  unit_cost: number
}

interface ReportsSummaryProps {
  items: Item[]
  movements: Movement[]
}

export function ReportsSummary({ items, movements }: ReportsSummaryProps) {
  // Cálculos generales
  const totalValue = items.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0)
  const totalStock = items.reduce((sum, item) => sum + item.current_stock, 0)
  
  // Movimientos del último mes
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const recentMovements = movements.filter(m => new Date(m.created_at) >= lastMonth)
  
  const entries = recentMovements.filter(m => m.type === 'ENTRY')
  const exits = recentMovements.filter(m => m.type === 'EXIT')
  
  const totalEntries = entries.reduce((sum, m) => sum + m.quantity, 0)
  const totalExits = exits.reduce((sum, m) => sum + m.quantity, 0)
  const valueEntries = entries.reduce((sum, m) => sum + m.total_cost, 0)
  const valueExits = exits.reduce((sum, m) => sum + m.total_cost, 0)

  // Por tipo
  const vehicles = items.filter(i => i.type === 'VEHICLE')
  const parts = items.filter(i => i.type === 'PART')
  
  const vehiclesValue = vehicles.reduce((sum, i) => sum + (i.current_stock * i.unit_cost), 0)
  const partsValue = parts.reduce((sum, i) => sum + (i.current_stock * i.unit_cost), 0)

  // Por categoría
  const categories = items.reduce((acc: any, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        count: 0,
        stock: 0,
        value: 0
      }
    }
    acc[item.category].count += 1
    acc[item.category].stock += item.current_stock
    acc[item.category].value += item.current_stock * item.unit_cost
    return acc
  }, {})

  const topCategories = Object.entries(categories)
    .sort(([, a]: any, [, b]: any) => b.value - a.value)
    .slice(0, 5)

  // Items críticos
  const lowStock = items.filter(i => i.current_stock <= i.min_stock && i.current_stock > 0)
  const outOfStock = items.filter(i => i.current_stock === 0)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Resumen de Inventario */}
      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg">Resumen de Inventario</CardTitle>
          <CardDescription>Estado actual del inventario</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Stock Total</p>
              <p className="text-xl font-bold text-gray-900">{totalStock.toLocaleString('es-MX')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Vehículos</p>
              <p className="text-lg font-bold text-gray-900">{vehicles.length}</p>
              <p className="text-xs text-gray-600">{formatCurrency(vehiclesValue)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Refacciones</p>
              <p className="text-lg font-bold text-gray-900">{parts.length}</p>
              <p className="text-xs text-gray-600">{formatCurrency(partsValue)}</p>
            </div>
          </div>

          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Alertas</p>
              <div className="space-y-1 text-sm">
                {outOfStock.length > 0 && (
                  <p className="text-red-700">• {outOfStock.length} items sin stock</p>
                )}
                {lowStock.length > 0 && (
                  <p className="text-red-700">• {lowStock.length} items con stock bajo</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de Movimientos */}
      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg">Movimientos (Último Mes)</CardTitle>
          <CardDescription>Actividad reciente del inventario</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entradas</p>
                <p className="text-2xl font-bold text-green-600">+{totalEntries}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Valor</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(valueEntries)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Salidas</p>
                <p className="text-2xl font-bold text-red-600">-{totalExits}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Valor</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(valueExits)}</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 mb-2">Balance Neto</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Cantidad</p>
                <p className={`text-xl font-bold ${totalEntries - totalExits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalEntries - totalExits > 0 ? '+' : ''}{totalEntries - totalExits}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Valor</p>
                <p className={`text-xl font-bold ${valueEntries - valueExits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(valueEntries - valueExits)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Total de movimientos</p>
            <p className="text-2xl font-bold text-gray-900">{recentMovements.length}</p>
            <p className="text-xs text-gray-600 mt-1">
              {entries.length} entradas • {exits.length} salidas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Categorías */}
      <Card className="shadow-md border-gray-200 md:col-span-2">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg">Top 5 Categorías por Valor</CardTitle>
          <CardDescription>Categorías con mayor valor en inventario</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {topCategories.map(([category, data]: any, index) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{category}</p>
                    <p className="text-xs text-gray-500">
                      {data.count} items • {data.stock.toLocaleString('es-MX')} unidades
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(data.value)}</p>
                  <Badge variant="secondary" className="mt-1">
                    {((data.value / totalValue) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}