/**
 * NextAuth.js API Route Handler
 *
 * Este archivo es CRÍTICO para que NextAuth funcione.
 * Maneja todas las rutas de autenticación: /api/auth/*
 *
 * IMPORTANTE: Usa la configuración centralizada de /lib/auth.ts
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
