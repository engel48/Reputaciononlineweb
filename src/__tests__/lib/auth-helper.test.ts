/**
 * Tests para src/lib/auth-helper.ts
 *
 * Cubre verifyAuthToken (Bearer + cookie fallback), requireAuth (401),
 * requireRole (403 si role distinto) y generateToken (JWT firmado).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock cookies de next/headers — controlable por test
const cookieStore = new Map<string, { value: string }>();
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => cookieStore.get(name),
  }),
}));

// Mock jsonwebtoken con verify y sign reales suficientes para los tests
vi.mock('jsonwebtoken', () => {
  const verify = vi.fn((token: string, _secret: string) => {
    if (token === 'valid-user-token') {
      return { userId: 'u1', email: 'user@test.com', role: 'user' };
    }
    if (token === 'valid-admin-token') {
      return { userId: 'a1', email: 'admin@test.com', role: 'admin' };
    }
    throw new Error('invalid signature');
  });
  const sign = vi.fn((payload: any) => `signed:${JSON.stringify(payload)}`);
  return { default: { verify, sign }, verify, sign };
});

import { verifyAuthToken, requireAuth, requireRole, generateToken } from '@/lib/auth-helper';

function buildRequest(opts: { authHeader?: string; cookieToken?: string } = {}) {
  cookieStore.clear();
  if (opts.cookieToken) {
    cookieStore.set('auth-token', { value: opts.cookieToken });
  }
  const headers = new Headers();
  if (opts.authHeader) headers.set('authorization', opts.authHeader);
  return { headers } as any;
}

describe('auth-helper', () => {
  beforeEach(() => {
    cookieStore.clear();
  });

  describe('verifyAuthToken', () => {
    it('extrae token del Authorization header (Bearer)', async () => {
      const req = buildRequest({ authHeader: 'Bearer valid-user-token' });
      const user = await verifyAuthToken(req);
      expect(user).toEqual({ userId: 'u1', email: 'user@test.com', role: 'user' });
    });

    it('cae al fallback de cookie auth-token cuando no hay header', async () => {
      const req = buildRequest({ cookieToken: 'valid-user-token' });
      const user = await verifyAuthToken(req);
      expect(user?.userId).toBe('u1');
    });

    it('header Bearer tiene precedencia sobre cookie', async () => {
      const req = buildRequest({ authHeader: 'Bearer valid-admin-token', cookieToken: 'valid-user-token' });
      const user = await verifyAuthToken(req);
      expect(user?.role).toBe('admin');
    });

    it('retorna null cuando no hay token en ningun lado', async () => {
      const req = buildRequest({});
      const user = await verifyAuthToken(req);
      expect(user).toBeNull();
    });

    it('retorna null si el token es invalido (firma rota)', async () => {
      const req = buildRequest({ authHeader: 'Bearer token-falso-firma-rota' });
      const user = await verifyAuthToken(req);
      expect(user).toBeNull();
    });

    it('ignora header Authorization sin prefijo Bearer', async () => {
      const req = buildRequest({ authHeader: 'Basic dXNlcjpwYXNz' });
      const user = await verifyAuthToken(req);
      expect(user).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('retorna AuthUser cuando el token es valido', async () => {
      const req = buildRequest({ authHeader: 'Bearer valid-user-token' });
      const result = await requireAuth(req);
      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as any).userId).toBe('u1');
    });

    it('retorna NextResponse 401 cuando no hay token', async () => {
      const req = buildRequest({});
      const result = await requireAuth(req);
      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(401);
    });
  });

  describe('requireRole', () => {
    it('permite admin cuando role coincide', async () => {
      const req = buildRequest({ authHeader: 'Bearer valid-admin-token' });
      const result = await requireRole(req, 'admin');
      expect(result).not.toBeInstanceOf(NextResponse);
      expect((result as any).role).toBe('admin');
    });

    it('retorna 403 cuando role no coincide', async () => {
      const req = buildRequest({ authHeader: 'Bearer valid-user-token' });
      const result = await requireRole(req, 'admin');
      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(403);
    });

    it('propaga 401 si no hay token (no llega a chequear role)', async () => {
      const req = buildRequest({});
      const result = await requireRole(req, 'admin');
      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(401);
    });
  });

  describe('generateToken', () => {
    it('genera token firmado con userId, email y role default user', () => {
      const token = generateToken({ id: 'u1', email: 'foo@test.com' });
      expect(token).toContain('signed:');
      expect(token).toContain('"userId":"u1"');
      expect(token).toContain('"role":"user"');
    });

    it('respeta el role explicito', () => {
      const token = generateToken({ id: 'a1', email: 'admin@test.com', role: 'admin' });
      expect(token).toContain('"role":"admin"');
    });
  });
});
