"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Facebook, Linkedin, Instagram, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';

interface Mention {
  id: string;
  platform: string;
  author: string;
  authorHandle: string;
  profileImage: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  date: string;
  engagement: number;
  url: string;
}

interface MentionsTableProps {
  mentions: Mention[];
  title: string;
}

const MentionsTable: React.FC<MentionsTableProps> = ({ mentions, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRowsRef = useRef<HTMLTableRowElement[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animación de entrada para el contenedor
    gsap.from(container, {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: 'power3.out',
      onComplete: animateRows
    });

    function animateRows() {
      if (tableRowsRef.current.length > 0) {
        gsap.from(tableRowsRef.current, {
          duration: 0.5,
          y: 15,
          opacity: 0,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }
    }
  }, [mentions]);

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener icono de plataforma
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'x':
        return <XLogo className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4 text-blue-700" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Obtener color según sentimiento
  const getSentimentColor = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  // Obtener icono según sentimiento
  const getSentimentIcon = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="mr-1 h-3 w-3" />;
      case 'negative':
        return <ThumbsDown className="mr-1 h-3 w-3" />;
      default:
        return null;
    }
  };

  // Traducir sentimiento
  const getSentimentLabel = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'Positivo';
      case 'negative':
        return 'Negativo';
      default:
        return 'Neutral';
    }
  };

  // Asociar refs a filas
  const setRowRef = (el: HTMLTableRowElement | null, index: number) => {
    if (el && tableRowsRef.current) {
      tableRowsRef.current[index] = el;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="rounded-lg bg-white shadow-md dark:bg-gray-800"
    >
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Autor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Mención
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Sentimiento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Engagement
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {mentions.map((mention, index) => (
              <tr 
                key={mention.id}
                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                ref={(el) => setRowRef(el, index)}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="mr-2 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                      {mention.profileImage ? (
                        <img src={mention.profileImage} alt={mention.author} className="h-8 w-8 object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-gray-600">{mention.author.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{mention.author}</div>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        {getPlatformIcon(mention.platform)}
                        <span className="ml-1">{mention.authorHandle}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs truncate text-sm text-gray-900 dark:text-gray-200">
                    {mention.content.length > 100 
                      ? `${mention.content.substring(0, 100)}...` 
                      : mention.content
                    }
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSentimentColor(mention.sentiment)}`}>
                    {getSentimentIcon(mention.sentiment)}
                    {getSentimentLabel(mention.sentiment)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(mention.date)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {mention.engagement}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
        <a 
          href="#" 
          className="text-sm font-medium text-primary hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Ver todas las menciones →
        </a>
      </div>
    </div>
  );
};

export default MentionsTable;
