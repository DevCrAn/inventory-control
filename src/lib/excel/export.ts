import * as XLSX from 'xlsx'
import { formatCurrency } from '@/lib/utils/format'

export async function exportToExcel(
  data: any[],
  fileName: string,
  type: 'inventory' | 'movements' | 'value'
) {
  let worksheetData: any[] = []
  let worksheetName = ''

  if (type === 'inventory') {
    worksheetName = 'Inventario'
    worksheetData = data.map(item => ({
      'Código': item.code,
      'Nombre': item.name,
      'Tipo': item.type === 'VEHICLE' ? 'Vehículo' : 'Refacción',
      'Categoría': item.category,
      'Marca': item.brand || '',
      'Modelo': item.model || '',
      'Año': item.year || '',
      'Stock Actual': item.current_stock,
      'Stock Mínimo': item.min_stock,
      'Costo Unitario': item.unit_cost,
      'Valor Total': item.current_stock * item.unit_cost,
      'Ubicación': item.location,
      'Fecha Creación': new Date(item.created_at).toLocaleDateString('es-MX'),
    }))
  } else if (type === 'movements') {
    worksheetName = 'Movimientos'
    worksheetData = data.map(movement => ({
      'Fecha': new Date(movement.created_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      'Tipo': movement.type === 'ENTRY' ? 'Entrada' : 
              movement.type === 'EXIT' ? 'Salida' : 
              movement.type === 'TRANSFER' ? 'Traslado' : 'Ajuste',
      'Item Código': movement.item?.code || 'N/A',
      'Item Nombre': movement.item?.name || 'Item eliminado',
      'Categoría': movement.item?.category || 'N/A',
      'Cantidad': movement.type === 'ENTRY' ? movement.quantity : -movement.quantity,
      'Costo Unitario': movement.unit_cost,
      'Costo Total': movement.total_cost,
      'Motivo': movement.reason,
      'Notas': movement.notes || '',
      'Usuario': movement.user?.name || 'N/A',
    }))
  } else if (type === 'value') {
    worksheetName = 'Valor por Categoría'
    worksheetData = data.map(item => ({
      'Categoría': item.categoria,
      'Cantidad de Items': item.items,
      'Stock Total': item.stock_total,
      'Valor Total': item.valor_total,
      'Valor Promedio por Item': item.valor_total / item.items,
    }))
  }

  // Crear workbook
  const worksheet = XLSX.utils.json_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName)

  // Ajustar anchos de columna
  const maxWidth = 50
  const colWidths = Object.keys(worksheetData[0] || {}).map(key => {
    const maxLength = Math.max(
      key.length,
      ...worksheetData.map(row => String(row[key] || '').length)
    )
    return { wch: Math.min(maxLength + 2, maxWidth) }
  })
  worksheet['!cols'] = colWidths

  // Agregar estilos (header en negrita)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1'
    if (!worksheet[address]) continue
    worksheet[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E5E7EB' } }
    }
  }

  // Generar archivo
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}