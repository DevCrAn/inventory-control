'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

interface Movement {
  id: string
  type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  total_cost: number
  created_at: string
  item: {
    name: string
    code: string
    category: string
    type: 'VEHICLE' | 'PART'
  } | null
}

interface Item {
  id: string
  name: string
  type: 'VEHICLE' | 'PART'
  category: string
  current_stock: number
  unit_cost: number
}

interface ReportsChartsProps {
  movements: Movement[]
  items: Item[]
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

export function ReportsCharts({ movements, items }: ReportsChartsProps) {
  // Preparar datos: Movimientos por mes (últimos 6 meses)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return date
  }).reverse()

  const monthlyData = last6Months.map(date => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthMovements = movements.filter(m => {
      const mDate = new Date(m.created_at)
      return mDate >= monthStart && mDate <= monthEnd
    })

    const entries = monthMovements.filter(m => m.type === 'ENTRY')
    const exits = monthMovements.filter(m => m.type === 'EXIT')

    return {
      mes: date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
      entradas: entries.reduce((sum, m) => sum + m.quantity, 0),
      salidas: exits.reduce((sum, m) => sum + m.quantity, 0),
      valorEntradas: entries.reduce((sum, m) => sum + m.total_cost, 0),
      valorSalidas: exits.reduce((sum, m) => sum + m.total_cost, 0),
    }
  })

  // Datos: Valor por categoría
  const categoryData = items.reduce((acc: any[], item) => {
    const existing = acc.find(c => c.name === item.category)
    const value = item.current_stock * item.unit_cost

    if (existing) {
      existing.value += value
      existing.items += 1
    } else {
      acc.push({
        name: item.category,
        value: value,
        items: 1
      })
    }
    return acc
  }, []).sort((a, b) => b.value - a.value)

  // Datos: Stock por tipo
  const typeData = [
    {
      name: 'Vehículos',
      cantidad: items.filter(i => i.type === 'VEHICLE').length,
      valor: items.filter(i => i.type === 'VEHICLE').reduce((sum, i) => sum + (i.current_stock * i.unit_cost), 0)
    },
    {
      name: 'Refacciones',
      cantidad: items.filter(i => i.type === 'PART').length,
      valor: items.filter(i => i.type === 'PART').reduce((sum, i) => sum + (i.current_stock * i.unit_cost), 0)
    }
  ]

  // Datos: Top 10 items por valor
  const topItemsByValue = items
    .map(item => ({
      name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
      valor: item.current_stock * item.unit_cost,
      stock: item.current_stock
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 
                ? formatCurrency(entry.value) 
                : entry.value.toLocaleString('es-MX')}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfica: Movimientos mensuales */}
      <Card className="shadow-md border-gray-200">
        <CardHeader>
          <CardTitle>Movimientos Mensuales</CardTitle>
          <CardDescription>
            Entradas vs Salidas (últimos 6 meses)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="salidas" fill="#ef4444" name="Salidas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica: Valor por categoría */}
      <Card className="shadow-md border-gray-200">
        <CardHeader>
          <CardTitle>Distribución de Valor</CardTitle>
          <CardDescription>
            Valor de inventario por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica: Valor mensual de movimientos */}
      <Card className="shadow-md border-gray-200">
        <CardHeader>
          <CardTitle>Valor de Movimientos</CardTitle>
          <CardDescription>
            Valor en pesos de entradas y salidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="valorEntradas" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Valor Entradas"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="valorSalidas" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Valor Salidas"
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica: Top 10 items por valor */}
      <Card className="shadow-md border-gray-200">
        <CardHeader>
          <CardTitle>Top 10 Items por Valor</CardTitle>
          <CardDescription>
            Items con mayor valor en inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItemsByValue} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#6b7280" 
                style={{ fontSize: '11px' }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" fill="#2563eb" name="Valor Total" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}