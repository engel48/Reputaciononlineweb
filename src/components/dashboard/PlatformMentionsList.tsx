'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, MessageCircle, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { classifyMention, isCriticalMention } from '@/lib/dashboard-helpers';

interface PlatformMention {
  id: string;
  content: string;
  author: string;
  sentiment: 'positive' | 'negative' | 'neutral' | string;
  sentiment_score?: number;
  source_type?: string | null;
  likes?: number;
  shares?: number;
  comments?: number;
  retweets?: number;
  replies?: number;
  url?: string;
  published_at?: string;
  // extras opcionales por red:
  post_content?: string;
  tweet_content?: string;
  video_title?: string;
  media_url?: string;
}

interface Props {
  platform: 'x' | 'facebook' | 'instagram' | 'youtube';
  platformLabel: string;
  mentions: PlatformMention[];
  emptyHint?: string;
}

type TabKey = 'all' | 'own' | 'external';

const TAB_LABELS: Record<TabKey, string> = {
  all: 'Todas',
  own: 'En mis posts',
  external: 'Menciones externas',
};

function formatRelativeDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);
  if (diffSec < 60) return 'hace segundos';
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `hace ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 604800) return `hace ${Math.floor(diffSec / 86400)} d`;
  return date.toLocaleDateString('es-CO');
}

export function PlatformMentionsList({
  platform,
  platformLabel,
  mentions,
  emptyHint,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const { all, own, external, criticalCount } = useMemo(() => {
    const own: PlatformMention[] = [];
    const external: PlatformMention[] = [];
    let criticalCount = 0;

    for (const m of mentions) {
      const category = classifyMention({ source_type: m.source_type });
      if (category === 'own') own.push(m);
      else if (category === 'external') external.push(m);
      if (isCriticalMention({ sentiment: m.sentiment, sentiment_score: m.sentiment_score }))
        criticalCount++;
    }
    return { all: mentions, own, external, criticalCount };
  }, [mentions]);

  const activeList = activeTab === 'own' ? own : activeTab === 'external' ? external : all;

  const emptyText = (() => {
    if (mentions.length === 0) {
      return (
        emptyHint ||
        `Julia aún no ha detectado menciones en ${platformLabel}. Se sincronizan automáticamente cada 30 min.`
      );
    }
    if (activeTab === 'own' && own.length === 0) {
      return 'No hay comentarios en tus posts propios en los últimos 7 días.';
    }
    if (activeTab === 'external' && external.length === 0) {
      return 'No hay menciones externas (posts de terceros que te etiqueten) en los últimos 7 días.';
    }
    return '';
  })();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header con tabs */}
      <div className="px-4 pt-4 pb-0 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#01257D]" />
              Menciones en {platformLabel}
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  {criticalCount} crítica{criticalCount !== 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-emerald-500" />
              Actualización automática cada 30 min
            </p>
          </div>
        </div>

        <div className="flex gap-1 -mx-4 px-4 overflow-x-auto">
          {(['all', 'own', 'external'] as TabKey[]).map((tab) => {
            const count = tab === 'all' ? all.length : tab === 'own' ? own.length : external.length;
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  active
                    ? 'bg-gray-50 dark:bg-gray-900/50 text-[#01257D] dark:text-white border-b-2 border-[#01257D]'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {TAB_LABELS[tab]}{' '}
                <span className={`ml-1 text-xs ${active ? 'text-[#01257D]' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="p-4">
        {activeList.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{emptyText}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {activeList.slice(0, 10).map((m) => {
              const critical = isCriticalMention({
                sentiment: m.sentiment,
                sentiment_score: m.sentiment_score,
              });
              const sentimentBadgeColor =
                m.sentiment === 'positive'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : m.sentiment === 'negative'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';

              return (
                <li
                  key={m.id}
                  className={`rounded-lg p-3 border-l-4 ${
                    critical
                      ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
                      : 'border-l-gray-200 dark:border-l-gray-700 bg-gray-50 dark:bg-gray-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {platform === 'x' || platform === 'instagram' ? '@' : ''}
                        {m.author || 'Anónimo'}
                      </span>
                      {critical && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase">
                          <AlertTriangle className="w-2.5 h-2.5" /> Crítica
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${sentimentBadgeColor}`}
                    >
                      {m.sentiment}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-3">
                    {m.content}
                  </p>

                  <div className="flex items-center justify-between gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <div className="flex items-center gap-3">
                      {typeof m.likes === 'number' && m.likes > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> {m.likes}
                        </span>
                      )}
                      {typeof (m.comments ?? m.replies) === 'number' &&
                        (m.comments ?? m.replies ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> {m.comments ?? m.replies}
                          </span>
                        )}
                      <span className="text-gray-400">{formatRelativeDate(m.published_at)}</span>
                      {m.source_type && (
                        <span className="text-[10px] text-gray-400 italic">
                          {m.source_type.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {m.url && (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[#01257D] dark:text-blue-400 hover:underline font-medium"
                      >
                        Ver <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PlatformMentionsList;
