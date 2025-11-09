import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UsersTable } from '@/components/users/UsersTable'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function UsuariosPage() {
  const supabase = await createServerSupabaseClient()

  // Verificar autenticación y permisos
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    redirect('/')
  }

  // Obtener todos los usuarios con permisos
  const { data: users } = await supabase
    .from('users')
    .select(`
      *,
      created_by_user:users!users_created_by_fkey(name, email)
    `)
    .order('created_at', { ascending: false })

  // Obtener todos los permisos disponibles
  const { data: permissions } = await supabase
    .from('permissions')
    .select('*')
    .order('category', { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">
            Gestiona usuarios y sus permisos de acceso
          </p>
        </div>
        <Link href="/usuarios/nuevo">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {/* Tabla de usuarios */}
      <UsersTable 
        users={users || []} 
        permissions={permissions || []}
      />
    </div>
  )
}