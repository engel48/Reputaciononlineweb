/**
 * Supabase Storage Helper
 *
 * Funciones para manejar uploads de archivos a Supabase Storage
 * Buckets:
 * - avatars: Fotos de perfil de usuarios (público)
 * - reports: Reportes PDF generados (privado)
 * - mentions-screenshots: Screenshots de menciones (privado)
 */

import { getSupabaseBrowserClient } from './client'
import { createClient } from './server'

// Tipos de archivos permitidos
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const ALLOWED_PDF_TYPES = ['application/pdf']

// Tamaños máximos (en bytes)
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
export const MAX_REPORT_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Validar archivo
 */
export function validateFile(file: File, allowedTypes: string[], maxSize: number) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`)
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`)
  }

  return true
}

/**
 * Generar nombre de archivo único
 */
export function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const extension = originalName.split('.').pop()
  return `${userId}/${timestamp}-${random}.${extension}`
}

// ================================================
// AVATARS
// ================================================

/**
 * Upload avatar de usuario (desde el navegador)
 */
export async function uploadAvatar(file: File, userId: string) {
  // Validar archivo
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_AVATAR_SIZE)

  const supabase = getSupabaseBrowserClient()

  // Generar nombre único
  const fileName = generateUniqueFileName(file.name, userId)

  // Upload
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading avatar:', error)
    throw new Error('Error al subir avatar')
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  return {
    path: data.path,
    url: publicUrl
  }
}

/**
 * Eliminar avatar anterior
 */
export async function deleteAvatar(filePath: string) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.storage
    .from('avatars')
    .remove([filePath])

  if (error) {
    console.error('Error deleting avatar:', error)
    // No lanzar error, solo log
  }

  return true
}

/**
 * Obtener URL pública de avatar
 */
export function getAvatarUrl(filePath: string): string {
  const supabase = getSupabaseBrowserClient()

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return publicUrl
}

// ================================================
// REPORTS (PDFs)
// ================================================

/**
 * Upload reporte PDF (desde el servidor)
 */
export async function uploadReport(file: File | Buffer, userId: string, reportName: string) {
  const supabase = await createClient()

  // Generar nombre de archivo
  const fileName = `${userId}/reports/${Date.now()}-${reportName}.pdf`

  // Upload
  const { data, error } = await supabase.storage
    .from('reports')
    .upload(fileName, file, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading report:', error)
    throw new Error('Error al subir reporte')
  }

  // Generar URL signed (válida por 7 días)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('reports')
    .createSignedUrl(data.path, 60 * 60 * 24 * 7) // 7 días

  if (signedError) {
    console.error('Error creating signed URL:', signedError)
    throw new Error('Error al generar URL de reporte')
  }

  return {
    path: data.path,
    signedUrl: signedData.signedUrl
  }
}

/**
 * Obtener URL firmada de reporte (desde el servidor)
 */
export async function getReportSignedUrl(filePath: string, expiresIn: number = 3600) {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('reports')
    .createSignedUrl(filePath, expiresIn)

  if (error) {
    console.error('Error getting signed URL:', error)
    throw new Error('Error al obtener URL de reporte')
  }

  return data.signedUrl
}

/**
 * Eliminar reporte
 */
export async function deleteReport(filePath: string) {
  const supabase = await createClient()

  const { error } = await supabase.storage
    .from('reports')
    .remove([filePath])

  if (error) {
    console.error('Error deleting report:', error)
    throw new Error('Error al eliminar reporte')
  }

  return true
}

/**
 * Listar reportes de un usuario
 */
export async function listUserReports(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('reports')
    .list(`${userId}/reports`)

  if (error) {
    console.error('Error listing reports:', error)
    return []
  }

  return data
}

// ================================================
// MENTIONS SCREENSHOTS
// ================================================

/**
 * Upload screenshot de mención
 */
export async function uploadMentionScreenshot(file: File | Buffer, userId: string, mentionId: string) {
  const supabase = getSupabaseBrowserClient()

  const fileName = `${userId}/mentions/${mentionId}-${Date.now()}.png`

  const { data, error } = await supabase.storage
    .from('mentions-screenshots')
    .upload(fileName, file, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading screenshot:', error)
    throw new Error('Error al subir screenshot')
  }

  // Generar URL signed
  const { data: signedData, error: signedError } = await supabase.storage
    .from('mentions-screenshots')
    .createSignedUrl(data.path, 60 * 60 * 24 * 30) // 30 días

  if (signedError) {
    console.error('Error creating signed URL:', signedError)
    throw new Error('Error al generar URL de screenshot')
  }

  return {
    path: data.path,
    signedUrl: signedData.signedUrl
  }
}

// ================================================
// HELPERS GENÉRICOS
// ================================================

/**
 * Obtener tamaño de bucket usado por usuario
 */
export async function getUserStorageSize(userId: string, bucket: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId, {
      limit: 1000
    })

  if (error || !data) {
    return 0
  }

  // Sumar tamaños
  const totalSize = data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0)

  return totalSize
}

/**
 * Limpiar archivos antiguos de un usuario
 */
export async function cleanOldFiles(
  userId: string,
  bucket: string,
  olderThanDays: number = 30
) {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(userId)

  if (error || !data) {
    return 0
  }

  const now = new Date()
  const cutoffDate = new Date(now.getTime() - olderThanDays * 24 * 60 * 60 * 1000)

  // Filtrar archivos antiguos
  const oldFiles = data.filter(file => {
    const fileDate = new Date(file.created_at)
    return fileDate < cutoffDate
  })

  if (oldFiles.length === 0) {
    return 0
  }

  // Eliminar archivos antiguos
  const filePaths = oldFiles.map(file => `${userId}/${file.name}`)

  const { error: deleteError } = await supabase.storage
    .from(bucket)
    .remove(filePaths)

  if (deleteError) {
    console.error('Error cleaning old files:', deleteError)
    return 0
  }

  return oldFiles.length
}

// ================================================
// SETUP INICIAL (CREAR BUCKETS)
// ================================================

/**
 * Crear buckets necesarios (ejecutar una vez)
 * Esto normalmente se hace desde el Dashboard de Supabase
 */
export async function setupStorageBuckets() {
  const { getSupabaseAdmin } = await import('./admin')
  const admin = getSupabaseAdmin()

  // Crear bucket de avatars (público)
  await admin.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: MAX_AVATAR_SIZE
  })

  // Crear bucket de reports (privado)
  await admin.storage.createBucket('reports', {
    public: false,
    fileSizeLimit: MAX_REPORT_SIZE
  })

  // Crear bucket de screenshots (privado)
  await admin.storage.createBucket('mentions-screenshots', {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024 // 5MB
  })

  console.log('✅ Storage buckets creados')
}
