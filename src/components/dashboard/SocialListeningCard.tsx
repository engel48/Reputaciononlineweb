'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw, TrendingUp, Users, MessageCircle, Heart, Share2, BarChart3,
  Activity, ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Mention {
  id: string;
  content: string;
  url: string | null;
  author: string;
  authorFollowers: number;
  publishedAt: string;
  likes: number;
  shares: number;
  comments: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number | null;
}

interface PlatformAnalysis {
  platform: string;
  username: string;
  displayName: string;
  profileUrl: string;
  profileImage: string | null;
  followers: number;
  following: number;
  posts: number;
  engagement: number;
  lastSync: string | null;
  mentionsInPeriod: number;
  sentimentDistribution: { positive: number; neutral: number; negative: number };
  averageScore: number;
  recentMentions: Mention[];
}

interface ApiResponse {
  success: boolean;
  period: { days: number; since: string };
  summary: {
    connectedPlatforms: number;
    totalFollowers: number;
    totalMentions: number;
    totalEngagement: number;
    totalReach: number;
    overallSentiment: number;
    sentimentDistribution: { positive: number; neutral: number; negative: number };
    lastSync: string | null;
  };
  platforms: PlatformAnalysis[];
  topHashtags: Array<{ tag: string; count: number }>;
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  x: 'X (Twitter)',
  twitter: 'X (Twitter)',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function sentimentBadgeClass(sentiment: string, score: number | null): string {
  if (sentiment === 'positive' || (score !== null && score >= 70)) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  if (sentiment === 'negative' || (score !== null && score <= 30)) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
}

function sentimentLabel(sentiment: string, score: number | null): string {
  if (sentiment === 'positive' || (score !== null && score >= 70)) return 'Positivo';
  if (sentiment === 'negative' || (score !== null && score <= 30)) return 'Negativo';
  return 'Neutral';
}

export function SocialListeningCard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/social-listening?days=${days}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ApiResponse;
      if (!json.success) throw new Error('Respuesta sin success');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#01257D]" />
            Social Listening
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-gray-500">
            <RefreshCw className="h-6 w-6 animate-spin mr-2 text-[#01257D]" />
            Cargando datos reales...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#01257D]" />
            Social Listening
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              <strong>Error:</strong> {error}
            </p>
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.summary.connectedPlatforms === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#01257D]" />
            Social Listening
          </CardTitle>
          <CardDescription>
            Analisis de tus redes sociales conectadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No tienes redes sociales conectadas todavia.</p>
            <Button
              onClick={() => (window.location.href = '/dashboard/redes-sociales')}
              className="bg-[#01257D] hover:bg-[#013AAA] text-white"
            >
              Conectar Redes Sociales
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, platforms, topHashtags } = data;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#01257D]" />
              Social Listening
            </CardTitle>
            <CardDescription>
              {summary.connectedPlatforms} plataforma{summary.connectedPlatforms !== 1 ? 's' : ''} conectada{summary.connectedPlatforms !== 1 ? 's' : ''} &middot; ultimas {data.period.days} dias
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-2 py-1 text-sm"
            >
              <option value={1}>24 horas</option>
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
            </select>
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metricas globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#01257D]">{formatNumber(summary.totalFollowers)}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Users className="h-3 w-3" /> Seguidores
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#01257D]">{summary.totalMentions}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <MessageCircle className="h-3 w-3" /> Menciones
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#01257D]">{formatNumber(summary.totalEngagement)}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" /> Engagement
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              summary.overallSentiment >= 70 ? 'text-green-600' :
              summary.overallSentiment <= 30 ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {summary.overallSentiment}
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <BarChart3 className="h-3 w-3" /> Score sentimiento
            </div>
          </div>
        </div>

        {/* Distribucion de sentimiento */}
        {summary.totalMentions > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Distribucion de sentimiento
            </p>
            <div className="flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{ width: `${summary.sentimentDistribution.positive}%` }}
                title={`Positivo: ${summary.sentimentDistribution.positive}%`}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${summary.sentimentDistribution.neutral}%` }}
                title={`Neutral: ${summary.sentimentDistribution.neutral}%`}
              />
              <div
                className="bg-red-500"
                style={{ width: `${summary.sentimentDistribution.negative}%` }}
                title={`Negativo: ${summary.sentimentDistribution.negative}%`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span className="text-green-600">{summary.sentimentDistribution.positive}% positivo</span>
              <span className="text-yellow-600">{summary.sentimentDistribution.neutral}% neutro</span>
              <span className="text-red-600">{summary.sentimentDistribution.negative}% negativo</span>
            </div>
          </div>
        )}

        {/* Por plataforma */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#01257D]">Por plataforma</h3>
          {platforms.map((p) => (
            <Card key={p.platform} className="border-l-4 border-l-[#01257D]">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {PLATFORM_LABELS[p.platform] || p.platform}
                    </h4>
                    <p className="text-sm text-gray-500">
                      @{p.username}
                      {p.profileUrl && (
                        <a
                          href={p.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center text-[#01257D] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                  </div>
                  <Badge className={sentimentBadgeClass('', p.averageScore)}>
                    {sentimentLabel('', p.averageScore)} ({p.averageScore})
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#01257D]">{formatNumber(p.followers)}</div>
                    <div className="text-xs text-gray-500">Seguidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#01257D]">{p.mentionsInPeriod}</div>
                    <div className="text-xs text-gray-500">Menciones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[#01257D]">
                      {p.engagement > 0 ? `${p.engagement.toFixed(1)}%` : '—'}
                    </div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 flex justify-center gap-1.5">
                      <span className="text-green-600 font-medium">{p.sentimentDistribution.positive}</span>
                      <span>/</span>
                      <span className="text-yellow-600 font-medium">{p.sentimentDistribution.neutral}</span>
                      <span>/</span>
                      <span className="text-red-600 font-medium">{p.sentimentDistribution.negative}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">+/=/-</div>
                  </div>
                </div>

                {p.recentMentions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Menciones recientes
                    </h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {p.recentMentions.map((m) => (
                        <div key={m.id} className="border border-gray-200 dark:border-gray-700 rounded p-2 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className={sentimentBadgeClass(m.sentiment, m.sentimentScore)}>
                              {sentimentLabel(m.sentiment, m.sentimentScore)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(m.publishedAt), 'd MMM', { locale: es })}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 mb-1 line-clamp-2 text-xs">{m.content}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {m.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" /> {m.shares}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> {m.comments}
                            </span>
                            {m.url && (
                              <a href={m.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[#01257D] hover:underline">
                                Ver
                              </a>
                            )}
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

        {/* Top hashtags */}
        {topHashtags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[#01257D] mb-2">Hashtags mas usados</h3>
            <div className="flex flex-wrap gap-2">
              {topHashtags.map((h) => (
                <Badge key={h.tag} variant="outline" className="border-[#01257D] text-[#01257D]">
                  #{h.tag} <span className="ml-1 text-gray-500">({h.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Footer con ultima sincronizacion */}
        {summary.lastSync && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
            Ultima sincronizacion automatica:{' '}
            {format(new Date(summary.lastSync), "d 'de' MMMM 'a las' HH:mm", { locale: es })}{' '}
            (cron cada 30 minutos)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
