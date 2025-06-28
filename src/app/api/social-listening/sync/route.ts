import { NextRequest, NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SocialListeningService } from "@/services/socialMediaService"
import { SentimentAnalysisService } from "@/services/sentimentAnalysisService"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Inicializar servicios
    const socialListeningService = new SocialListeningService()
    const sentimentAnalysisService = new SentimentAnalysisService()

    // Extraer datos de todas las redes sociales del usuario
    console.log(`Iniciando extracción de datos para usuario: ${user.id}`)
    const socialMetrics = await socialListeningService.extractDataForUser(user.id)

    const syncResults = []

    for (const metrics of socialMetrics) {
      console.log(`Procesando ${metrics.platform} - ${metrics.recentPosts.length} posts`)
      
      // Analizar sentimiento de los posts recientes
      let sentimentResults: any[] = []
      if (metrics.recentPosts.length > 0) {
        sentimentResults = await sentimentAnalysisService.analyzeBatchSentiment(metrics.recentPosts)
      }

      // Generar resumen de sentimiento
      const sentimentSummary = sentimentAnalysisService.generateSentimentSummary(sentimentResults)

      // Actualizar la conexión de red social con las nuevas métricas
      await prisma.socialMedia.updateMany({
        where: {
          userId: user.id,
          platform: metrics.platform
        },
        data: {
          followers: metrics.followers,
          following: metrics.following,
          posts: metrics.posts,
          engagement: metrics.engagement,
          lastSync: new Date()
        }
      })

      // Crear registros de análisis de sentimiento (necesitaremos una nueva tabla)
      const syncResult = {
        platform: metrics.platform,
        username: metrics.username,
        postsAnalyzed: sentimentResults.length,
        sentimentSummary,
        metrics: {
          followers: metrics.followers,
          following: metrics.following,
          posts: metrics.posts,
          engagement: metrics.engagement
        },
        recentPosts: sentimentResults.map(r => ({
          id: r.postId,
          content: r.originalPost.content.substring(0, 100) + '...',
          sentiment: r.sentiment.sentiment,
          score: r.sentiment.score,
          date: r.originalPost.date,
          engagement: r.originalPost.likes + r.originalPost.shares + r.originalPost.comments
        }))
      }

      syncResults.push(syncResult)
    }

    console.log(`Sincronización completada para ${syncResults.length} plataformas`)

    return NextResponse.json({
      success: true,
      message: "Sincronización completada exitosamente",
      data: {
        userId: user.id,
        syncTimestamp: new Date().toISOString(),
        platformsProcessed: syncResults.length,
        results: syncResults
      }
    })

  } catch (error) {
    console.error("Error en sincronización de social listening:", error)
    return NextResponse.json(
      { error: "Error interno del servidor durante la sincronización" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        socialMedia: {
          where: { connected: true },
          select: {
            platform: true,
            username: true,
            followers: true,
            following: true,
            posts: true,
            engagement: true,
            lastSync: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        connectedPlatforms: user.socialMedia.length,
        lastSync: user.socialMedia.reduce((latest, sm) => {
          return !latest || (sm.lastSync && sm.lastSync > latest) ? sm.lastSync : latest
        }, null as Date | null),
        platforms: user.socialMedia
      }
    })

  } catch (error) {
    console.error("Error obteniendo datos de sincronización:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
