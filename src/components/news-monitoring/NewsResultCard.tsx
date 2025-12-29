'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface NewsResult {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  source: string;
  sourceUrl?: string;
  articleUrl: string;
  publishedAt: string;
  author?: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number;
  imageUrl?: string | null;
  keywords?: string[];
}

interface NewsResultCardProps {
  news: NewsResult;
  index?: number;
}

export default function NewsResultCard({ news, index = 0 }: NewsResultCardProps) {
  const getSentimentConfig = () => {
    switch (news.sentiment) {
      case 'positive':
        return {
          icon: TrendingUp,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-200 dark:border-green-800',
          label: 'Positivo',
        };
      case 'negative':
        return {
          icon: TrendingDown,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-800',
          label: 'Negativo',
        };
      default:
        return {
          icon: Minus,
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-700/30',
          border: 'border-gray-200 dark:border-gray-700',
          label: 'Neutral',
        };
    }
  };

  const sentimentConfig = getSentimentConfig();
  const SentimentIcon = sentimentConfig.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${sentimentConfig.border} p-5 hover:shadow-lg transition-all duration-200`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Header: Fuente y fecha */}
          <div className="flex items-center gap-3 mb-2 text-sm">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {news.source}
            </span>
            <span className="text-gray-400">|</span>
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(news.publishedAt)}
            </span>
            {news.author && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                  {news.author}
                </span>
              </>
            )}
          </div>

          {/* Titulo */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {news.title}
          </h3>

          {/* Resumen */}
          {news.summary && (
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
              {news.summary}
            </p>
          )}

          {/* Keywords */}
          {news.keywords && news.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {news.keywords.slice(0, 4).map((kw, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Link al articulo */}
          <a
            href={news.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver articulo completo
          </a>
        </div>

        {/* Badge de sentimiento */}
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full ${sentimentConfig.bg}`}>
          <SentimentIcon className={`w-4 h-4 ${sentimentConfig.color}`} />
          <span className={`text-sm font-medium ${sentimentConfig.color}`}>
            {sentimentConfig.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
