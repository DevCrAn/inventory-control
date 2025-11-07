import { createServerSupabaseClient } from '@/lib/supabase/server'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  // Obtener estadísticas dinámicas
  const today = new Date()
  today.setHours(0, 0, 0, 0)

// src/app/(dashboard)/(root)/page.tsx
// En la línea donde se obtienen los items, agregar el filtro:

const [
  { count: totalItems },
  { data: allItems },
  { count: movementsToday },
  { data: recentMovements },
  { data: topItems }
] = await Promise.all([
  // Solo contar items activos
  supabase.from('items')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null),  
    
  // Solo items no eliminados
  supabase.from('items')
    .select('current_stock, min_stock, unit_cost')
    .is('deleted_at', null),  
    
  // Movimientos de hoy
  supabase.from('inventory_movements')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString()),
    
  // Movimientos recientes
  supabase.from('inventory_movements')
    .select('id, type, quantity, total_cost, created_at, item:items(name, code), user:users(name)')
    .order('created_at', { ascending: false })
    .limit(5),
    
  // Top items (solo no eliminados)
  supabase.from('items')
    .select('id, name, code, location, current_stock, min_stock')
    .is('deleted_at', null)  
    .order('current_stock', { ascending: false })
    .limit(5)
])
  const lowStockItems = allItems?.filter(
    item => item.current_stock <= item.min_stock
  ).length || 0
  const totalInventoryValue = allItems?.reduce(
    (sum, item) => sum + (item.current_stock * item.unit_cost), 
    0
  ) || 0

  const stats = [
    {
      name: 'Items Totales',
      value: totalItems || 0,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Package,
      href: '/inventario'
    },
    {
      name: 'Stock Bajo',
      value: lowStockItems,
      change: lowStockItems > 0 ? `${lowStockItems} items` : 'Todo OK',
      changeType: lowStockItems > 0 ? 'negative' as const : 'positive' as const,
      icon: AlertTriangle,
      href: '/inventario?filter=low-stock'
    },
    {
      name: 'Movimientos Hoy',
      value: movementsToday || 0,
      change: 'Desde las 00:00',
      changeType: 'positive' as const,
      icon: Activity,
      href: '/movimientos'
    },
    {
      name: 'Valor Inventario',
      value: formatCurrency(totalInventoryValue),
      change: `${totalItems} items`,
      changeType: 'positive' as const,
      icon: TrendingUp,
      href: '/reportes'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Vista general del sistema de inventarios
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/inventario/nuevo">
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Nuevo Item
            </Button>
          </Link>
          <Link href="/movimientos/entrada">
            <Button variant="outline">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Registrar Entrada
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}>
                      {stat.change}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Movimientos Recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Movimientos Recientes</CardTitle>
              <CardDescription>Últimas 5 transacciones registradas</CardDescription>
            </div>
            <Link href="/movimientos">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMovements && recentMovements.length > 0 ? (
                recentMovements.map((movement: any) => (
                  <div key={movement.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {movement.item?.name || 'Item eliminado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.user?.name || 'Usuario'} • {formatDate(movement.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        movement.type === 'ENTRY' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {movement.type === 'ENTRY' ? '+' : '-'}{movement.quantity}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(movement.total_cost)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No hay movimientos registrados
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Items con Mayor Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Items con Mayor Stock</CardTitle>
              <CardDescription>Top 5 items en inventario</CardDescription>
            </div>
            <Link href="/inventario">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topItems && topItems.length > 0 ? (
                topItems.map((item: any) => (
                  <Link key={item.id} href={`/inventario/${item.id}`}>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.code} • {item.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {item.current_stock} uds
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {item.min_stock}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">
                    No hay items registrados
                  </p>
                  <Link href="/inventario/nuevo">
                    <Button size="sm">Crear primer item</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert de stock bajo */}
      {lowStockItems > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <CardTitle className="text-warning">Alerta de Stock Bajo</CardTitle>
              </div>
              <Link href="/inventario?filter=low-stock">
                <Button variant="outline" size="sm">
                  Ver items
                </Button>
              </Link>
            </div>
            <CardDescription>
              Hay {lowStockItems} items con stock por debajo del mínimo establecido
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}