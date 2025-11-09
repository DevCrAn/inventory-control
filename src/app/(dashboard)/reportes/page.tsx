import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ReportsFilters } from '@/components/reports/ReportsFilters'
import { ReportsCharts } from '@/components/reports/ReportsCharts'
import { ReportsSummary } from '@/components/reports/ReportsSummary'
import { LowStockAlert } from '@/components/reports/LowStockAlert'
import { FileText, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReportesPage() {
  const supabase = await createServerSupabaseClient()

  // Obtener datos para reportes
  const [
    { data: items },
    { data: movements },
    { data: lowStockItems },
  ] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .is('deleted_at', null),
    supabase
      .from('inventory_movements')
      .select(`
        *,
        item:items(name, code, category, type)
      `)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('items')
      .select('*')
      .is('deleted_at', null)
      .filter('current_stock', 'lte', 'min_stock')
  ])

  // Calcular estadísticas
  const totalValue = items?.reduce((sum, item) => 
    sum + (item.current_stock * item.unit_cost), 0
  ) || 0

  const totalItems = items?.length || 0
  const totalMovements = movements?.length || 0
  const criticalItems = lowStockItems?.length || 0

  // Movimientos del último mes
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const recentMovements = movements?.filter(m => 
    new Date(m.created_at) >= lastMonth
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">
          Análisis y exportación de datos del inventario
        </p>
      </div>

      {/* Resumen ejecutivo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
              }).format(totalValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalItems} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-gray-500 mt-1">
              En inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Movimientos
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMovements.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Último mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Stock Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{criticalItems}</div>
            <p className="text-xs text-gray-500 mt-1">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de stock bajo */}
      {criticalItems > 0 && (
        <LowStockAlert items={lowStockItems || []} />
      )}

      {/* Filtros y exportación */}
      <ReportsFilters />

      {/* Gráficas */}
      <ReportsCharts 
        movements={movements || []} 
        items={items || []}
      />

      {/* Resumen detallado */}
      <ReportsSummary 
        items={items || []} 
        movements={movements || []}
      />
    </div>
  )
}