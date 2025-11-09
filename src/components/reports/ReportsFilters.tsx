'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportToExcel } from '@/lib/excel/export'
import { generateInventoryReport } from '@/lib/pdf/inventory-report'
import toast from 'react-hot-toast'

export function ReportsFilters() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<'inventory' | 'movements' | 'value'>('inventory')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('all')
  const supabase = createClient()

  const handleExportExcel = async () => {
    setLoading(true)
    try {
      let data: any[] = []
      let fileName = ''

      if (reportType === 'inventory') {
        // Exportar inventario
        const { data: items, error } = await supabase
          .from('items')
          .select('*')
          .is('deleted_at', null)
          .order('name')

        if (error) throw error

        data = items || []
        fileName = `inventario-${new Date().toISOString().split('T')[0]}`
        
        await exportToExcel(data, fileName, 'inventory')
      } else if (reportType === 'movements') {
        // Exportar movimientos
        let query = supabase
          .from('inventory_movements')
          .select(`
            *,
            item:items(code, name, category),
            user:users(name)
          `)
          .order('created_at', { ascending: false })

        if (startDate) {
          query = query.gte('created_at', new Date(startDate).toISOString())
        }
        if (endDate) {
          query = query.lte('created_at', new Date(endDate).toISOString())
        }

        const { data: movements, error } = await query

        if (error) throw error

        data = movements || []
        fileName = `movimientos-${new Date().toISOString().split('T')[0]}`
        
        await exportToExcel(data, fileName, 'movements')
      } else if (reportType === 'value') {
        // Reporte de valor por categoría
        const { data: items, error } = await supabase
          .from('items')
          .select('*')
          .is('deleted_at', null)

        if (error) throw error

        // Agrupar por categoría
        const grouped = (items || []).reduce((acc: any, item: any) => {
          if (!acc[item.category]) {
            acc[item.category] = {
              categoria: item.category,
              items: 0,
              stock_total: 0,
              valor_total: 0
            }
          }
          acc[item.category].items += 1
          acc[item.category].stock_total += item.current_stock
          acc[item.category].valor_total += item.current_stock * item.unit_cost
          return acc
        }, {})

        data = Object.values(grouped)
        fileName = `valor-por-categoria-${new Date().toISOString().split('T')[0]}`
        
        await exportToExcel(data, fileName, 'value')
      }

      toast.success('Reporte exportado exitosamente')
    } catch (error: any) {
      console.error('Error al exportar:', error)
      toast.error(error.message || 'Error al exportar reporte')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async () => {
    setLoading(true)
    try {
      const { data: items, error } = await supabase
        .from('items')
        .select('*')
        .is('deleted_at', null)
        .order('name')

      if (error) throw error

      const pdfBlob = await generateInventoryReport(items || [])
      
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-inventario-${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Reporte PDF generado exitosamente')
    } catch (error: any) {
      console.error('Error al generar PDF:', error)
      toast.error(error.message || 'Error al generar PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-md border-gray-200">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-lg">Filtros y Exportación</CardTitle>
        <CardDescription>
          Personaliza y exporta reportes en diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Tipo de reporte */}
          <div className="space-y-2">
            <Label>Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Inventario Completo</SelectItem>
                <SelectItem value="movements">Movimientos</SelectItem>
                <SelectItem value="value">Valor por Categoría</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha inicio */}
          {reportType === 'movements' && (
            <>
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-50"
                />
              </div>

              {/* Fecha fin */}
              <div className="space-y-2">
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-50"
                />
              </div>
            </>
          )}
        </div>

        {/* Botones de exportación */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExportExcel}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar a Excel
              </>
            )}
          </Button>

          {reportType === 'inventory' && (
            <Button
              onClick={handleExportPDF}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar a PDF
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Los reportes incluirán solo los datos activos (no eliminados) según los filtros aplicados.
        </p>
      </CardContent>
    </Card>
  )
}