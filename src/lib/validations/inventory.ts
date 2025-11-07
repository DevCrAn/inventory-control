import { z } from 'zod'

export const itemSchema = z.object({
  type: z.enum(['VEHICLE', 'PART']),
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  category: z.string().min(1, 'La categoría es requerida'),
  unit_cost: z.number().positive('El costo debe ser mayor a 0'),
  min_stock: z.number().int().min(0).default(0),
  location: z.string().min(1, 'La ubicación es requerida'),
})

export const movementSchema = z.object({
  item_id: z.string().uuid('Item inválido'),
  type: z.enum(['ENTRY', 'EXIT', 'TRANSFER', 'ADJUSTMENT']),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  unit_cost: z.number().positive('El costo debe ser mayor a 0'),
  lot_number: z.string().optional(),
  reason: z.string().min(1, 'El motivo es requerido'),
  notes: z.string().optional(),
})

export type ItemInput = z.infer<typeof itemSchema>
export type MovementInput = z.infer<typeof movementSchema>
