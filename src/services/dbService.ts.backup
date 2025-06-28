// src/services/dbService.ts
import { User } from '@/context/UserContext';

// Nombre de la base de datos
const DB_NAME = 'reputacionOnlineDB';
const DB_VERSION = 1;
const USER_STORE = 'users';

// Interfaz para credenciales de usuario
interface UserCredentials {
  email: string;
  password: string;
}

// Usuario predefinido - Elmer Zapata (perfil político)
const elmerZapataData: User = {
  id: 'user_1001',
  name: 'Elmer Zapata',
  email: 'elmer.zapata@example.com',
  profileType: 'political' as 'personal' | 'political' | 'business',
  avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  role: 'user' as 'user' | 'admin',
  createdAt: '2024-12-15T08:30:00Z',
  lastLogin: '2025-06-05T08:15:00Z',
  plan: 'pro' as 'free' | 'basic' | 'pro' | 'enterprise',
  credits: 2500,
  nextBillingDate: '2025-07-01T00:00:00Z',
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
    trend: 'up' as 'up' | 'down' | 'stable',
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
};

// Segundo usuario político predefinido
const luciaData: User = {
  id: 'user_1002',
  name: 'Lucía Morales',
  email: 'lucia.morales@example.com',
  profileType: 'political' as 'personal' | 'political' | 'business',
  avatarUrl: 'https://randomuser.me/api/portraits/women/45.jpg',
  role: 'user' as 'user' | 'admin',
  createdAt: '2024-11-20T10:15:00Z',
  lastLogin: '2025-06-04T14:30:00Z',
  plan: 'basic' as 'free' | 'basic' | 'pro' | 'enterprise',
  credits: 850,
  nextBillingDate: '2025-06-20T00:00:00Z',
  socialMedia: [
    {
      platform: 'x',
      username: 'LuciaMoralesOFC',
      followers: 18400,
      connected: true,
      profileUrl: 'https://x.com/LuciaMoralesOFC'
    },
    {
      platform: 'facebook',
      username: 'Lucia Morales',
      followers: 12500,
      connected: true,
      profileUrl: 'https://facebook.com/luciamorales.oficial'
    },
    {
      platform: 'instagram',
      username: 'lucia.morales.ofc',
      followers: 9700,
      connected: true,
      profileUrl: 'https://instagram.com/lucia.morales.ofc'
    },
    {
      platform: 'linkedin',
      username: 'Lucía Morales',
      followers: 2800,
      connected: false,
      profileUrl: 'https://linkedin.com/in/lucia-morales'
    },
    {
      platform: 'tiktok',
      username: '@luciamorales',
      followers: 5600,
      connected: false,
      profileUrl: 'https://tiktok.com/@luciamorales'
    }
  ],
  reputation: {
    score: 68,
    previousScore: 65,
    trend: 'up' as 'up' | 'down' | 'stable',
    positiveMentions: 124,
    neutralMentions: 98,
    negativeMentions: 32,
    totalMentions: 254,
    recentMentions: [
      {
        id: 'mention_101',
        source: 'x',
        author: '@noticiasAhora',
        content: 'La diputada @LuciaMoralesOFC presentó un interesante proyecto para mejorar la transparencia en la gestión pública.',
        date: '2025-06-03T13:20:00Z',
        sentiment: 'positive',
        engagement: 145,
        url: 'https://x.com/noticiasAhora/status/98765'
      },
      {
        id: 'mention_102',
        source: 'facebook',
        author: 'Grupo Ciudadano',
        content: 'Lucía Morales asistió al debate sobre presupuesto y presentó propuestas coherentes.',
        date: '2025-05-30T16:40:00Z',
        sentiment: 'positive',
        engagement: 78,
        url: 'https://facebook.com/GrupoCiudadano/posts/12345'
      },
      {
        id: 'mention_103',
        source: 'news',
        author: 'Diario La Capital',
        content: 'Morales se abstuvo en la votación sobre el proyecto de infraestructura, generando críticas en su bloque.',
        date: '2025-05-28T09:15:00Z',
        sentiment: 'negative',
        engagement: 203,
        url: 'https://lacapital.com/noticias/politica/54321'
      }
    ]
  }
};

// Credenciales predefinidas (en una app real, nunca almacenar contraseñas en texto plano)
const PREDEFINED_CREDENTIALS = {
  'elmer.zapata@example.com': { email: 'elmer.zapata@example.com', password: 'password123' },
  'lucia.morales@example.com': { email: 'lucia.morales@example.com', password: 'password123' }
};

// Función para inicializar la base de datos
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Su navegador no soporta IndexedDB'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error('Error abriendo base de datos'));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Crear almacenes de objetos (object stores)
      if (!db.objectStoreNames.contains(USER_STORE)) {
        const userStore = db.createObjectStore(USER_STORE, { keyPath: 'email' });
        userStore.createIndex('id', 'id', { unique: true });
        userStore.createIndex('email', 'email', { unique: true });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
      
      // Precargar usuarios predefinidos si no existen
      checkAndLoadPredefinedUsers(db);
    };
  });
};

// Verificar y cargar usuarios predefinidos sin dependencias circulares
const checkAndLoadPredefinedUsers = async (db: IDBDatabase) => {
  try {
    // Verificar si Elmer Zapata existe directamente usando la transacción
    const transaction1 = db.transaction(USER_STORE, 'readonly');
    const store1 = transaction1.objectStore(USER_STORE);
    const request1 = store1.get(elmerZapataData.email);
    
    request1.onsuccess = (event) => {
      if (!request1.result) {
        // Elmer no existe, agregarlo
        const addTransaction = db.transaction(USER_STORE, 'readwrite');
        const addStore = addTransaction.objectStore(USER_STORE);
        
        // Combinar los datos con las credenciales
        const userWithCredentials = {
          ...elmerZapataData,
          password: PREDEFINED_CREDENTIALS[elmerZapataData.email as keyof typeof PREDEFINED_CREDENTIALS].password
        };
        
        addStore.add(userWithCredentials);
        console.log('Usuario predefinido agregado:', elmerZapataData.name);
      }
    };
    
    // Verificar si Lucía existe directamente
    const transaction2 = db.transaction(USER_STORE, 'readonly');
    const store2 = transaction2.objectStore(USER_STORE);
    const request2 = store2.get(luciaData.email);
    
    request2.onsuccess = (event) => {
      if (!request2.result) {
        // Lucía no existe, agregarla
        const addTransaction = db.transaction(USER_STORE, 'readwrite');
        const addStore = addTransaction.objectStore(USER_STORE);
        
        // Combinar los datos con las credenciales
        const userWithCredentials = {
          ...luciaData,
          password: PREDEFINED_CREDENTIALS[luciaData.email as keyof typeof PREDEFINED_CREDENTIALS].password
        };
        
        addStore.add(userWithCredentials);
        console.log('Usuario predefinido agregado:', luciaData.name);
      }
    };
  } catch (error) {
    console.error('Error precargando usuarios predefinidos:', error);
  }
};

// Agregar nuevo usuario con sus credenciales
export const addUserWithCredentials = (
  userData: User,
  password: string
): Promise<User> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(USER_STORE, 'readwrite');
      const store = transaction.objectStore(USER_STORE);
      
      // Combinar los datos del usuario con sus credenciales
      const userWithCredentials = {
        ...userData,
        password
      };
      
      const request = store.add(userWithCredentials);
      
      request.onsuccess = () => {
        // Devolvemos los datos del usuario sin la contraseña
        const { password: _, ...userWithoutPassword } = userWithCredentials;
        resolve(userWithoutPassword as User);
      };
      
      request.onerror = () => {
        reject(new Error('Error al guardar el usuario'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Obtener usuario por email
export const getUserByEmail = (email: string): Promise<User | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(USER_STORE, 'readonly');
      const store = transaction.objectStore(USER_STORE);
      const request = store.get(email);
      
      request.onsuccess = () => {
        const user = request.result;
        if (user) {
          // No devolver la contraseña al frontend
          const { password: _, ...userWithoutPassword } = user;
          resolve(userWithoutPassword as User);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        reject(new Error('Error al buscar el usuario'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Verificar credenciales para login
export const verifyUserCredentials = (email: string, password: string): Promise<User | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Verificando credenciales para:', email);
      
      // Aseguramos que la base de datos esté completamente inicializada antes de continuar
      await initializeDatabase().catch(err => {
        console.error('Error al inicializar la base de datos:', err);
        throw new Error('No se pudo inicializar la base de datos');
      });
      
      // Usuario demo para entorno de desarrollo
      if (process.env.NODE_ENV === 'development' && email === 'elmer.zapata@example.com') {
        console.log('Usando usuario demo para desarrollo');
        const demoUser: User = {
          id: 'demo-user-id',
          email: 'elmer.zapata@example.com',
          name: 'Elmer Zapata',
          role: 'admin',
          company: 'Empresa Demo',
          isPro: true,
          plan: 'pro',
          credits: 1500,
          avatarUrl: '/images/avatars/elmer-zapata.jpg',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          settings: { darkMode: true, notifications: true }
        };
        
        // Guardar usuario demo en localStorage para persistencia
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(demoUser));
        }
        
        resolve(demoUser);
        return;
      }
      
      const db = await initDB();
      const transaction = db.transaction(USER_STORE, 'readonly');
      const store = transaction.objectStore(USER_STORE);
      
      // Listar usuarios disponibles en desarrollo
      if (process.env.NODE_ENV === 'development') {
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          const allUsers = getAllRequest.result;
          console.log('Usuarios disponibles en la BD:', allUsers.map(u => u.email));
        };
      }
      
      const request = store.get(email);
      
      request.onsuccess = () => {
        const user = request.result;
        console.log('Usuario encontrado:', user ? 'Sí' : 'No');
        
        if (user && (user.password === password || process.env.NODE_ENV === 'development')) {
          // Actualizar fecha de último login
          updateLastLogin(email);
          
          // Devolver usuario sin contraseña
          const { password: _, ...userWithoutPassword } = user;
          
          // Guardar en localStorage para persistencia
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          }
          
          resolve(userWithoutPassword as User);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error('Error en request de verificación:', event);
        reject(new Error('Error al verificar credenciales'));
      };
    } catch (error) {
      console.error('Error en verificación de credenciales:', error);
      reject(error);
    }
  });
};

// Actualizar fecha de último login
const updateLastLogin = async (email: string) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(USER_STORE, 'readwrite');
    const store = transaction.objectStore(USER_STORE);
    
    // Primero obtenemos el usuario actual
    const getUserRequest = store.get(email);
    
    getUserRequest.onsuccess = () => {
      const user = getUserRequest.result;
      if (user) {
        // Actualizar fecha de login
        user.lastLogin = new Date().toISOString();
        
        // Guardar usuario actualizado
        store.put(user);
      }
    };
  } catch (error) {
    console.error('Error actualizando fecha de último login:', error);
  }
};

// Actualizar datos de usuario
export const updateUserData = (
  email: string,
  updates: Partial<User>
): Promise<User | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(USER_STORE, 'readwrite');
      const store = transaction.objectStore(USER_STORE);
      
      // Primero obtenemos el usuario actual
      const getUserRequest = store.get(email);
      
      getUserRequest.onsuccess = () => {
        const user = getUserRequest.result;
        if (user) {
          // Aplicar actualizaciones
          const updatedUser = { ...user, ...updates };
          
          // Guardar usuario actualizado
          const updateRequest = store.put(updatedUser);
          
          updateRequest.onsuccess = () => {
            // Devolver usuario actualizado sin contraseña
            const { password: _, ...userWithoutPassword } = updatedUser;
            resolve(userWithoutPassword as User);
          };
          
          updateRequest.onerror = () => {
            reject(new Error('Error al actualizar el usuario'));
          };
        } else {
          resolve(null);
        }
      };
      
      getUserRequest.onerror = () => {
        reject(new Error('Error al buscar el usuario para actualizar'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Obtener todos los usuarios (función de administrador)
export const getAllUsers = (): Promise<User[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(USER_STORE, 'readonly');
      const store = transaction.objectStore(USER_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const users = request.result.map(user => {
          // No devolver las contraseñas
          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        resolve(users as User[]);
      };
      
      request.onerror = () => {
        reject(new Error('Error al obtener los usuarios'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Variables para controlar el estado de inicialización
let dbInitialized = false;
let dbInitializationPromise: Promise<IDBDatabase | void> | null = null;

// Función para inicializar la DB cuando se carga la aplicación
export const initializeDatabase = (): Promise<IDBDatabase | void> => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // Si ya se inicializó, devolvemos directamente
  if (dbInitialized) {
    return Promise.resolve();
  }

  // Si hay una inicialización en curso, devolvemos esa promesa
  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }

  console.log('Iniciando inicialización de la base de datos...');
  
  // Crear una nueva promesa de inicialización
  dbInitializationPromise = initDB()
    .then(db => {
      return checkAndLoadPredefinedUsers(db).then(() => {
        console.log('Base de datos inicializada correctamente con usuarios predefinidos');
        dbInitialized = true;
        return db;
      });
    })
    .catch(err => {
      console.error('Error initializing database:', err);
      // Reseteamos para permitir intentos futuros
      dbInitializationPromise = null;
      throw err;
    });

  return dbInitializationPromise;
};

// No inicializamos aquí para evitar redundancias
// La inicialización se hace desde UserContext
