'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePermissions(userId: string | undefined) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchPermissions = async () => {
      const { data } = await supabase
        .from('user_permissions')
        .select(`
          permission:permissions (
            code
          )
        `)
        .eq('user_id', userId)

      const codes = data?.map((p: any) => p.permission.code) ?? []
      setPermissions(codes)
      setLoading(false)
    }

    fetchPermissions()
  }, [userId, supabase])

  const hasPermission = (code: string) => permissions.includes(code)
  
  const hasAnyPermission = (codes: string[]) => 
    codes.some(code => permissions.includes(code))

  const hasAllPermissions = (codes: string[]) =>
    codes.every(code => permissions.includes(code))

  return { 
    permissions, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    loading 
  }
}
