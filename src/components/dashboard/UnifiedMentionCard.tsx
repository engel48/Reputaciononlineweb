"use client";

import React, { useState } from 'react';
import {
  Facebook, Instagram, Twitter, Youtube, Newspaper, Hash,
  ThumbsUp, MessageCircle, Share2, Eye, ExternalLink,
  TrendingUp, TrendingDown, Minus, Clock, Check, BookOpen
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
  onMarkAsRead?: (id: string) => void;
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

// Colores de plataformas - Navy/Cyan theme
const platformColors: Record<string, string> = {
  facebook: 'bg-[#1877F2]',
  instagram: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
  x: 'bg-[#0B1120]',
  twitter: 'bg-[#0B1120]',
  youtube: 'bg-red-600',
  news: 'bg-[#0B1120]',
  hashtag: 'bg-purple-600',
  multiple: 'bg-purple-600'
};

// Colores de sentimiento - Pastel profesional
const sentimentConfig = {
  positive: {
    bg: 'bg-[#00E5FF]/10',
    text: 'text-[#0B1120] dark:text-[#00E5FF]',
    border: 'border-[#00E5FF]/30',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    label: 'Positivo'
  },
  negative: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    icon: <TrendingDown className="h-3.5 w-3.5" />,
    label: 'Negativo'
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-gray-700/50',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-600',
    icon: <Minus className="h-3.5 w-3.5" />,
    label: 'Neutro'
  }
};

// Función para limpiar HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "\u2018",
    '&rsquo;': "\u2019"
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // También decodificar entidades numéricas
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return decoded;
}

// Función para resaltar palabras clave con estilo sutil
function highlightKeywords(text: string, keywords?: string[]): React.ReactNode {
  if (!keywords || keywords.length === 0) return text;

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (keywords.some(kw => kw.toLowerCase() === part.toLowerCase())) {
      return (
        <span key={i} className="font-semibold text-[#0B1120] dark:text-[#00E5FF] bg-[#00E5FF]/10 px-0.5 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
}

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
  source,
  onMarkAsRead
}: UnifiedMentionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRead, setIsRead] = useState(false);

  // Formatear fecha relativa
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  // Formatear números grandes
  const formatNumber = (num: number | undefined) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Limpiar y preparar contenido
  const cleanContent = decodeHtmlEntities(content);
  const cleanTitle = title ? decodeHtmlEntities(title) : undefined;

  // Obtener configuración de sentimiento
  const sentimentInfo = sentimentConfig[sentiment] || sentimentConfig.neutral;

  // Truncar contenido
  const maxLength = 150;
  const shouldTruncate = cleanContent.length > maxLength;
  const displayContent = expanded ? cleanContent : cleanContent.substring(0, maxLength) + (shouldTruncate ? '...' : '');

  // Calcular engagement total
  const totalEngagement = (engagement?.likes || 0) + (engagement?.shares || 0) + (engagement?.comments || 0);

  // Marcar como leído
  const handleMarkAsRead = () => {
    setIsRead(true);
    onMarkAsRead?.(id);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-200 overflow-hidden border ${isRead ? 'border-gray-100 dark:border-gray-700 opacity-60' : 'border-gray-100 dark:border-gray-700'}`}>
      <div className="p-4">
        {/* Header compacto */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Icono de plataforma */}
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-white ${platformColors[platform] || 'bg-gray-500'}`}>
              {platformIcons[platform] || platformIcons.news}
            </div>

            {/* Info compacta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white truncate">
                  {author || source || 'Desconocido'}
                </span>
                <span>•</span>
                <span className="capitalize">{platform === 'news' ? 'Noticia' : platform}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Badge de sentimiento + Marcar leído */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sentimentInfo.bg} ${sentimentInfo.text} ${sentimentInfo.border}`}>
              {sentimentInfo.icon}
              <span className="hidden sm:inline">{sentimentInfo.label}</span>
            </div>

            {/* Botón marcar como leído */}
            <button
              onClick={handleMarkAsRead}
              disabled={isRead}
              className={`p-1.5 rounded-lg transition-colors ${
                isRead
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-[#00E5FF]'
              }`}
              title={isRead ? 'Leído' : 'Marcar como leído'}
            >
              {isRead ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Título (si existe) */}
        {cleanTitle && (
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 line-clamp-2">
            {cleanTitle}
          </h3>
        )}

        {/* Contenido condensado */}
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {displayContent}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#00E5FF] hover:text-[#00B8D4] text-xs font-medium mt-1"
          >
            {expanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}

        {/* Footer con engagement y acciones */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Métricas de engagement */}
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {engagement?.likes !== undefined && engagement.likes > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>{formatNumber(engagement.likes)}</span>
              </div>
            )}
            {engagement?.comments !== undefined && engagement.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{formatNumber(engagement.comments)}</span>
              </div>
            )}
            {engagement?.shares !== undefined && engagement.shares > 0 && (
              <div className="flex items-center gap-1">
                <Share2 className="h-3.5 w-3.5" />
                <span>{formatNumber(engagement.shares)}</span>
              </div>
            )}
            {engagement?.views !== undefined && engagement.views > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span>{formatNumber(engagement.views)}</span>
              </div>
            )}
          </div>

          {/* Enlace al original */}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#00E5FF] hover:text-[#00B8D4] text-xs font-medium"
            >
              Ver original
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
