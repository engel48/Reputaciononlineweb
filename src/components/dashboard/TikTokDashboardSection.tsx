'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Music,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  BarChart3,
  Users,
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Play,
  Heart,
  Share2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TikTokData {
  profile: {
    id: string;
    name: string;
    url: string;
    followers: number;
    total_videos: number;
    engagement_rate: number;
    last_sync: string | null;
    connected: boolean;
  };
  overview: {
    reputation_score: number;
    total_mentions: number;
    positive_mentions: number;
    negative_mentions: number;
    neutral_mentions: number;
    avg_sentiment_score: number;
    reach_estimate: number;
    engagement_rate: number;
  };
  sentiment_distribution: {
    positive_percentage: number;
    negative_percentage: number;
    neutral_percentage: number;
  };
  trends: {
    last_7_days: Array<{
      date: string;
      total: number;
      positive: number;
      negative: number;
      neutral: number;
    }>;
    total_change: number;
    sentiment_trend: 'improving' | 'declining' | 'stable';
  };
  top_mentions: {
    most_positive: Array<{
      text: string;
      author: string;
      likes: number;
      url: string;
      video_id: string;
    }>;
  };
  top_videos: Array<{
    video_id: string;
    video_description: string;
    total_comments: number;
    positive_comments: number;
    negative_comments: number;
    avg_sentiment: number;
    views: number;
    likes: number;
  }>;
}

export default function TikTokDashboardSection() {
  const [data, setData] = useState<TikTokData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tiktok/dashboard');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al cargar datos de TikTok');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Error cargando TikTok data:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/tiktok/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxVideos: 20, maxCommentsPerVideo: 50 })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al sincronizar');
      }

      // Recargar datos después de sincronizar
      await loadData();
    } catch (err: any) {
      console.error('Error sincronizando:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#FE2C55]" />
          <span className="ml-3 text-gray-600">Cargando datos de TikTok...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="col-span-full border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
            <div>
              <p className="font-semibold text-yellow-900">TikTok no conectado</p>
              <p className="text-sm text-yellow-700">
                {error || 'Conecta tu cuenta de TikTok en Redes Sociales para ver estadísticas'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = '/dashboard/redes-sociales'}
            className="bg-[#FE2C55] hover:bg-[#FE2C55]/90"
          >
            <Music className="w-4 h-4 mr-2" />
            Conectar TikTok
          </Button>
        </CardContent>
      </Card>
    );
  }

  const approvalRating = data.overview.total_mentions > 0
    ? (data.overview.positive_mentions / data.overview.total_mentions) * 100
    : 0;

  const sentimentTrend = data.trends.sentiment_trend;
  const TrendIcon = sentimentTrend === 'improving' ? TrendingUp : sentimentTrend === 'declining' ? TrendingDown : BarChart3;
  const trendColor = sentimentTrend === 'improving' ? 'text-green-600' : sentimentTrend === 'declining' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="space-y-6">
      {/* Header con Score Principal */}
      <Card className="col-span-full bg-gradient-to-br from-[#FE2C55] to-[#25F4EE] text-white border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Music className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  TikTok Analytics
                </CardTitle>
                <CardDescription className="text-white/90 space-y-1">
                  <div className="font-semibold">{data.profile.name}</div>
                  <div className="text-sm">ID: {data.profile.id}</div>
                  <div>{data.profile.followers.toLocaleString()} seguidores · {data.profile.total_videos} videos</div>
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {/* Badge de estado */}
              <Badge className="bg-white/20 text-white border-white/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Conectado
              </Badge>

              {/* Botón de sincronización */}
              <Button
                onClick={handleSync}
                disabled={syncing}
                size="sm"
                variant="outline"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Score Principal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{data.overview.reputation_score}</div>
              <div className="text-sm text-white/80">Score Reputación</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{approvalRating.toFixed(1)}%</div>
              <div className="text-sm text-white/80">Aprobación</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{data.overview.total_mentions.toLocaleString()}</div>
              <div className="text-sm text-white/80">Total Comentarios</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{data.overview.engagement_rate.toFixed(1)}%</div>
              <div className="text-sm text-white/80">Engagement Rate</div>
            </div>
          </div>

          {/* Última sincronización */}
          {data.profile.last_sync && (
            <div className="mt-4 text-sm text-white/70 text-center">
              Última sincronización: {new Date(data.profile.last_sync).toLocaleString('es-CO')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de Métricas Detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sentimiento Positivo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comentarios Positivos</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.overview.positive_mentions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.sentiment_distribution.positive_percentage.toFixed(1)}% del total
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${data.sentiment_distribution.positive_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sentimiento Negativo */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comentarios Negativos</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.overview.negative_mentions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.sentiment_distribution.negative_percentage.toFixed(1)}% del total
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${data.sentiment_distribution.negative_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sentimiento Neutral */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comentarios Neutrales</CardTitle>
            <MessageCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {data.overview.neutral_mentions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.sentiment_distribution.neutral_percentage.toFixed(1)}% del total
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${data.sentiment_distribution.neutral_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tendencias y Videos Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de Sentimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendIcon className={`w-5 h-5 ${trendColor}`} />
              Tendencia de Sentimiento
            </CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={sentimentTrend === 'improving' ? 'default' : sentimentTrend === 'declining' ? 'destructive' : 'secondary'}>
                  {sentimentTrend === 'improving' ? 'Mejorando' : sentimentTrend === 'declining' ? 'Declinando' : 'Estable'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cambio total:</span>
                <span className={`text-lg font-bold ${data.trends.total_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.trends.total_change >= 0 ? '+' : ''}{data.trends.total_change}%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Promedio de sentimiento: {data.overview.avg_sentiment_score.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos con Mejor Rendimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-[#FE2C55]" />
              Videos Top (Mejor Sentimiento)
            </CardTitle>
            <CardDescription>Videos con más comentarios positivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_videos.slice(0, 3).map((video, index) => (
                <div key={video.video_id} className="border-l-4 border-[#FE2C55] pl-3 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-2 mb-2">
                        {video.video_description || 'Sin descripción'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {video.views.toLocaleString()} vistas
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {video.likes.toLocaleString()} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {video.total_comments} comentarios
                        </span>
                      </div>
                    </div>
                    <Badge variant={video.avg_sentiment > 0.5 ? 'default' : video.avg_sentiment < -0.5 ? 'destructive' : 'secondary'}>
                      {(video.avg_sentiment * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comentarios Más Positivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#FE2C55]" />
            Comentarios Destacados Positivos
          </CardTitle>
          <CardDescription>Los comentarios con mejor recepción</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.top_mentions.most_positive.slice(0, 5).map((mention, index) => (
              <motion.div
                key={mention.video_id + index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 mb-2">{mention.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">@{mention.author}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {mention.likes.toLocaleString()}
                      </span>
                      {mention.url && (
                        <a
                          href={mention.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FE2C55] hover:underline"
                        >
                          Ver en TikTok
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Alcance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FE2C55]" />
            Alcance e Impacto
          </CardTitle>
          <CardDescription>Estimaciones de alcance en TikTok</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-3xl font-bold text-[#FE2C55]">
                {data.overview.reach_estimate.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">Alcance estimado</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FE2C55]">
                {data.profile.engagement_rate.toFixed(2)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Tasa de engagement</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
