/**
 * Servicio de Encriptación para Tokens OAuth
 *
 * Implementa AES-256-GCM para encriptar/desencriptar tokens sensibles
 * antes de almacenarlos en Supabase.
 */

import crypto from 'crypto';

// Algoritmo de encriptación
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Genera una clave de encriptación a partir de un secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production';

  // Generar clave de 32 bytes usando PBKDF2
  const salt = crypto.createHash('sha256').update('reputacion-online-salt').digest();
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * Encripta un token usando AES-256-GCM
 *
 * @param token - Token a encriptar (access_token, refresh_token)
 * @returns String encriptado en formato: iv:authTag:encrypted
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error('Token vacío no puede ser encriptado');
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Error encriptando token:', error);
    throw new Error('Error en encriptación de token');
  }
}

/**
 * Desencripta un token previamente encriptado
 *
 * @param encryptedToken - Token en formato iv:authTag:encrypted
 * @returns Token original desencriptado
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error('Token encriptado vacío');
  }

  try {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato de token encriptado inválido');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('❌ Error desencriptando token:', error);
    throw new Error('Error en desencriptación de token');
  }
}

/**
 * Verifica si un string está encriptado
 */
export function isEncrypted(value: string): boolean {
  return value.includes(':') && value.split(':').length === 3;
}

/**
 * Hash de un token para comparaciones (sin revelar el valor original)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
