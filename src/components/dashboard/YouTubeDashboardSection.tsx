'use client';

import React, { useState, useEffect } from 'react';
import {
  Youtube,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  BarChart3,
  Video,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface YouTubeData {
  channel: {
    id: string;
    name: string;
    url: string;
    followers: number;
    total_posts: number;
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
      video_title: string;
    }>;
  };
  top_videos: Array<{
    video_id: string;
    video_title: string;
    total_comments: number;
    positive_comments: number;
    negative_comments: number;
    avg_sentiment: number;
  }>;
}

export default function YouTubeDashboardSection() {
  const [data, setData] = useState<YouTubeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/youtube/dashboard', { credentials: 'include' });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al cargar datos de YouTube');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Error cargando YouTube data:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/youtube/sync', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxVideos: 20, maxCommentsPerVideo: 50 })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al sincronizar');
      }

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

  // Estado de carga mejorado
  if (loading) {
    return (
      <Card className="col-span-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Youtube className="w-8 h-8 text-red-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-900 dark:text-white">Cargando YouTube Analytics</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Obteniendo datos del canal...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado de error / no conectado mejorado
  if (error || !data) {
    return (
      <Card className="col-span-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Youtube className="w-10 h-10 text-gray-400" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">YouTube no conectado</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {error || 'Conecta tu canal de YouTube para ver estadísticas de comentarios y engagement'}
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard/redes-sociales'}
              className="bg-[#00E5FF] hover:bg-[#00B8D4] text-[#0B1120] font-medium"
            >
              <Youtube className="w-4 h-4 mr-2" />
              Conectar YouTube
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const approvalRating = data.overview.total_mentions > 0
    ? (data.overview.positive_mentions / data.overview.total_mentions) * 100
    : 0;

  const sentimentTrend = data.trends.sentiment_trend;
  const TrendIcon = sentimentTrend === 'improving' ? TrendingUp : sentimentTrend === 'declining' ? TrendingDown : BarChart3;

  return (
    <div className="space-y-6">
      {/* Header: Perfil del Canal */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Youtube className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{data.channel.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data.channel.followers.toLocaleString()} suscriptores • {data.channel.total_posts} videos
                </p>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF]/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score de Reputación */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Score de Reputación</span>
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#00E5FF]" />
              </div>
            </div>
            <div className="text-4xl font-bold text-[#0B1120] dark:text-white mb-1">
              {data.overview.reputation_score}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.overview.reputation_score >= 80 ? 'Excelente' :
               data.overview.reputation_score >= 60 ? 'Bueno' :
               data.overview.reputation_score >= 40 ? 'Regular' : 'Necesita mejora'}
            </p>
          </CardContent>
        </Card>

        {/* Aprobación */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Aprobación</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                sentimentTrend === 'improving' ? 'bg-green-100 dark:bg-green-900/30' :
                sentimentTrend === 'declining' ? 'bg-red-100 dark:bg-red-900/30' :
                'bg-gray-100 dark:bg-gray-700'
              }`}>
                <TrendIcon className={`w-5 h-5 ${
                  sentimentTrend === 'improving' ? 'text-green-600' :
                  sentimentTrend === 'declining' ? 'text-red-600' :
                  'text-gray-600'
                }`} />
              </div>
            </div>
            <div className="text-4xl font-bold text-[#0B1120] dark:text-white mb-1">
              {approvalRating.toFixed(0)}%
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sentimentTrend === 'improving' ? 'Mejorando' :
               sentimentTrend === 'declining' ? 'Declinando' : 'Estable'}
            </p>
          </CardContent>
        </Card>

        {/* Total Comentarios */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Comentarios</span>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-[#0B1120] dark:text-white mb-1">
              {data.overview.total_mentions.toLocaleString()}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.trends.total_change > 0 ? '+' : ''}{data.trends.total_change} últimos 7 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de Sentimiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Positivos</span>
                  <span className="font-bold text-green-600">{data.overview.positive_mentions}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${data.sentiment_distribution.positive_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Neutrales</span>
                  <span className="font-bold text-gray-600 dark:text-gray-400">{data.overview.neutral_mentions}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full transition-all"
                    style={{ width: `${data.sentiment_distribution.neutral_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ThumbsDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Negativos</span>
                  <span className="font-bold text-red-600">{data.overview.negative_mentions}</span>
                </div>
                <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${data.sentiment_distribution.negative_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Videos y Comentarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Videos */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Video className="w-5 h-5 mr-2 text-red-600" />
              Videos Más Comentados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_videos.slice(0, 3).map((video, index) => (
                <div key={video.video_id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#0B1120] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {video.video_title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {video.total_comments} comentarios
                      </span>
                      <div className="flex items-center gap-1 text-green-600">
                        <ThumbsUp className="w-3 h-3" />
                        {video.positive_comments}
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <ThumbsDown className="w-3 h-3" />
                        {video.negative_comments}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.top_videos.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay videos con comentarios</p>
                  <Button
                    onClick={handleSync}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Sincronizar ahora
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mejores Comentarios */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <ThumbsUp className="w-5 h-5 mr-2 text-green-600" />
              Mejores Comentarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_mentions.most_positive.slice(0, 3).map((mention, index) => (
                <div key={index} className="p-3 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/20">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                    "{mention.text}"
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{mention.author}</span>
                    <div className="flex items-center gap-1 text-[#00E5FF]">
                      <ThumbsUp className="w-3 h-3" />
                      <span className="font-semibold">{mention.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
              {data.top_mentions.most_positive.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay comentarios positivos aún</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Última sincronización */}
      {data.channel.last_sync && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Última sincronización: {new Date(data.channel.last_sync).toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      )}
    </div>
  );
}
