'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, PackagePlus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils/format'

// Schema de validación
const entrySchema = z.object({
  item_id: z.string().uuid('Selecciona un item válido'),
  quantity: z.number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(999999, 'La cantidad excede el límite'),
  unit_cost: z.number()
    .positive('El costo debe ser mayor a 0')
    .max(9999999.99, 'El costo excede el límite'),
  lot_number: z.string().max(100, 'El número de lote no puede exceder 100 caracteres').optional(),
  reason: z.string()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(200, 'El motivo no puede exceder 200 caracteres'),
  notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
})

type EntryFormData = z.infer<typeof entrySchema>

interface Item {
  id: string
  code: string
  name: string
  type: 'VEHICLE' | 'PART'
  brand: string | null
  model: string | null
  category: string
  unit_cost: number
  current_stock: number
}

interface EntryFormProps {
  items: Item[]
}

export function EntryForm({ items }: EntryFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedItemId = searchParams.get('item')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState<Item | null>(
    preselectedItemId ? items.find(i => i.id === preselectedItemId) || null : null
  )
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      item_id: preselectedItemId || '',
      quantity: 1,
      unit_cost: selectedItem?.unit_cost || 0,
      lot_number: '',
      reason: 'Compra',
      notes: '',
    },
  })

  // Filtrar items por búsqueda
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleItemSelect = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setSelectedItem(item)
      setValue('item_id', item.id)
      setValue('unit_cost', item.unit_cost)
    }
  }

  const quantity = watch('quantity')
  const unitCost = watch('unit_cost')
  const totalCost = quantity * unitCost

  const onSubmit = async (data: EntryFormData) => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No estás autenticado')
      }

      // Calcular total
      const total = data.quantity * data.unit_cost

      // Crear movimiento de entrada
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          item_id: data.item_id,
          type: 'ENTRY',
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          total_cost: total,
          lot_number: data.lot_number || null,
          reason: data.reason,
          notes: data.notes || null,
          created_by: user.id,
        })

      if (movementError) throw movementError

      toast.success('Entrada registrada exitosamente')
      router.push(`/inventario/${data.item_id}`)
      router.refresh()
    } catch (error: any) {
      console.error('Error al registrar entrada:', error)
      toast.error(error.message || 'Error al registrar la entrada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selección de Item */}
      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg">Seleccionar Item</CardTitle>
          <CardDescription className="text-gray-600">
            Busca y selecciona el item al que deseas agregar stock
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, código o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50"
            />
          </div>

          {/* Select de Items */}
          <div className="space-y-2">
            <Label htmlFor="item_id">
              Item <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch('item_id')}
              onValueChange={handleItemSelect}
            >
              <SelectTrigger className={errors.item_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecciona un item" />
              </SelectTrigger>
              <SelectContent>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.type === 'VEHICLE' ? 'default' : 'secondary'} className="text-xs">
                            {item.type === 'VEHICLE' ? 'VEH' : 'REF'}
                          </Badge>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-gray-500">({item.code})</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-gray-500">
                    No se encontraron items
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.item_id && (
              <p className="text-sm text-red-500">{errors.item_id.message}</p>
            )}
          </div>

          {/* Item seleccionado */}
          {selectedItem && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedItem.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedItem.code} • {selectedItem.category}
                    {selectedItem.brand && ` • ${selectedItem.brand}`}
                    {selectedItem.model && ` ${selectedItem.model}`}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Stock Actual</p>
                      <p className="text-lg font-bold text-gray-900">{selectedItem.current_stock}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Costo Unitario</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedItem.unit_cost)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles de la Entrada */}
      <Card className="shadow-md border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-lg">Detalles de la Entrada</CardTitle>
          <CardDescription className="text-gray-600">
            Información de la entrada de inventario
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cantidad */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Cantidad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                {...register('quantity', { 
                  setValueAs: (v) => parseInt(v, 10) || 1 
                })}
                placeholder="0"
                className={`bg-gray-50 ${errors.quantity ? 'border-red-500' : ''}`}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>

            {/* Costo Unitario */}
            <div className="space-y-2">
              <Label htmlFor="unit_cost">
                Costo Unitario <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  min={0}
                  {...register('unit_cost', { 
                    setValueAs: (v) => parseFloat(v) || 0 
                  })}
                  placeholder="0.00"
                  className={`pl-7 bg-gray-50 ${errors.unit_cost ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.unit_cost && (
                <p className="text-sm text-red-500">{errors.unit_cost.message}</p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Costo Total</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>

          {/* Número de Lote */}
          <div className="space-y-2">
            <Label htmlFor="lot_number">Número de Lote / Serie</Label>
            <Input
              id="lot_number"
              {...register('lot_number')}
              placeholder="Ej: LOTE-2025-001"
              className="bg-gray-50"
            />
            {errors.lot_number && (
              <p className="text-sm text-red-500">{errors.lot_number.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Opcional: identifica el lote o serie de este ingreso
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reason"
              {...register('reason')}
              placeholder="Ej: Compra, Devolución, Ajuste de inventario"
              className={`bg-gray-50 ${errors.reason ? 'border-red-500' : ''}`}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              placeholder="Información adicional sobre esta entrada (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50"
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !selectedItem}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <PackagePlus className="h-4 w-4 mr-2" />
              Registrar Entrada
            </>
          )}
        </Button>
      </div>
    </form>
  )
}