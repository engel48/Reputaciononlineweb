"use client";

import React, { useState } from 'react';
import {
  Facebook, Instagram, Twitter, Youtube, Newspaper, Hash,
  ThumbsUp, MessageCircle, Share2, Eye, ExternalLink,
  TrendingUp, TrendingDown, Minus, Clock, User
} from 'lucide-react';

interface UnifiedMentionCardProps {
  id: string;
  type: 'news' | 'social' | 'hashtag';
  platform: string;
  author?: string;
  title?: string;
  content: string;
  url?: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  createdAt: string;
  source?: string;
}

// Iconos de plataformas
const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  x: <Twitter className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  news: <Newspaper className="h-4 w-4" />,
  hashtag: <Hash className="h-4 w-4" />,
  multiple: <Hash className="h-4 w-4" />
};

// Colores de plataformas
const platformColors: Record<string, string> = {
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
  x: 'bg-black dark:bg-white dark:text-black',
  twitter: 'bg-sky-500',
  youtube: 'bg-red-600',
  news: 'bg-gray-600',
  hashtag: 'bg-purple-600',
  multiple: 'bg-purple-600'
};

// Colores de sentimiento
const sentimentConfig = {
  positive: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    label: 'Positivo'
  },
  negative: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: <TrendingDown className="h-3.5 w-3.5" />,
    label: 'Negativo'
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    icon: <Minus className="h-3.5 w-3.5" />,
    label: 'Neutro'
  }
};

export default function UnifiedMentionCard({
  id,
  type,
  platform,
  author,
  title,
  content,
  url,
  imageUrl,
  sentiment = 'neutral',
  sentimentScore,
  engagement,
  createdAt,
  source
}: UnifiedMentionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Formatear fecha relativa
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  // Formatear números grandes
  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Obtener configuración de sentimiento
  const sentimentInfo = sentimentConfig[sentiment] || sentimentConfig.neutral;

  // Truncar contenido
  const maxLength = 200;
  const shouldTruncate = content.length > maxLength;
  const displayContent = expanded ? content : content.substring(0, maxLength) + (shouldTruncate ? '...' : '');

  // Calcular engagement total
  const totalEngagement = (engagement?.likes || 0) + (engagement?.shares || 0) + (engagement?.comments || 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Icono de plataforma */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-white ${platformColors[platform] || 'bg-gray-500'}`}>
              {platformIcons[platform] || platformIcons.news}
            </div>

            {/* Info del autor */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {author || source || 'Desconocido'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {platform === 'news' ? 'Noticia' : platform}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(createdAt)}
              </div>
            </div>
          </div>

          {/* Badge de sentimiento */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sentimentInfo.bg} ${sentimentInfo.text}`}>
            {sentimentInfo.icon}
            {sentimentInfo.label}
            {sentimentScore !== undefined && (
              <span className="ml-1 opacity-75">({Math.round(sentimentScore * 100)}%)</span>
            )}
          </div>
        </div>

        {/* Título (si existe) */}
        {title && (
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {title}
          </h3>
        )}

        {/* Contenido */}
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#00E5FF] hover:text-[#00B8D4] text-sm font-medium mt-1"
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}

        {/* Imagen (si existe) */}
        {imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={title || 'Imagen de la mención'}
              className="w-full h-40 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Engagement */}
        {totalEngagement > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            {engagement?.likes !== undefined && engagement.likes > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm">{formatNumber(engagement.likes)}</span>
              </div>
            )}
            {engagement?.comments !== undefined && engagement.comments > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{formatNumber(engagement.comments)}</span>
              </div>
            )}
            {engagement?.shares !== undefined && engagement.shares > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Share2 className="h-4 w-4" />
                <span className="text-sm">{formatNumber(engagement.shares)}</span>
              </div>
            )}
            {engagement?.views !== undefined && engagement.views > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{formatNumber(engagement.views)}</span>
              </div>
            )}

            {/* Botón ver original */}
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[#00E5FF] hover:text-[#00B8D4] text-sm font-medium"
              >
                Ver original
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Si no hay engagement pero hay URL */}
        {totalEngagement === 0 && url && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#00E5FF] hover:text-[#00B8D4] text-sm font-medium"
            >
              Ver original
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
