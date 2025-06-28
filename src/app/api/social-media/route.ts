import { NextRequest, NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET: Obtener plataformas disponibles y estado de conexión del usuario
export async function GET(request: NextRequest) {
  try {
    // Datos de plataformas hardcodeadas como fallback SIEMPRE disponibles
    const defaultPlatforms = [
      {
        id: 'facebook-platform',
        name: 'Facebook',
        platform: 'facebook',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'x-platform', 
        name: 'X (Twitter)',
        platform: 'x',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'instagram-platform',
        name: 'Instagram', 
        platform: 'instagram',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'threads-platform',
        name: 'Threads',
        platform: 'threads', 
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'linkedin-platform',
        name: 'LinkedIn',
        platform: 'linkedin',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'youtube-platform',
        name: 'YouTube',
        platform: 'youtube',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'tiktok-platform',
        name: 'TikTok',
        platform: 'tiktok',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      }
    ]

    const session = await getServerSession(authOptions)
    
    // Si no hay sesión (como en onboarding), devolver plataformas sin conexiones
    if (!session?.user?.email) {
      console.log('Sin sesión - devolviendo plataformas por defecto para onboarding')
      return NextResponse.json(defaultPlatforms)
    }

    // Si hay sesión, intentar obtener el estado real de conexiones
    try {
      // Buscar usuario por email para obtener el ID
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })

      if (!user) {
        console.log('Usuario no encontrado - devolviendo plataformas por defecto')
        return NextResponse.json(defaultPlatforms)
      }

      // Obtener las conexiones del usuario
      const userConnections = await prisma.socialMedia.findMany({
        where: { 
          userId: user.id,
          connected: true 
        }
      })

      // Combinar información con conexiones reales
      const platformsWithStatus = defaultPlatforms.map((platform) => {
        const connection = userConnections.find((conn) => conn.platform === platform.platform)
        
        return {
          ...platform,
          connected: !!connection,
          username: connection?.username || null,
          profileUrl: connection?.profileUrl || null,
          followers: connection?.followers || 0,
          lastSync: null // Campo no disponible en el modelo actual
        }
      })

      console.log('Devolviendo plataformas con estado de conexión real')
      return NextResponse.json(platformsWithStatus)
    } catch (dbError) {
      console.log('Error de DB - devolviendo plataformas por defecto:', dbError)
      return NextResponse.json(defaultPlatforms)
    }
  } catch (error) {
    console.error('Error general en API social-media:', error)
    
    // Como último recurso, devolver plataformas hardcodeadas
    const fallbackPlatforms = [
      {
        id: 'facebook-platform',
        name: 'Facebook',
        platform: 'facebook',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'x-platform', 
        name: 'X (Twitter)',
        platform: 'x',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'instagram-platform',
        name: 'Instagram', 
        platform: 'instagram',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'threads-platform',
        name: 'Threads',
        platform: 'threads', 
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'linkedin-platform',
        name: 'LinkedIn',
        platform: 'linkedin',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'youtube-platform',
        name: 'YouTube',
        platform: 'youtube',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      },
      {
        id: 'tiktok-platform',
        name: 'TikTok',
        platform: 'tiktok',
        isActive: true,
        connected: false,
        username: null,
        profileUrl: null,
        followers: 0,
        lastSync: null
      }
    ]
    
    return NextResponse.json(fallbackPlatforms)
  }
}

// POST: Desconectar una red social
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Buscar usuario por email para obtener el ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const { platform, action } = await request.json()

    if (action === 'disconnect') {
      // Desconectar la plataforma
      await prisma.socialMedia.updateMany({
        where: {
          userId: user.id,
          platform: platform
        },
        data: {
          connected: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null
        }
      })

      return NextResponse.json({ success: true, message: `${platform} desconectado exitosamente` })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error('Error manejando solicitud de red social:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    )
  }
}
