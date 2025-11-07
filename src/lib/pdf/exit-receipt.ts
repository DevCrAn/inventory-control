// src/lib/pdf/exit-receipt.ts
import { jsPDF } from 'jspdf'

interface ExitReceiptData {
  movement: {
    id: string
    quantity: number
    reason: string
    notes: string | null
    created_at: string
    total_cost: number
  }
  item: {
    code: string
    name: string
    type: 'VEHICLE' | 'PART'
    brand: string | null
    model: string | null
    category: string
  }
  user: {
    name: string
    email: string
  }
}

export async function generateExitPDF(data: ExitReceiptData): Promise<Blob> {
  const doc = new jsPDF()
  
  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let yPos = 20

  // Colores
  const primaryColor = [37, 99, 235] // Azul
  const grayColor = [100, 116, 139]
  const redColor = [239, 68, 68]

  // Header - Logo y título
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ACUSE DE SALIDA', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Gestión de Inventarios', pageWidth / 2, 30, { align: 'center' })

  yPos = 55

  // Folio
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Folio:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.movement.id.substring(0, 8).toUpperCase(), margin + 20, yPos)

  // Fecha
  const fecha = new Date(data.movement.created_at)
  const fechaFormateada = fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.setFont('helvetica', 'bold')
  doc.text('Fecha:', pageWidth - margin - 60, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(fechaFormateada, pageWidth - margin - 42, yPos)

  yPos += 15

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 15

  // Sección: Información del Item
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMACIÓN DEL ITEM', margin + 5, yPos + 7)
  yPos += 20

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  // Código
  doc.setFont('helvetica', 'bold')
  doc.text('Código:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.item.code, margin + 25, yPos)
  yPos += 7

  // Nombre
  doc.setFont('helvetica', 'bold')
  doc.text('Nombre:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.item.name, margin + 25, yPos)
  yPos += 7

  // Tipo
  doc.setFont('helvetica', 'bold')
  doc.text('Tipo:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.item.type === 'VEHICLE' ? 'Vehículo' : 'Refacción', margin + 25, yPos)
  yPos += 7

  // Categoría
  doc.setFont('helvetica', 'bold')
  doc.text('Categoría:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.item.category, margin + 25, yPos)
  yPos += 7

  // Marca y Modelo (si existen)
  if (data.item.brand || data.item.model) {
    doc.setFont('helvetica', 'bold')
    doc.text('Marca/Modelo:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    const brandModel = [data.item.brand, data.item.model].filter(Boolean).join(' ')
    doc.text(brandModel, margin + 25, yPos)
    yPos += 7
  }

  yPos += 10

  // Sección: Detalles de la Salida
  doc.setFillColor(254, 226, 226) // Rojo claro
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(redColor[0], redColor[1], redColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLES DE LA SALIDA', margin + 5, yPos + 7)
  yPos += 20

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  // Cantidad
  doc.setFont('helvetica', 'bold')
  doc.text('Cantidad:', margin, yPos)
  doc.setTextColor(redColor[0], redColor[1], redColor[2])
  doc.setFontSize(14)
  doc.text(`${data.movement.quantity} unidades`, margin + 25, yPos)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  yPos += 10

  // Costo Total
  doc.setFont('helvetica', 'bold')
  doc.text('Costo Total:', margin, yPos)
  doc.setFontSize(14)
  doc.text(
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(data.movement.total_cost),
    margin + 25,
    yPos
  )
  doc.setFontSize(10)
  yPos += 10

  // Motivo
  doc.setFont('helvetica', 'bold')
  doc.text('Motivo:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.movement.reason, margin + 25, yPos)
  yPos += 7

  // Notas (si existen)
  if (data.movement.notes) {
    doc.setFont('helvetica', 'bold')
    doc.text('Notas:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    // Dividir texto largo en múltiples líneas
    const notesLines = doc.splitTextToSize(data.movement.notes, pageWidth - 2 * margin - 10)
    doc.text(notesLines, margin + 5, yPos)
    yPos += notesLines.length * 5 + 5
    doc.setFontSize(10)
  }

  yPos += 10

  // Sección: Autorizado por
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('AUTORIZADO POR', margin + 5, yPos + 7)
  yPos += 20

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  // Usuario
  doc.setFont('helvetica', 'bold')
  doc.text('Usuario:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.user.name, margin + 25, yPos)
  yPos += 7

  // Email
  doc.setFont('helvetica', 'bold')
  doc.text('Email:', margin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(data.user.email, margin + 25, yPos)
  yPos += 20

  // Línea para firma
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, yPos, pageWidth / 2 - 10, yPos)
  doc.setFontSize(8)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('Firma del Autorizado', margin, yPos + 5)

  // Línea para recibido
  doc.line(pageWidth / 2 + 10, yPos, pageWidth - margin, yPos)
  doc.text('Firma de Recibido', pageWidth / 2 + 10, yPos + 5)

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 7

  doc.setFontSize(8)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.setFont('helvetica', 'italic')
  doc.text('Este documento es un comprobante oficial de salida de inventario.', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.text('Conserve este acuse para cualquier aclaración posterior.', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado el ${new Date().toLocaleString('es-MX')}`, pageWidth / 2, yPos, { align: 'center' })

  // Convertir a Blob
  const pdfBlob = doc.output('blob')
  return pdfBlob
}