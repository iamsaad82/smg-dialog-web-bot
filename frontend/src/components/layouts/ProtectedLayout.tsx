import React, { FC, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'

export interface ProtectedLayoutProps {
  children: ReactNode
  requiredRoles?: string[]
}

// Neue Typendefinition für React 19
export const ProtectedLayout = ({
  children,
  requiredRoles = []
}: ProtectedLayoutProps): JSX.Element => {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (!isLoading && user && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        router.push('/dashboard')
      }
    }
  }, [isLoading, user, router, requiredRoles])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  }

  return <>{children}</>
} 