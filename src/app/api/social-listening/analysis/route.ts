import { NextRequest, NextResponse } from "next/server"
import { db as prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SocialListeningService } from "@/services/socialMediaService"
import { SentimentAnalysisService } from "@/services/sentimentAnalysisService"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const days = parseInt(searchParams.get('days') || '30')

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        socialMedia: {
          where: platform ? { platform, connected: true } : { connected: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener datos recientes para análisis
    const socialListeningService = new SocialListeningService()
    const sentimentAnalysisService = new SentimentAnalysisService()
    
    const socialMetrics = await socialListeningService.extractDataForUser(user.id)
    
    const analysisResults = []

    for (const metrics of socialMetrics) {
      if (platform && metrics.platform !== platform) continue

      // Filtrar posts de los últimos X días
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const recentPosts = metrics.recentPosts.filter(post => 
        new Date(post.date) >= cutoffDate
      )

      if (recentPosts.length === 0) {
        analysisResults.push({
          platform: metrics.platform,
          username: metrics.username,
          metrics: {
            followers: metrics.followers,
            following: metrics.following,
            posts: metrics.posts,
            engagement: metrics.engagement
          },
          sentimentAnalysis: {
            totalPosts: 0,
            averageScore: 50,
            sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
            topKeywords: [],
            topEmotions: [],
            trend: 'stable'
          },
          recentPosts: []
        })
        continue
      }

      // Analizar sentimiento
      const sentimentResults = await sentimentAnalysisService.analyzeBatchSentiment(recentPosts)
      const sentimentSummary = sentimentAnalysisService.generateSentimentSummary(sentimentResults)

      analysisResults.push({
        platform: metrics.platform,
        username: metrics.username,
        metrics: {
          followers: metrics.followers,
          following: metrics.following,
          posts: metrics.posts,
          engagement: metrics.engagement
        },
        sentimentAnalysis: sentimentSummary,
        recentPosts: sentimentResults.slice(0, 10).map(r => ({
          id: r.postId,
          content: r.originalPost.content.length > 150 
            ? r.originalPost.content.substring(0, 150) + '...'
            : r.originalPost.content,
          sentiment: r.sentiment.sentiment,
          score: r.sentiment.score,
          confidence: r.sentiment.confidence,
          keywords: r.sentiment.keywords,
          emotions: r.sentiment.emotions,
          date: r.originalPost.date,
          engagement: {
            likes: r.originalPost.likes,
            shares: r.originalPost.shares,
            comments: r.originalPost.comments,
            total: r.originalPost.likes + r.originalPost.shares + r.originalPost.comments
          },
          url: r.originalPost.url
        }))
      })
    }

    // Calcular métricas globales
    const globalMetrics = {
      totalFollowers: analysisResults.reduce((sum, r) => sum + r.metrics.followers, 0),
      totalPosts: analysisResults.reduce((sum, r) => sum + r.sentimentAnalysis.totalPosts, 0),
      averageEngagement: analysisResults.length > 0 
        ? analysisResults.reduce((sum, r) => sum + r.metrics.engagement, 0) / analysisResults.length
        : 0,
      overallSentiment: analysisResults.length > 0
        ? analysisResults.reduce((sum, r) => sum + r.sentimentAnalysis.averageScore, 0) / analysisResults.length
        : 50
    }

    // Combinar todas las palabras clave y emociones
    const allKeywords: { [key: string]: number } = {}
    const allEmotions: { [key: string]: number } = {}
    
    analysisResults.forEach(result => {
      result.sentimentAnalysis.topKeywords.forEach(keyword => {
        allKeywords[keyword] = (allKeywords[keyword] || 0) + 1
      })
      result.sentimentAnalysis.topEmotions.forEach(emotion => {
        allEmotions[emotion] = (allEmotions[emotion] || 0) + 1
      })
    })

    const topGlobalKeywords = Object.entries(allKeywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([keyword, count]) => ({ keyword, count }))

    const topGlobalEmotions = Object.entries(allEmotions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([emotion, count]) => ({ emotion, count }))

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        analysisDate: new Date().toISOString(),
        period: `${days} días`,
        globalMetrics,
        topGlobalKeywords,
        topGlobalEmotions,
        platformAnalysis: analysisResults,
        connectedPlatforms: user.socialMedia.length
      }
    })

  } catch (error) {
    console.error("Error en análisis de social listening:", error)
    return NextResponse.json(
      { error: "Error interno del servidor durante el análisis" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { text, platform } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: "Texto requerido para análisis" }, { status: 400 })
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Realizar análisis de sentimiento individual
    const sentimentAnalysisService = new SentimentAnalysisService()
    const result = await sentimentAnalysisService.analyzeSentiment(text)

    return NextResponse.json({
      success: true,
      data: {
        text: text.length > 200 ? text.substring(0, 200) + '...' : text,
        platform: platform || 'manual',
        analysisDate: new Date().toISOString(),
        sentiment: result
      }
    })

  } catch (error) {
    console.error("Error en análisis individual de sentimiento:", error)
    return NextResponse.json(
      { error: "Error interno del servidor durante el análisis" },
      { status: 500 }
    )
  }
}
