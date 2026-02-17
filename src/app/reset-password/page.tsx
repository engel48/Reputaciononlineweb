'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PasswordReset from '@/components/auth/PasswordReset'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || undefined

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <PasswordReset token={token} />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#00E5FF] border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
