export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'ADMIN' | 'USER'
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'ADMIN' | 'USER'
          is_active?: boolean
          created_by?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'ADMIN' | 'USER'
          is_active?: boolean
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          type: 'VEHICLE' | 'PART'
          code: string
          name: string
          description: string | null
          brand: string | null
          model: string | null
          year: number | null
          category: string
          unit_cost: number
          current_stock: number
          min_stock: number
          location: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'VEHICLE' | 'PART'
          code: string
          name: string
          description?: string | null
          brand?: string | null
          model?: string | null
          year?: number | null
          category: string
          unit_cost: number
          current_stock?: number
          min_stock?: number
          location: string
          is_active?: boolean
        }
        Update: {
          type?: 'VEHICLE' | 'PART'
          code?: string
          name?: string
          description?: string | null
          brand?: string | null
          model?: string | null
          year?: number | null
          category?: string
          unit_cost?: number
          current_stock?: number
          min_stock?: number
          location?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          item_id: string
          type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT'
          quantity: number
          unit_cost: number
          total_cost: number
          lot_number: string | null
          reason: string
          notes: string | null
          document_url: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          item_id: string
          type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT'
          quantity: number
          unit_cost: number
          total_cost: number
          lot_number?: string | null
          reason: string
          notes?: string | null
          document_url?: string | null
          created_by: string
        }
        Update: {
          notes?: string | null
          document_url?: string | null
        }
      }
      permissions: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          category: string
        }
      }
      user_permissions: {
        Row: {
          user_id: string
          permission_id: string
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          user_id: string
          permission_id: string
          granted_by?: string | null
        }
        Delete: {
          user_id: string
          permission_id: string
        }
      }
    }
  }
}
