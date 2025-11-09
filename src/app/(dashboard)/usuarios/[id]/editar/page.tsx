import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UserForm } from '@/components/users/UserForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { redirect, notFound } from 'next/navigation'

export default async function EditarUsuarioPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  // Verificar que sea admin
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    redirect('/')
  }

  // Obtener usuario a editar
  const { data: userToEdit, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !userToEdit) {
    notFound()
  }

  // Obtener permisos disponibles
  const { data: permissions } = await supabase
    .from('permissions')
    .select('*')
    .order('category', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/usuarios">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Usuario</h1>
          <p className="text-gray-500 mt-1">
            {userToEdit.name} ({userToEdit.email})
          </p>
        </div>
      </div>

      {/* Formulario */}
      <UserForm 
        permissions={permissions || []}
        initialData={{
          id: userToEdit.id,
          email: userToEdit.email,
          name: userToEdit.name,
          role: userToEdit.role,
        }}
        isEditing={true}
      />
    </div>
  )
}