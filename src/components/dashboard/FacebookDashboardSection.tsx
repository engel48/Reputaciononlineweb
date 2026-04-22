'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  ExternalLink,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

// Helper para obtener el label del score
function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Regular';
  return 'Bajo';
}

// Helper para obtener color del score
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[#00E5FF]';
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
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

      const response = await fetch('/api/facebook/dashboard', { credentials: 'include' });
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPosts: 20, maxCommentsPerPost: 50 })
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

  // Loading State - Enterprise Design
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Profile Card Skeleton */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-[#1877F2] flex items-center justify-center">
                  <Facebook className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00E5FF]/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando Facebook Analytics...</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <CardContent className="p-5">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error/Not Connected State - Clean Design
  if (error || !data) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#1877F2]/10 dark:bg-[#1877F2]/20 flex items-center justify-center mb-4">
              <Facebook className="w-10 h-10 text-[#1877F2]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Facebook no conectado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-md">
              {error || 'Conecta tu página de Facebook para ver estadísticas de reputación, comentarios y análisis de sentimiento.'}
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard/redes-sociales'}
              className="bg-[#1877F2] hover:bg-[#1664d8] text-white"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Conectar Facebook
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
  const TrendIcon = sentimentTrend === 'improving' ? TrendingUp : sentimentTrend === 'declining' ? TrendingDown : Minus;
  const trendColor = sentimentTrend === 'improving' ? 'text-green-500' : sentimentTrend === 'declining' ? 'text-red-500' : 'text-gray-500';
  const trendLabel = sentimentTrend === 'improving' ? 'Mejorando' : sentimentTrend === 'declining' ? 'Declinando' : 'Estable';

  return (
    <div className="space-y-6">
      {/* Profile Card - Compact Design */}
      <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Facebook Icon */}
              <div className="w-14 h-14 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-lg">
                <Facebook className="w-7 h-7 text-white" />
              </div>

              {/* Page Info */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {data.page.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#00E5FF]/10 text-[#0B1120] dark:text-[#00E5FF] border border-[#00E5FF]/30">
                    Conectado
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {data.page.followers.toLocaleString()} seguidores
                  </span>
                  <span>•</span>
                  <span>{data.page.total_posts} publicaciones</span>
                </div>
              </div>
            </div>

            {/* Sync Button */}
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="border-[#00E5FF]/30 text-[#0B1120] dark:text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards - 3 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Score de Reputación
              </span>
              <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getScoreColor(data.overview.reputation_score)}`}>
                {data.overview.reputation_score}
              </span>
              <span className="text-sm text-gray-400">/100</span>
            </div>
            <div className="mt-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                data.overview.reputation_score >= 60
                  ? 'bg-[#00E5FF]/10 text-[#0B1120] dark:text-[#00E5FF]'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                {getScoreLabel(data.overview.reputation_score)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Approval Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tasa de Aprobación
              </span>
              <ThumbsUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {approvalRating.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {trendLabel}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Comments Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Comentarios Totales
              </span>
              <MessageCircle className="w-4 h-4 text-[#1877F2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.overview.total_mentions.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-xs font-medium ${data.trends.total_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.trends.total_change >= 0 ? '+' : ''}{data.trends.total_change}
              </span>
              <span className="text-xs text-gray-400">últimos 7 días</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Positive */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Positivos</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.overview.positive_mentions}
              </span>
              <span className="text-sm text-gray-400">
                ({data.sentiment_distribution.positive_percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${data.sentiment_distribution.positive_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Negative */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Negativos</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data.overview.negative_mentions}
              </span>
              <span className="text-sm text-gray-400">
                ({data.sentiment_distribution.negative_percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${data.sentiment_distribution.negative_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Neutral */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Neutrales</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {data.overview.neutral_mentions}
              </span>
              <span className="text-sm text-gray-400">
                ({data.sentiment_distribution.neutral_percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full transition-all duration-500"
                style={{ width: `${data.sentiment_distribution.neutral_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold text-gray-900 dark:text-white">
              <FileText className="w-4 h-4 mr-2 text-[#1877F2]" />
              Publicaciones Más Comentadas
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              Tus publicaciones con más interacción
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {data.top_posts.slice(0, 3).map((post, index) => (
                <div
                  key={post.post_id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-shrink-0 w-7 h-7 bg-[#1877F2] text-white rounded-lg flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                      {post.post_title}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {post.total_comments} comentarios
                      </span>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">{post.positive_comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">{post.negative_comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.top_posts.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No hay publicaciones con comentarios aún</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Sincroniza para obtener datos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Comments */}
        <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base font-semibold text-gray-900 dark:text-white">
              <ThumbsUp className="w-4 h-4 mr-2 text-green-500" />
              Mejores Comentarios
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              Comentarios positivos con más interacción
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {data.top_mentions.most_positive.slice(0, 3).map((mention, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50"
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
                    "{mention.text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {mention.author}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                        {mention.likes}
                      </span>
                      {mention.url && (
                        <a
                          href={mention.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-[#00E5FF] hover:text-[#00B8D4]"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {mention.post_title && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 truncate">
                      Publicación: {mention.post_title}
                    </p>
                  )}
                </div>
              ))}
              {data.top_mentions.most_positive.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-green-500 dark:text-green-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No hay comentarios positivos aún</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Sincroniza para obtener datos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Sync Footer */}
      {data.page.last_sync && (
        <div className="text-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Última sincronización: {new Date(data.page.last_sync).toLocaleString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )}
    </div>
  );
}
