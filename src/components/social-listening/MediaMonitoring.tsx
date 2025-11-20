"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tv, Radio, Newspaper, Globe, Smartphone, Video, 
  TrendingUp, TrendingDown, Eye, Heart, Share2, 
  Calendar, Clock, MapPin, Star, Filter, Search,
  RefreshCw, Download, Bell, Settings, Users,
  BarChart3, PieChart, ArrowUp, ArrowDown, 
  ExternalLink, Play, Bookmark, AlertCircle,
  CheckCircle, MessageSquare, Phone, Mail, Award
} from 'lucide-react';

interface MediaMention {
  id: string;
  title: string;
  outlet: string;
  type: 'tv' | 'radio' | 'newspaper' | 'digital' | 'podcast' | 'social';
  date: string;
  sentiment: number;
  reach: number;
  engagement: number;
  tone: 'positive' | 'neutral' | 'negative';
  prominence: 'headline' | 'featured' | 'mention' | 'brief';
  journalist: string;
  summary: string;
  url?: string;
  transcript?: string;
  keyQuotes: string[];
  topics: string[];
  region: string;
  language: 'es' | 'en';
  credibility: number;
  virality: number;
}

interface MediaOutlet {
  id: string;
  name: string;
  type: 'tv' | 'radio' | 'newspaper' | 'digital';
  reach: number;
  credibility: number;
  political_bias: 'left' | 'center' | 'right' | 'neutral';
  region: string;
  frequency: number;
  sentiment_avg: number;
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

interface Journalist {
  id: string;
  name: string;
  outlet: string;
  beat: string;
  followers: number;
  influence_score: number;
  relationship_status: 'friendly' | 'neutral' | 'hostile' | 'unknown';
  last_contact: string;
  articles_count: number;
  avg_sentiment: number;
  contact: {
    email?: string;
    phone?: string;
    twitter?: string;
  };
}

interface UserProfile {
  type: string;
  specialization?: string;
  region?: string;
}

interface MediaMonitoringProps {
  userProfile: UserProfile;
}

export default function MediaMonitoring({ userProfile }: MediaMonitoringProps) {
  const [activeView, setActiveView] = useState<'overview' | 'mentions' | 'outlets' | 'journalists' | 'analytics'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedMention, setSelectedMention] = useState<MediaMention | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [mediaMentions, setMediaMentions] = useState<MediaMention[]>([]);
  const [mediaOutlets, setMediaOutlets] = useState<MediaOutlet[]>([]);
  const [journalists, setJournalists] = useState<Journalist[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Fetch REAL media mentions using realNewsAPI scraping
  useEffect(() => {
    const fetchRealMediaData = async () => {
      try {
        // Get user session
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();

        if (!session?.user?.id) {
          setMediaMentions([]);
          return;
        }

        setUserId(session.user.id);
        setUserName(session.user.name || '');

        // Use realNewsAPI to scrape REAL Colombian media
        const searchResponse = await fetch('/api/search-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: session.user.name,
            sources: 'colombian-media'
          })
        });

        const newsData = await searchResponse.json();

        // Transform to MediaMention format
        const mentions: MediaMention[] = (newsData.articles || []).map((article: any) => ({
          id: article.url,
          title: article.title,
          outlet: article.source,
          type: article.type || 'digital',
          date: article.publishedAt,
          sentiment: article.sentimentScore || 50,
          reach: article.estimatedReach || 0,
          engagement: article.engagement || 0,
          tone: article.sentiment || 'neutral',
          prominence: article.prominence || 'mention',
          journalist: article.author || 'Desconocido',
          summary: article.description || '',
          url: article.url,
          keyQuotes: article.quotes || [],
          topics: article.topics || [],
          region: article.region || 'Nacional',
          language: 'es',
          credibility: article.credibilityScore || 70,
          virality: article.viralityScore || 0
        }));

        setMediaMentions(mentions);

        // Group by outlet for outlet stats
        const outletMap = new Map<string, MediaOutlet>();
        mentions.forEach((mention) => {
          if (!outletMap.has(mention.outlet)) {
            // Filter out 'podcast' and 'social' types, default to 'digital'
            const validType: 'tv' | 'radio' | 'newspaper' | 'digital' =
              mention.type === 'tv' || mention.type === 'radio' || mention.type === 'newspaper' || mention.type === 'digital'
                ? mention.type
                : 'digital';

            outletMap.set(mention.outlet, {
              id: mention.outlet,
              name: mention.outlet,
              type: validType,
              reach: mention.reach,
              credibility: mention.credibility,
              political_bias: 'neutral',
              region: mention.region,
              frequency: 1,
              sentiment_avg: mention.sentiment,
              contact: {}
            });
          } else {
            const outlet = outletMap.get(mention.outlet)!;
            outlet.frequency += 1;
            outlet.reach += mention.reach;
            outlet.sentiment_avg = (outlet.sentiment_avg + mention.sentiment) / 2;
          }
        });

        setMediaOutlets(Array.from(outletMap.values()));

        // Extract journalists
        const journalistMap = new Map<string, Journalist>();
        mentions.forEach((mention) => {
          if (mention.journalist && mention.journalist !== 'Desconocido') {
            if (!journalistMap.has(mention.journalist)) {
              journalistMap.set(mention.journalist, {
                id: mention.journalist,
                name: mention.journalist,
                outlet: mention.outlet,
                beat: mention.topics[0] || 'General',
                followers: 0,
                influence_score: mention.credibility,
                relationship_status: 'unknown',
                last_contact: mention.date,
                articles_count: 1,
                avg_sentiment: mention.sentiment,
                contact: {}
              });
            } else {
              const journalist = journalistMap.get(mention.journalist)!;
              journalist.articles_count += 1;
              journalist.avg_sentiment = (journalist.avg_sentiment + mention.sentiment) / 2;
            }
          }
        });

        setJournalists(Array.from(journalistMap.values()));
      } catch (error) {
        console.error('Error fetching media data:', error);
        setMediaMentions([]);
      }
    };

    fetchRealMediaData();

    // Real-time monitoring every 5 minutes
    if (isMonitoring) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        fetchRealMediaData();
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'tv': return Tv;
      case 'radio': return Radio;
      case 'newspaper': return Newspaper;
      case 'digital': return Globe;
      case 'podcast': return Smartphone;
      case 'social': return MessageSquare;
      default: return Globe;
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'neutral': return 'text-yellow-600 bg-yellow-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRelationshipColor = (status: string) => {
    switch (status) {
      case 'friendly': return 'text-green-600 bg-green-100';
      case 'neutral': return 'text-yellow-600 bg-yellow-100';
      case 'hostile': return 'text-red-600 bg-red-100';
      case 'unknown': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MediaMetricCard
          icon={Newspaper}
          title="Menciones (7d)"
          value={mediaMentions.length.toString()}
          change="+23%"
          positive={true}
        />
        <MediaMetricCard
          icon={Eye}
          title="Alcance Total"
          value={`${(mediaMentions.reduce((acc, m) => acc + m.reach, 0) / 1000000).toFixed(1)}M`}
          change="+15%"
          positive={true}
        />
        <MediaMetricCard
          icon={TrendingUp}
          title="Sentiment Promedio"
          value={`${Math.round(mediaMentions.reduce((acc, m) => acc + m.sentiment, 0) / mediaMentions.length)}%`}
          change="+5%"
          positive={true}
        />
        <MediaMetricCard
          icon={Star}
          title="Credibilidad Media"
          value={`${Math.round(mediaMentions.reduce((acc, m) => acc + m.credibility, 0) / mediaMentions.length)}/100`}
          change="+2"
          positive={true}
        />
      </div>

      {/* Menciones destacadas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Menciones Destacadas</h3>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${isMonitoring ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {isMonitoring ? 'Monitoreo Activo' : 'Pausado'}
              </span>
            </div>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {mediaMentions.slice(0, 5).map((mention) => {
            const MediaIcon = getMediaTypeIcon(mention.type);
            return (
              <motion.div
                key={mention.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedMention(mention)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <MediaIcon className="w-6 h-6 text-[#01257D] mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{mention.title}</h4>
                      <p className="text-sm text-gray-600">{mention.outlet} • {mention.journalist}</p>
                      <p className="text-sm text-gray-500 mt-1">{mention.summary}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getToneColor(mention.tone)}`}>
                      {mention.tone}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(mention.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-500">Alcance:</span>
                    <div className="font-medium">{(mention.reach / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Sentiment:</span>
                    <div className="font-medium">{mention.sentiment}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Credibilidad:</span>
                    <div className="font-medium">{mention.credibility}/100</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{mention.region}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{mention.prominence}</span>
                  </div>
                  <div className="flex space-x-2">
                    {mention.url && (
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Bookmark className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Análisis de medios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución por Tipo de Medio</h3>
          <div className="space-y-3">
            {['tv', 'newspaper', 'digital', 'radio'].map((type) => {
              const count = mediaMentions.filter(m => m.type === type).length;
              const percentage = (count / mediaMentions.length) * 100;
              const MediaIcon = getMediaTypeIcon(type);
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MediaIcon className="w-5 h-5 text-[#01257D]" />
                    <span className="font-medium capitalize">{type === 'tv' ? 'Televisión' : type === 'newspaper' ? 'Prensa' : type}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#01257D]"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Sentiment por Outlet</h3>
          <div className="space-y-3">
            {mediaOutlets.slice(0, 4).map((outlet) => (
              <div key={outlet.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{outlet.name}</div>
                  <div className="text-sm text-gray-500">{outlet.type}</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${outlet.sentiment_avg >= 60 ? 'text-green-600' : outlet.sentiment_avg >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {outlet.sentiment_avg}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {outlet.frequency} menciones
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMentions = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Todas las Menciones</h3>
          <div className="flex space-x-3">
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Todos los medios</option>
              <option>Solo TV</option>
              <option>Solo prensa</option>
              <option>Solo digital</option>
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Todos los sentiments</option>
              <option>Solo positivos</option>
              <option>Solo negativos</option>
            </select>
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg text-sm hover:bg-[#01257D]/90">
              <Download className="w-4 h-4 mr-2 inline" />
              Exportar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {mediaMentions.map((mention) => {
            const MediaIcon = getMediaTypeIcon(mention.type);
            return (
              <div key={mention.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <MediaIcon className="w-6 h-6 text-[#01257D] mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{mention.title}</h4>
                      <p className="text-sm text-gray-600">{mention.outlet} • {mention.journalist}</p>
                      <p className="text-sm text-gray-500 mt-1">{mention.summary}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getToneColor(mention.tone)}`}>
                      {mention.sentiment}% • {mention.tone}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(mention.date).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-500">Alcance:</span>
                    <div className="font-medium">{(mention.reach / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Engagement:</span>
                    <div className="font-medium">{(mention.engagement / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Credibilidad:</span>
                    <div className="font-medium">{mention.credibility}/100</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Viralidad:</span>
                    <div className="font-medium">{mention.virality}/100</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      {mention.region}
                    </span>
                    <span className="flex items-center">
                      <Star className="w-4 h-4 text-gray-400 mr-1" />
                      {mention.prominence}
                    </span>
                    <div className="flex space-x-1">
                      {mention.topics.slice(0, 2).map((topic, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedMention(mention)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Ver Detalle
                    </button>
                    {mention.url && (
                      <button className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                        Ir al Artículo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderOutlets = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Medios de Comunicación</h3>
          <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
            <Settings className="w-4 h-4 mr-2 inline" />
            Configurar Alertas
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {mediaOutlets.map((outlet) => {
            const MediaIcon = getMediaTypeIcon(outlet.type);
            return (
              <div key={outlet.id} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <MediaIcon className="w-8 h-8 text-[#01257D]" />
                    <div>
                      <h4 className="font-semibold text-lg">{outlet.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{outlet.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#01257D]">{outlet.credibility}</div>
                    <div className="text-xs text-gray-500">Credibilidad</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Alcance:</span>
                    <div className="font-medium">{(outlet.reach / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Menciones:</span>
                    <div className="font-medium">{outlet.frequency}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Sentiment:</span>
                    <div className={`font-medium ${outlet.sentiment_avg >= 60 ? 'text-green-600' : outlet.sentiment_avg >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {outlet.sentiment_avg}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Tendencia:</span>
                    <div className={`font-medium ${outlet.political_bias === 'center' ? 'text-gray-600' : outlet.political_bias === 'left' ? 'text-blue-600' : 'text-red-600'}`}>
                      {outlet.political_bias}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 mb-2">Contacto:</div>
                  <div className="space-y-1 text-sm">
                    {outlet.contact.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {outlet.contact.email}
                      </div>
                    )}
                    {outlet.contact.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        {outlet.contact.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                    Ver Menciones
                  </button>
                  <button className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">
                    Contactar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderJournalists = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Periodistas Clave</h3>
          <div className="flex space-x-3">
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Todas las relaciones</option>
              <option>Solo amigables</option>
              <option>Solo neutrales</option>
              <option>Solo hostiles</option>
            </select>
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
              <Users className="w-4 h-4 mr-2 inline" />
              Nuevo Contacto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {journalists.map((journalist) => (
            <div key={journalist.id} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{journalist.name}</h4>
                  <p className="text-sm text-gray-600">{journalist.outlet}</p>
                  <p className="text-sm text-gray-500">{journalist.beat}</p>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(journalist.relationship_status)}`}>
                    {journalist.relationship_status}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Último contacto: {new Date(journalist.last_contact).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Influencia:</span>
                  <div className="font-medium">{journalist.influence_score}/100</div>
                </div>
                <div>
                  <span className="text-gray-500">Seguidores:</span>
                  <div className="font-medium">{(journalist.followers / 1000).toFixed(0)}K</div>
                </div>
                <div>
                  <span className="text-gray-500">Artículos:</span>
                  <div className="font-medium">{journalist.articles_count}</div>
                </div>
                <div>
                  <span className="text-gray-500">Sentiment Avg:</span>
                  <div className={`font-medium ${journalist.avg_sentiment >= 60 ? 'text-green-600' : journalist.avg_sentiment >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {journalist.avg_sentiment}%
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm text-gray-600 mb-2">Contacto:</div>
                <div className="space-y-1 text-sm">
                  {journalist.contact.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      {journalist.contact.email}
                    </div>
                  )}
                  {journalist.contact.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      {journalist.contact.phone}
                    </div>
                  )}
                  {journalist.contact.twitter && (
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 text-gray-400 mr-2" />
                      {journalist.contact.twitter}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                  Ver Artículos
                </button>
                <button className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">
                  Contactar
                </button>
                <button className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600">
                  Programar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Empty state
  if (!mediaMentions || mediaMentions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Tv className="w-8 h-8 text-[#01257D] mr-3" />
            Media Monitoring
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Seguimiento completo de menciones en medios tradicionales y digitales
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <Newspaper className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Sin menciones en medios
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No se encontraron menciones recientes en medios colombianos
          </p>
          <p className="text-sm text-gray-500">
            El sistema realiza búsquedas automáticas cada 5 minutos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <Tv className="w-8 h-8 text-[#01257D] mr-3" />
              Media Monitoring
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Seguimiento completo de menciones en medios tradicionales y digitales
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            >
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </div>
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
              <Download className="w-4 h-4 mr-2 inline" />
              Exportar
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'mentions', label: 'Menciones', icon: Newspaper },
            { id: 'outlets', label: 'Medios', icon: Tv },
            { id: 'journalists', label: 'Periodistas', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: PieChart }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-[#01257D] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'overview' && renderOverview()}
          {activeView === 'mentions' && renderMentions()}
          {activeView === 'outlets' && renderOutlets()}
          {activeView === 'journalists' && renderJournalists()}
          {activeView === 'analytics' && renderOverview()}
        </motion.div>
      </AnimatePresence>

      {/* Modal de detalle de mención */}
      {selectedMention && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detalle de Mención</h3>
                <button
                  onClick={() => setSelectedMention(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">{selectedMention.title}</h4>
                  <p className="text-gray-600 mb-4">{selectedMention.summary}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-[#01257D]">{(selectedMention.reach / 1000000).toFixed(1)}M</div>
                      <div className="text-sm text-gray-600">Alcance</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedMention.sentiment}%</div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{selectedMention.credibility}</div>
                      <div className="text-sm text-gray-600">Credibilidad</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{selectedMention.virality}</div>
                      <div className="text-sm text-gray-600">Viralidad</div>
                    </div>
                  </div>
                </div>
                
                {selectedMention.keyQuotes.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Citas Destacadas:</h5>
                    <div className="space-y-2">
                      {selectedMention.keyQuotes.map((quote, index) => (
                        <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-500 italic">
                          "{quote}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Compartir
                  </button>
                  {selectedMention.url && (
                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                      Ver Original
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaMetricCard({ icon: Icon, title, value, change, positive }: {
  icon: any;
  title: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-[#01257D]" />
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
          positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {change}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
      <div className="text-gray-600 dark:text-gray-400">{title}</div>
    </div>
  );
}