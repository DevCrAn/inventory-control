import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number
    }
  }
}

interface Item {
  code: string
  name: string
  type: 'VEHICLE' | 'PART'
  category: string
  brand: string | null
  model: string | null
  current_stock: number
  min_stock: number
  unit_cost: number
}

export async function generateInventoryReport(items: Item[]): Promise<Blob> {
  const doc = new jsPDF()
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = 20

  // Colores
  const primaryColor = [37, 99, 235]
  const grayColor = [100, 116, 139]

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORTE DE INVENTARIO', pageWidth / 2, 15, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestión de Inventarios', pageWidth / 2, 25, { align: 'center' })

  yPos = 45

  // Información del reporte
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, yPos)
  yPos += 5
  doc.text(`Total de items: ${items.length}`, margin, yPos)
  yPos += 10

  // Resumen ejecutivo
  const totalValue = items.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0)
  const totalStock = items.reduce((sum, item) => sum + item.current_stock, 0)
  const lowStock = items.filter(i => i.current_stock <= i.min_stock).length

  doc.setFillColor(245, 245, 245)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F')
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMEN EJECUTIVO', margin + 5, yPos + 7)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Valor Total: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalValue)}`, margin + 5, yPos + 14)
  doc.text(`Stock Total: ${totalStock.toLocaleString('es-MX')} unidades`, margin + 5, yPos + 20)
  doc.text(`Items con Stock Bajo: ${lowStock}`, pageWidth / 2 + 10, yPos + 14)
  
  const vehicles = items.filter(i => i.type === 'VEHICLE').length
  const parts = items.filter(i => i.type === 'PART').length
  doc.text(`Vehículos: ${vehicles} | Refacciones: ${parts}`, pageWidth / 2 + 10, yPos + 20)

  yPos += 35

  // Tabla de inventario
  const tableData = items.map(item => [
    item.code,
    item.name.substring(0, 25) + (item.name.length > 25 ? '...' : ''),
    item.type === 'VEHICLE' ? 'VEH' : 'REF',
    item.category,
    item.current_stock.toString(),
    item.min_stock.toString(),
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.unit_cost),
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.current_stock * item.unit_cost),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Código', 'Nombre', 'Tipo', 'Categoría', 'Stock', 'Min', 'Costo Unit.', 'Valor Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 20 }, // Código
      1: { cellWidth: 40 }, // Nombre
      2: { cellWidth: 15 }, // Tipo
      3: { cellWidth: 25 }, // Categoría
      4: { cellWidth: 15, halign: 'center' }, // Stock
      5: { cellWidth: 15, halign: 'center' }, // Min
      6: { cellWidth: 25, halign: 'right' }, // Costo
      7: { cellWidth: 25, halign: 'right' }, // Valor
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer en cada página
      const pageCount = (doc as any).internal.getNumberOfPages()
      const pageSize = doc.internal.pageSize
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
      
      doc.setFontSize(8)
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }
  })

  // Items con stock bajo (si hay)
  if (lowStock > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10
    
    doc.setFillColor(254, 226, 226)
    doc.rect(margin, finalY, pageWidth - 2 * margin, 8, 'F')
    
    doc.setTextColor(239, 68, 68)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('⚠️ ITEMS CON STOCK BAJO', margin + 5, finalY + 5)

    const lowStockItems = items.filter(i => i.current_stock <= i.min_stock)
    const lowStockData = lowStockItems.slice(0, 10).map(item => [
      item.code,
      item.name.substring(0, 30) + (item.name.length > 30 ? '...' : ''),
      item.current_stock.toString(),
      item.min_stock.toString(),
      item.current_stock === 0 ? 'SIN STOCK' : 'BAJO',
    ])

    autoTable(doc, {
      startY: finalY + 10,
      head: [['Código', 'Nombre', 'Stock Actual', 'Stock Mínimo', 'Estado']],
      body: lowStockData,
      theme: 'grid',
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7,
      },
      margin: { left: margin, right: margin },
    })

    if (lowStockItems.length > 10) {
      const tableEnd = (doc as any).lastAutoTable.finalY + 5
      doc.setFontSize(8)
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.text(`...y ${lowStockItems.length - 10} items más con stock bajo`, margin, tableEnd)
    }
  }

  return doc.output('blob')
}