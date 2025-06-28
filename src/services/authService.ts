// src/services/authService.ts
import { User } from '@/context/UserContext';

// Datos simulados para usuarios predeterminados
const PREDEFINED_USERS = {
  // Elmer Zapata - Perfil Político con datos completos
  elmer: {
    id: 'user_1001',
    name: 'Elmer Zapata',
    email: 'elmer.zapata@example.com',
    password: 'elmer123', // En una app real, nunca almacenar contraseñas en texto plano
    profileType: 'political',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    role: 'user',
    createdAt: '2024-12-15T08:30:00Z',
    lastLogin: '2025-06-05T08:15:00Z',
    plan: 'pro',
    credits: 2500,
    nextBillingDate: '2025-07-01T00:00:00Z',
    onboardingCompleted: true, // Usuario con onboarding completo
    socialMedia: [
      {
        platform: 'x',
        username: 'ElmerZapataOficial',
        followers: 45200,
        connected: true,
        profileUrl: 'https://x.com/ElmerZapataOficial'
      },
      {
        platform: 'facebook',
        username: 'Elmer Zapata',
        followers: 38600,
        connected: true,
        profileUrl: 'https://facebook.com/ElmerZapata'
      },
      {
        platform: 'instagram',
        username: 'elmerzapata.oficial',
        followers: 29800,
        connected: true,
        profileUrl: 'https://instagram.com/elmerzapata.oficial'
      },
      {
        platform: 'linkedin',
        username: 'Elmer Zapata',
        followers: 5300,
        connected: false,
        profileUrl: 'https://linkedin.com/in/elmer-zapata'
      },
      {
        platform: 'tiktok',
        username: '@elmerzapata',
        followers: 22000,
        connected: false,
        profileUrl: 'https://tiktok.com/@elmerzapata'
      }
    ],
    reputation: {
      score: 78,
      previousScore: 72,
      trend: 'up',
      positiveMentions: 456,
      neutralMentions: 284,
      negativeMentions: 53,
      totalMentions: 793,
      recentMentions: [
        {
          id: 'mention_001',
          source: 'x',
          author: '@ciudadano83',
          content: 'El discurso de @ElmerZapataOficial sobre políticas ambientales fue muy inspirador. Necesitamos más líderes así.',
          date: '2025-06-04T15:23:00Z',
          sentiment: 'positive',
          engagement: 342,
          url: 'https://x.com/ciudadano83/status/12345'
        },
        {
          id: 'mention_002',
          source: 'news',
          author: 'El Diario Nacional',
          content: 'Elmer Zapata propone nueva iniciativa para mejorar el sistema educativo en comunidades rurales.',
          date: '2025-06-03T09:15:00Z',
          sentiment: 'positive',
          engagement: 567,
          url: 'https://eldiario.com/noticias/54321'
        },
        {
          id: 'mention_003',
          source: 'facebook',
          author: 'María González',
          content: 'No estoy de acuerdo con la postura de Zapata sobre el nuevo proyecto de ley fiscal.',
          date: '2025-06-02T12:45:00Z',
          sentiment: 'negative',
          engagement: 89,
          url: 'https://facebook.com/post/67890'
        },
        {
          id: 'mention_004',
          source: 'blogs',
          author: 'Política Actual',
          content: 'Análisis de la trayectoria política de Elmer Zapata y sus principales propuestas.',
          date: '2025-06-01T18:30:00Z',
          sentiment: 'neutral',
          engagement: 236,
          url: 'https://politicaactual.blog/analisis-zapata'
        },
        {
          id: 'mention_005',
          source: 'instagram',
          author: '@periodico_digital',
          content: 'Elmer Zapata participó en el foro sobre cambio climático. Su presentación fue informativa pero no aportó soluciones concretas.',
          date: '2025-05-31T10:20:00Z',
          sentiment: 'neutral',
          engagement: 157,
          url: 'https://instagram.com/p/abcdef'
        }
      ]
    }
  },
  
  // Segundo perfil político
  lucia: {
    id: 'user_1002',
    name: 'Lucía Morales',
    email: 'lucia.morales@example.com',
    password: 'lucia123', // En una app real, nunca almacenar contraseñas en texto plano
    profileType: 'political',
    avatarUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
    role: 'user',
    createdAt: '2024-11-20T10:15:00Z',
    lastLogin: '2025-06-04T14:30:00Z',
    plan: 'basic',
    credits: 850,
    nextBillingDate: '2025-06-20T00:00:00Z',
    onboardingCompleted: false, // Usuario sin onboarding completo
    socialMedia: [
      {
        platform: 'x',
        username: 'LuciaMoralesOFC',
        followers: 18400,
        connected: false, // Necesita conectar esta red social
        profileUrl: 'https://x.com/LuciaMoralesOFC'
      },
      {
        platform: 'facebook',
        username: 'Lucia Morales',
        followers: 12500,
        connected: false, // Necesita conectar esta red social
        profileUrl: 'https://facebook.com/luciamorales.oficial'
      },
      {
        platform: 'instagram',
        username: 'lucia.morales.ofc',
        followers: 9700,
        connected: false, // Necesita conectar esta red social
        profileUrl: 'https://instagram.com/lucia.morales.ofc'
      },
      {
        platform: 'linkedin',
        username: 'Lucía Morales',
        followers: 2800,
        connected: false, // Necesita conectar esta red social
        profileUrl: 'https://linkedin.com/in/lucia-morales'
      },
      {
        platform: 'tiktok',
        username: '@luciamorales',
        followers: 5600,
        connected: false, // Necesita conectar esta red social
        profileUrl: 'https://tiktok.com/@luciamorales'
      }
    ],
    reputation: {
      score: 68,
      previousScore: 65,
      trend: 'up',
      positiveMentions: 124,
      neutralMentions: 98,
      negativeMentions: 32,
      totalMentions: 254,
      recentMentions: [] // Sin menciones hasta conectar redes sociales
    }
  }
};

// Guardado del usuario actual en localStorage
const saveCurrentUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};

// Obtener el usuario actual desde localStorage
export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userString = localStorage.getItem('currentUser');
    if (userString) {
      try {
        return JSON.parse(userString);
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
        return null;
      }
    }
  }
  return null;
};

// Limpiar los datos de usuario al cerrar sesión
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
    // Redireccionar al login
    window.location.href = '/login';
  }
};

// Simular inicio de sesión con credenciales
export const login = (email: string, password: string) => {
  // Buscar entre los usuarios predefinidos
  const userEntry = Object.entries(PREDEFINED_USERS).find(
    ([_, userData]) => userData.email === email && userData.password === password
  );

  if (userEntry) {
    const [userId, userData] = userEntry;
    // Excluir password por seguridad antes de guardar en localStorage
    const { password: _, ...safeUserData } = userData;
    saveCurrentUser(safeUserData);
    return { success: true, user: safeUserData };
  }

  return { success: false, message: 'Credenciales incorrectas' };
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};
