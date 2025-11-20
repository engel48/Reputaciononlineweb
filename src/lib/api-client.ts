/**
 * API Client con Bearer Token Authentication
 *
 * ✅ ARQUITECTURA UNIFICADA WEB + MÓVIL
 *
 * Este cliente HTTP automáticamente:
 * - Añade Authorization header a todas las requests
 * - Lee el token desde localStorage
 * - Maneja errores 401 (token expirado/inválido)
 * - Proporciona métodos tipados para las APIs
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Token Storage - localStorage para web
 */
export const TokenStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

/**
 * Request options con autenticación automática
 */
interface ApiRequestInit extends RequestInit {
  skipAuth?: boolean; // Para endpoints públicos (login, register)
}

/**
 * Fetch wrapper con Bearer token automático
 */
async function apiFetch<T = any>(
  endpoint: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  // Construir headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  // Añadir Authorization header si no es endpoint público
  if (!skipAuth) {
    const token = TokenStorage.getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // Construir URL completa
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: requestHeaders,
    });

    // Manejar error 401 - token expirado/inválido
    if (response.status === 401) {
      TokenStorage.removeToken();

      // Solo redirigir a login si no estamos ya en una página de auth
      if (typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }

      throw new Error('No autenticado');
    }

    // Manejar otros errores HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`
      }));

      throw new Error(errorData.message || errorData.error || 'Error en la petición');
    }

    // Retornar datos JSON
    return await response.json();

  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

/**
 * API Client con métodos convenientes
 */
export const apiClient = {
  // Métodos HTTP básicos
  async get<T = any>(endpoint: string, options?: ApiRequestInit): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'GET' });
  },

  async post<T = any>(endpoint: string, data?: any, options?: ApiRequestInit): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put<T = any>(endpoint: string, data?: any, options?: ApiRequestInit): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete<T = any>(endpoint: string, options?: ApiRequestInit): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
  },

  // Métodos de autenticación
  auth: {
    async login(email: string, password: string) {
      const response = await apiFetch<{
        success: boolean;
        user: any;
        token: string;
        expiresIn: number;
        message: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true, // No requiere token
      });

      // Guardar token en localStorage
      if (response.success && response.token) {
        TokenStorage.setToken(response.token);
      }

      return response;
    },

    async register(userData: {
      email: string;
      password: string;
      name: string;
      company?: string;
      phone?: string;
      profileType?: string;
    }) {
      const response = await apiFetch<{
        success: boolean;
        user: any;
        token: string;
        expiresIn: number;
        message: string;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        skipAuth: true, // No requiere token
      });

      // Guardar token en localStorage
      if (response.success && response.token) {
        TokenStorage.setToken(response.token);
      }

      return response;
    },

    async logout() {
      TokenStorage.removeToken();
      // Opcional: llamar endpoint de logout si existe
      // await apiFetch('/api/auth/logout', { method: 'POST' });
    },

    async getCurrentUser() {
      return apiFetch<{
        success: boolean;
        user: any;
      }>('/api/auth/me', {
        method: 'GET',
      });
    },
  },

  // Métodos de dashboard
  dashboard: {
    async getAnalytics() {
      return apiFetch<{
        success: boolean;
        data: any;
        generated_at: string;
      }>('/api/dashboard-analytics', {
        method: 'GET',
      });
    },
  },

  // Métodos de social media
  socialMedia: {
    async getConsolidated() {
      return apiFetch<{
        success: boolean;
        data: any;
      }>('/api/social-media/consolidated', {
        method: 'GET',
      });
    },
  },
};

export default apiClient;
