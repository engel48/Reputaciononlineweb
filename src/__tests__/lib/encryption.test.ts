/**
 * Tests para src/lib/encryption.ts
 *
 * AES-256-GCM critico para tokens OAuth en BD.
 * Verifica encrypt/decrypt round-trip, formato, integridad y errores.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { encryptToken, decryptToken, isEncrypted, hashToken } from '@/lib/encryption';

describe('encryption (AES-256-GCM)', () => {
  beforeAll(() => {
    // Asegurar secret estable para tests
    process.env.ENCRYPTION_SECRET = 'test-secret-encryption-key-stable';
  });

  describe('encryptToken', () => {
    it('encripta un token y retorna formato iv:authTag:encrypted', () => {
      const encrypted = encryptToken('access_token_123');
      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);
      expect(parts[0]).toMatch(/^[0-9a-f]+$/); // iv hex
      expect(parts[1]).toMatch(/^[0-9a-f]+$/); // authTag hex
      expect(parts[2]).toMatch(/^[0-9a-f]+$/); // encrypted hex
    });

    it('genera resultados distintos para mismo input (IV aleatorio)', () => {
      const a = encryptToken('mismo-token');
      const b = encryptToken('mismo-token');
      expect(a).not.toBe(b);
    });

    it('lanza error si el token esta vacio', () => {
      expect(() => encryptToken('')).toThrow('Token vacío no puede ser encriptado');
    });
  });

  describe('decryptToken', () => {
    it('round-trip: decrypt(encrypt(x)) === x', () => {
      const original = 'sk-abc123_secret_oauth_token_xyz';
      const encrypted = encryptToken(original);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(original);
    });

    it('round-trip funciona con tokens largos', () => {
      const original = 'a'.repeat(2000);
      const encrypted = encryptToken(original);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(original);
    });

    it('round-trip funciona con caracteres unicode', () => {
      const original = 'token-con-emoji-y-acentos-año';
      const encrypted = encryptToken(original);
      const decrypted = decryptToken(encrypted);
      expect(decrypted).toBe(original);
    });

    it('lanza error con formato invalido (sin :)', () => {
      expect(() => decryptToken('formato-incorrecto')).toThrow('Error en desencriptación de token');
    });

    it('lanza error con authTag corrupto (integridad)', () => {
      const encrypted = encryptToken('token-original');
      const parts = encrypted.split(':');
      // Corromper el authTag
      const corrupted = `${parts[0]}:${'00'.repeat(16)}:${parts[2]}`;
      expect(() => decryptToken(corrupted)).toThrow('Error en desencriptación de token');
    });

    it('lanza error si el token encriptado esta vacio', () => {
      expect(() => decryptToken('')).toThrow('Token encriptado vacío');
    });
  });

  describe('isEncrypted', () => {
    it('retorna true para un token encriptado', () => {
      const encrypted = encryptToken('algo');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('retorna false para un token plano sin :', () => {
      expect(isEncrypted('plain-token-123')).toBe(false);
    });

    it('retorna false para string con menos de 3 partes', () => {
      expect(isEncrypted('a:b')).toBe(false);
    });

    it('retorna false para string con mas de 3 partes', () => {
      expect(isEncrypted('a:b:c:d')).toBe(false);
    });
  });

  describe('hashToken', () => {
    it('genera hash SHA-256 de 64 caracteres hex', () => {
      const hash = hashToken('mi-token');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('mismo input genera mismo hash (deterministico)', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
    });

    it('inputs distintos generan hashes distintos', () => {
      expect(hashToken('a')).not.toBe(hashToken('b'));
    });
  });
});
