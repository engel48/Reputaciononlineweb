'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge" // Corregido import del componente Badge
import { 
  RefreshCw, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Heart,
  Share2,
  BarChart3,
  Eye,
  Calendar,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SocialMetrics {
  platform: string
  username: string
  followers: number
  following: number
  posts: number
  engagement: number
  lastSync: string | null
}

interface SentimentData {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  distribution: {
    positive: number
    negative: number
    neutral: number
  }
  topKeywords: string[]
  topEmotions: string[]
  trend: 'positive' | 'negative' | 'stable'
  totalPosts: number
  averageScore: number
  sentimentDistribution: {
    positive: number
    negative: number
    neutral: number
  }
}

interface SocialPost {
  id: string
  content: string
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  date: string
  engagement: {
    likes: number
    shares: number
    comments: number
    total: number
  }
}

interface PlatformAnalysis {
  platform: string
  username: string
  metrics: SocialMetrics
  sentimentAnalysis: SentimentData
  recentPosts: SocialPost[]
}

export function SocialListeningCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [syncData, setSyncData] = useState<any>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadSyncData()
    loadAnalysisData()
  }, [])

  const loadSyncData = async () => {
    try {
      const response = await fetch('/api/social-listening/sync')
      if (response.ok) {
        const data = await response.json()
        setSyncData(data.data)
      }
    } catch (error) {
      console.error('Error loading sync data:', error)
    }
  }

  const loadAnalysisData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/social-listening/analysis')
      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data.data)
      }
    } catch (error) {
      console.error('Error loading analysis data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/social-listening/sync', {
        method: 'POST'
      })
      
      if (response.ok) {
        await loadSyncData()
        await loadAnalysisData()
      }
    } catch (error) {
      console.error('Error syncing data:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      facebook: '📘',
      x: '🐦',
      instagram: '📷',
      linkedin: '💼',
      youtube: '📹',
      tiktok: '🎵',
      threads: '🧵'
    }
    return icons[platform] || '📱'
  }

  const getSentimentColor = (sentiment: string, score: number) => {
    if (sentiment === 'positive' || score >= 70) return 'text-green-600 bg-green-50'
    if (sentiment === 'negative' || score <= 30) return 'text-red-600 bg-red-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  const getSentimentText = (sentiment: string, score: number) => {
    if (sentiment === 'positive' || score >= 70) return 'Positivo'
    if (sentiment === 'negative' || score <= 30) return 'Negativo'
    return 'Neutral'
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#01257D]" />
            Social Listening & Análisis IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-[#01257D]" />
            <span className="ml-2">Cargando análisis...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysisData || !analysisData.platformAnalysis || analysisData.platformAnalysis.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#01257D]" />
            Social Listening & Análisis IA
          </CardTitle>
          <CardDescription>
            Análisis en tiempo real de tus redes sociales conectadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No hay redes sociales conectadas para analizar
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard/perfil'}
              className="bg-[#01257D] hover:bg-[#013AAA] text-white"
            >
              Conectar Redes Sociales
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#01257D]" />
              Social Listening & Análisis IA
            </CardTitle>
            <CardDescription>
              Análisis en tiempo real de {analysisData.connectedPlatforms} plataformas conectadas
            </CardDescription>
          </div>
          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            size="sm"
            className="border-[#01257D] text-[#01257D] hover:bg-[#01257D] hover:text-white"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#01257D]">
              {formatNumber(analysisData.globalMetrics.totalFollowers)}
            </div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Seguidores totales
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#01257D]">
              {analysisData.globalMetrics.totalPosts}
            </div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Posts analizados
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#01257D]">
              {analysisData.globalMetrics.averageEngagement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Engagement prom.
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getSentimentColor('', analysisData.globalMetrics.overallSentiment).split(' ')[0]}`}>
              {analysisData.globalMetrics.overallSentiment.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Sentimiento general
            </div>
          </div>
        </div>

        {/* Análisis por Plataforma */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#01257D]">Análisis por Plataforma</h3>
          {analysisData.platformAnalysis.map((platform: PlatformAnalysis) => (
            <Card key={platform.platform} className="border-l-4 border-l-[#01257D]">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlatformIcon(platform.platform)}</span>
                    <div>
                      <h4 className="font-semibold capitalize">{platform.platform}</h4>
                      <p className="text-sm text-gray-500">@{platform.username}</p>
                    </div>
                  </div>
                  <Badge 
                    className={getSentimentColor(
                      platform.sentimentAnalysis.trend, 
                      platform.sentimentAnalysis.averageScore
                    )}
                  >
                    {getSentimentText(
                      platform.sentimentAnalysis.trend, 
                      platform.sentimentAnalysis.averageScore
                    )} ({platform.sentimentAnalysis.averageScore})
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#01257D]">
                      {formatNumber(platform.metrics.followers)}
                    </div>
                    <div className="text-xs text-gray-500">Seguidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#01257D]">
                      {platform.sentimentAnalysis.totalPosts}
                    </div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#01257D]">
                      {platform.metrics.engagement.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center gap-1">
                      <span className="text-green-600">{platform.sentimentAnalysis.sentimentDistribution.positive}%</span>
                      <span className="text-yellow-600">{platform.sentimentAnalysis.sentimentDistribution.neutral}%</span>
                      <span className="text-red-600">{platform.sentimentAnalysis.sentimentDistribution.negative}%</span>
                    </div>
                    <div className="text-xs text-gray-500">Pos/Neu/Neg</div>
                  </div>
                </div>

                {/* Posts Recientes */}
                {platform.recentPosts.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Posts Recientes</h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {platform.recentPosts.slice(0, 3).map((post) => (
                        <div key={post.id} className="border rounded p-2 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Badge 
                              variant="outline"
                              className={getSentimentColor(post.sentiment, post.score)}
                            >
                              {getSentimentText(post.sentiment, post.score)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(post.date), 'dd MMM', { locale: es })}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.engagement.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {post.engagement.shares}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.engagement.comments}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Palabras Clave y Emociones Globales */}
        {analysisData.topGlobalKeywords.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-[#01257D] mb-3">Palabras Clave Principales</h3>
              <div className="flex flex-wrap gap-2">
                {analysisData.topGlobalKeywords.slice(0, 10).map((item: any, index: number) => (
                  <Badge 
                    key={item.keyword} 
                    variant="outline"
                    className="border-[#01257D] text-[#01257D]"
                  >
                    {item.keyword} ({item.count})
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#01257D] mb-3">Emociones Detectadas</h3>
              <div className="flex flex-wrap gap-2">
                {analysisData.topGlobalEmotions.slice(0, 8).map((item: any, index: number) => (
                  <Badge 
                    key={item.emotion} 
                    variant="outline"
                    className="border-[#01257D] text-[#01257D]"
                  >
                    {item.emotion} ({item.count})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Información de última sincronización */}
        {syncData?.lastSync && (
          <div className="text-xs text-gray-500 text-center">
            Última sincronización: {format(new Date(syncData.lastSync), 'dd/MM/yyyy HH:mm', { locale: es })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
