'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Save, Package, Car } from 'lucide-react'
import toast from 'react-hot-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Schema de validación
const itemSchema = z.object({
  type: z.enum(['VEHICLE', 'PART'], {
    required_error: 'Selecciona el tipo de item',
  }),
  code: z.string()
    .min(1, 'El código es requerido')
    .max(50, 'El código no puede exceder 50 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Solo letras mayúsculas, números y guiones'),
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  brand: z.string().max(100, 'La marca no puede exceder 100 caracteres').optional(),
  model: z.string().max(100, 'El modelo no puede exceder 100 caracteres').optional(),
  year: z.number()
    .int('El año debe ser un número entero')
    .min(1900, 'Año inválido')
    .max(new Date().getFullYear() + 1, 'Año inválido')
    .optional()
    .nullable(),
  category: z.string().min(1, 'La categoría es requerida'),
  unit_cost: z.number()
    .positive('El costo debe ser mayor a 0')
    .max(9999999.99, 'El costo excede el límite'),
  min_stock: z.number()
    .int('El stock mínimo debe ser un número entero')
    .min(0, 'El stock mínimo no puede ser negativo')
    .max(999999, 'El stock mínimo excede el límite'),
  location: z.string()
    .min(1, 'La ubicación es requerida')
    .max(100, 'La ubicación no puede exceder 100 caracteres'),
})

type ItemFormData = z.infer<typeof itemSchema>

interface ItemFormProps {
  initialData?: Partial<ItemFormData> & { id?: string }
  isEditing?: boolean
}

export function ItemForm({ initialData, isEditing = false }: ItemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      type: initialData?.type || 'PART',
      code: initialData?.code || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      year: initialData?.year || null,
      category: initialData?.category || '',
      unit_cost: initialData?.unit_cost || 0,
      min_stock: initialData?.min_stock || 0,
      location: initialData?.location || '',
    },
  })

  const selectedType = watch('type')

  const onSubmit = async (data: ItemFormData) => {
    setLoading(true)

    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No estás autenticado')
      }

      if (isEditing && initialData?.id) {
        // Actualizar item existente
        const { error } = await supabase
          .from('items')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', initialData.id)

        if (error) throw error

        toast.success('Item actualizado exitosamente')
        router.push(`/inventario/${initialData.id}`)
      } else {
        // Crear nuevo item
        const { data: newItem, error } = await supabase
          .from('items')
          .insert({
            ...data,
            created_by: user.id,
          })
          .select()
          .single()

        if (error) {
          if (error.code === '23505') {
            throw new Error('Ya existe un item con ese código')
          }
          throw error
        }

        toast.success('Item creado exitosamente')
        router.push(`/inventario/${newItem.id}`)
      }

      router.refresh()
    } catch (error: any) {
      console.error('Error al guardar item:', error)
      toast.error(error.message || 'Error al guardar el item')
    } finally {
      setLoading(false)
    }
  }

  // Categorías predefinidas
  const categories = {
    VEHICLE: [
      'Sedán',
      'SUV',
      'Camioneta',
      'Pickup',
      'Van',
      'Deportivo',
      'Otro',
    ],
    PART: [
      'Motor',
      'Transmisión',
      'Suspensión',
      'Frenos',
      'Eléctrico',
      'Carrocería',
      'Interior',
      'Filtros',
      'Lubricantes',
      'Neumáticos',
      'Otro',
    ],
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tipo de Item */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Item</CardTitle>
          <CardDescription>
            Selecciona si es un vehículo o una refacción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setValue('type', 'VEHICLE')}
              className={`p-6 border-2 rounded-lg transition-all ${
                selectedType === 'VEHICLE'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Car className={`h-8 w-8 mx-auto mb-3 ${
                selectedType === 'VEHICLE' ? 'text-primary' : 'text-gray-400'
              }`} />
              <p className="font-semibold text-center">Vehículo</p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Autos, camionetas, etc.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setValue('type', 'PART')}
              className={`p-6 border-2 rounded-lg transition-all ${
                selectedType === 'PART'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Package className={`h-8 w-8 mx-auto mb-3 ${
                selectedType === 'PART' ? 'text-primary' : 'text-gray-400'
              }`} />
              <p className="font-semibold text-center">Refacción</p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Piezas, repuestos, partes
              </p>
            </button>
          </div>
          {errors.type && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{errors.type.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
          <CardDescription>
            Datos principales del item
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Código / SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="Ej: VEH-001 o REF-MOT-123"
                className={errors.code ? 'border-red-500' : ''}
                disabled={isEditing} 
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Solo letras mayúsculas, números y guiones
              </p>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Nombre del item"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Descripción detallada del item (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                {...register('brand')}
                placeholder="Ej: Toyota, Bosch"
              />
              {errors.brand && (
                <p className="text-sm text-red-500">{errors.brand.message}</p>
              )}
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                {...register('model')}
                placeholder="Ej: Corolla, Premium"
              />
              {errors.model && (
                <p className="text-sm text-red-500">{errors.model.message}</p>
              )}
            </div>

            {/* Año */}
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                {...register('year', { 
                  setValueAs: (v) => v === '' ? null : parseInt(v, 10) 
                })}
                placeholder={new Date().getFullYear().toString()}
                min={1900}
                max={new Date().getFullYear() + 1}
              />
              {errors.year && (
                <p className="text-sm text-red-500">{errors.year.message}</p>
              )}
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Categoría <span className="text-red-500">*</span>
            </Label>
           <Select
              value={watch('category')}
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger className={`bg-gray-50 border-gray-300 ${errors.category ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {categories[selectedType as 'VEHICLE' | 'PART'].map((cat) => (
                  <SelectItem 
                    key={cat} 
                    value={cat}
                    className="hover:bg-gray-100"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventario y Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario y Ubicación</CardTitle>
          <CardDescription>
            Configuración de stock y almacenamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {...register('unit_cost', { 
                    setValueAs: (v) => parseFloat(v) || 0 
                  })}
                  placeholder="0.00"
                  className={`pl-7 ${errors.unit_cost ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.unit_cost && (
                <p className="text-sm text-red-500">{errors.unit_cost.message}</p>
              )}
            </div>

            {/* Stock Mínimo */}
            <div className="space-y-2">
              <Label htmlFor="min_stock">
                Stock Mínimo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="min_stock"
                type="number"
                {...register('min_stock', { 
                  setValueAs: (v) => parseInt(v, 10) || 0 
                })}
                placeholder="0"
                min={0}
                className={errors.min_stock ? 'border-red-500' : ''}
              />
              {errors.min_stock && (
                <p className="text-sm text-red-500">{errors.min_stock.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Alerta cuando el stock sea menor o igual a este valor
              </p>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Ubicación / Almacén <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Ej: Almacén A, Pasillo 3, Estante 5"
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location.message}</p>
            )}
          </div>

          {!isEditing && (
            <Alert>
              <AlertDescription>
                <strong>Nota:</strong> El stock inicial será 0. Usa "Registrar Entrada" 
                para agregar unidades al inventario.
              </AlertDescription>
            </Alert>
          )}
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
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar Item' : 'Crear Item'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}