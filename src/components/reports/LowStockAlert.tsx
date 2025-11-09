'use client'

import { AlertTriangle, Package } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'

interface Item {
  id: string
  code: string
  name: string
  type: 'VEHICLE' | 'PART'
  category: string
  current_stock: number
  min_stock: number
  unit_cost: number
}

interface LowStockAlertProps {
  items: Item[]
}

export function LowStockAlert({ items }: LowStockAlertProps) {
  const outOfStock = items.filter(i => i.current_stock === 0)
  const lowStock = items.filter(i => i.current_stock > 0 && i.current_stock <= i.min_stock)

  return (
    <Alert className="border-warning bg-warning/5">
      <AlertTriangle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning font-bold text-lg">
        Alerta: Items con Stock Crítico
      </AlertTitle>
      <AlertDescription>
        <div className="mt-3 space-y-3">
          {outOfStock.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-800 mb-2">
                ⛔ Sin Stock ({outOfStock.length} items)
              </p>
              <div className="space-y-1">
                {outOfStock.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-700">{item.name} ({item.code})</span>
                    <Link href={`/movimientos/entrada?item=${item.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Registrar entrada
                      </Button>
                    </Link>
                  </div>
                ))}
                {outOfStock.length > 3 && (
                  <p className="text-xs text-red-600 mt-1">
                    ...y {outOfStock.length - 3} items más
                  </p>
                )}
              </div>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                ⚠️ Stock Bajo ({lowStock.length} items)
              </p>
              <div className="space-y-1">
                {lowStock.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-700">{item.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.current_stock}/{item.min_stock}
                      </Badge>
                    </div>
                    <Link href={`/movimientos/entrada?item=${item.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Reabastecer
                      </Button>
                    </Link>
                  </div>
                ))}
                {lowStock.length > 5 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ...y {lowStock.length - 5} items más
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Link href="/inventario?filter=low-stock" className="flex-1">
              <Button variant="outline" className="w-full" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Ver todos los items
              </Button>
            </Link>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}