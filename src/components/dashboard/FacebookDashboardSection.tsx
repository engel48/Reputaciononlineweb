'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Facebook,
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
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FacebookData {
  page: {
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
      post_title: string;
    }>;
  };
  top_posts: Array<{
    post_id: string;
    post_title: string;
    total_comments: number;
    positive_comments: number;
    negative_comments: number;
    avg_sentiment: number;
  }>;
}

export default function FacebookDashboardSection() {
  const [data, setData] = useState<FacebookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/facebook/dashboard');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al cargar datos de Facebook');
      }

      setData(result.data);
    } catch (err: any) {
      console.error('Error cargando Facebook data:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/facebook/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPosts: 20, maxCommentsPerPost: 50 })
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
          <Loader2 className="w-8 h-8 animate-spin text-[#1877f2]" />
          <span className="ml-3 text-gray-600">Cargando datos de Facebook...</span>
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
              <p className="font-semibold text-yellow-900">Facebook no conectado</p>
              <p className="text-sm text-yellow-700">
                {error || 'Conecta tu cuenta de Facebook en Redes Sociales para ver estadísticas'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => window.location.href = '/dashboard/redes-sociales'}
            className="bg-[#1877f2] hover:bg-[#1664d8]"
          >
            <Facebook className="w-4 h-4 mr-2" />
            Conectar Facebook
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
      <Card className="col-span-full bg-gradient-to-br from-[#1877f2] to-[#1664d8] text-white border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Facebook className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">
                  Facebook Analytics
                </CardTitle>
                <CardDescription className="text-blue-100 space-y-1">
                  <div className="font-semibold">{data.page.name}</div>
                  <div className="text-sm">ID: {data.page.id}</div>
                  <div>{data.page.followers.toLocaleString()} seguidores · {data.page.total_posts} publicaciones</div>
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score de Reputación */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {data.overview.reputation_score}
              </div>
              <div className="text-blue-100 text-sm">Score de Reputación</div>
              <div className="mt-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {data.overview.reputation_score >= 80 ? 'Excelente' :
                   data.overview.reputation_score >= 60 ? 'Bueno' :
                   data.overview.reputation_score >= 40 ? 'Regular' : 'Necesita mejora'}
                </Badge>
              </div>
            </div>

            {/* Aprobación */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {approvalRating.toFixed(0)}%
              </div>
              <div className="text-blue-100 text-sm">Aprobación</div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <TrendIcon className={`w-5 h-5 ${trendColor.replace('text-', 'text-white/')}`} />
                <span className="text-sm text-blue-100">
                  {sentimentTrend === 'improving' ? 'Mejorando' :
                   sentimentTrend === 'declining' ? 'Declinando' : 'Estable'}
                </span>
              </div>
            </div>

            {/* Total Comentarios */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {data.overview.total_mentions.toLocaleString()}
              </div>
              <div className="text-blue-100 text-sm">Comentarios Totales</div>
              <div className="mt-2 text-sm text-blue-100">
                {data.trends.total_change > 0 ? '+' : ''}{data.trends.total_change} últimos 7 días
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sentimientos Positivos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <ThumbsUp className="w-4 h-4 mr-2 text-green-600" />
              Comentarios Positivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.overview.positive_mentions}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {data.sentiment_distribution.positive_percentage.toFixed(1)}% del total
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full"
                style={{ width: `${data.sentiment_distribution.positive_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sentimientos Negativos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <ThumbsDown className="w-4 h-4 mr-2 text-red-600" />
              Comentarios Negativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {data.overview.negative_mentions}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {data.sentiment_distribution.negative_percentage.toFixed(1)}% del total
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full"
                style={{ width: `${data.sentiment_distribution.negative_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sentimientos Neutrales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2 text-gray-600" />
              Comentarios Neutrales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {data.overview.neutral_mentions}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {data.sentiment_distribution.neutral_percentage.toFixed(1)}% del total
            </div>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-600 rounded-full"
                style={{ width: `${data.sentiment_distribution.neutral_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts y Comentarios Positivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-[#1877f2]" />
              Publicaciones Más Comentadas
            </CardTitle>
            <CardDescription>Tus publicaciones con más interacción</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_posts.slice(0, 3).map((post, index) => (
                <div key={post.post_id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#1877f2] text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {post.post_title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {post.total_comments} comentarios
                      </span>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">{post.positive_comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3 text-red-600" />
                        <span className="text-xs text-red-600">{post.negative_comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.top_posts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay publicaciones con comentarios aún</p>
                  <p className="text-sm">Haz clic en Sincronizar para obtener datos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Comentarios Positivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ThumbsUp className="w-5 h-5 mr-2 text-green-600" />
              Mejores Comentarios
            </CardTitle>
            <CardDescription>Comentarios más positivos con más likes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.top_mentions.most_positive.slice(0, 3).map((mention, index) => (
                <div key={index} className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-sm text-gray-800 line-clamp-2 mb-2">
                    "{mention.text}"
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">{mention.author}</span>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-3 h-3 text-green-600" />
                      <span className="text-green-700 font-semibold">{mention.likes}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Publicación: {mention.post_title}
                  </p>
                </div>
              ))}
              {data.top_mentions.most_positive.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay comentarios positivos aún</p>
                  <p className="text-sm">Haz clic en Sincronizar para obtener datos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Última sincronización */}
      {data.page.last_sync && (
        <div className="text-center text-sm text-gray-500">
          Última sincronización: {new Date(data.page.last_sync).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
    </div>
  );
}
