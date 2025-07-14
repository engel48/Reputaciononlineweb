"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Heart, MessageCircle, Share2,
  DollarSign, Eye, Star, Award, Target, Zap, BarChart3, PieChart,
  Instagram, Youtube, Facebook, Twitter, TikTok, Linkedin,
  Calendar, Clock, AlertTriangle, CheckCircle, ArrowUp, ArrowDown,
  Filter, Download, RefreshCw, Search, Bell, Settings, Shield
} from 'lucide-react';

interface InfluenceMetrics {
  totalFollowers: number;
  engagementRate: number;
  authenticFollowers: number;
  brandSafetyScore: number;
  avgPostReach: number;
  collaborations: Array<{
    brand: string;
    date: string;
    type: 'post' | 'story' | 'video' | 'live';
    reach: number;
    engagement: number;
    sentimentBefore: number;
    sentimentAfter: number;
    roi: number;
  }>;
  competitors: Array<{
    name: string;
    followers: number;
    engagement: number;
    growth: number;
    brandDeals: number;
  }>;
  platformStats: Array<{
    platform: string;
    followers: number;
    engagement: number;
    growth: number;
    avgReach: number;
  }>;
  audienceDemographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    genders: Array<{ gender: string; percentage: number }>;
    locations: Array<{ country: string; percentage: number }>;
    interests: Array<{ interest: string; percentage: number }>;
  };
}

interface BrandOpportunity {
  id: string;
  brand: string;
  category: string;
  estimatedValue: number;
  matchScore: number;
  requirements: string[];
  deadline: string;
  status: 'available' | 'applied' | 'negotiating' | 'completed';
}

interface UserProfile {
  type: string;
  specialization?: string;
  region?: string;
}

interface InfluenceTrackerProps {
  userProfile: UserProfile;
}

export default function InfluenceTracker({ userProfile }: InfluenceTrackerProps) {
  const [activeView, setActiveView] = useState<'overview' | 'collaborations' | 'competitors' | 'opportunities' | 'audience'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);

  const [metrics, setMetrics] = useState<InfluenceMetrics>({
    totalFollowers: 2847563,
    engagementRate: 4.2,
    authenticFollowers: 89,
    brandSafetyScore: 92,
    avgPostReach: 1256780,
    collaborations: [
      {
        brand: 'Nike Colombia',
        date: '2024-01-15',
        type: 'post',
        reach: 1890000,
        engagement: 156780,
        sentimentBefore: 85,
        sentimentAfter: 88,
        roi: 340
      },
      {
        brand: 'Samsung Galaxy',
        date: '2024-01-10',
        type: 'video',
        reach: 2340000,
        engagement: 234560,
        sentimentBefore: 82,
        sentimentAfter: 85,
        roi: 420
      },
      {
        brand: 'Coca-Cola',
        date: '2024-01-05',
        type: 'story',
        reach: 890000,
        engagement: 67890,
        sentimentBefore: 87,
        sentimentAfter: 89,
        roi: 280
      }
    ],
    competitors: [
      { name: '@influencer_a', followers: 3200000, engagement: 3.8, growth: 12, brandDeals: 15 },
      { name: 'Tú', followers: 2847563, engagement: 4.2, growth: 18, brandDeals: 12 },
      { name: '@influencer_b', followers: 2650000, engagement: 3.9, growth: 8, brandDeals: 18 },
      { name: '@influencer_c', followers: 2340000, engagement: 4.5, growth: 22, brandDeals: 10 }
    ],
    platformStats: [
      { platform: 'Instagram', followers: 1890000, engagement: 4.5, growth: 15, avgReach: 850000 },
      { platform: 'TikTok', followers: 567000, engagement: 6.8, growth: 35, avgReach: 420000 },
      { platform: 'YouTube', followers: 234000, engagement: 3.2, growth: 8, avgReach: 180000 },
      { platform: 'Twitter', followers: 156563, engagement: 2.1, growth: 5, avgReach: 89000 }
    ],
    audienceDemographics: {
      ageGroups: [
        { range: '18-24', percentage: 35 },
        { range: '25-34', percentage: 42 },
        { range: '35-44', percentage: 18 },
        { range: '45+', percentage: 5 }
      ],
      genders: [
        { gender: 'Femenino', percentage: 58 },
        { gender: 'Masculino', percentage: 40 },
        { gender: 'Otro', percentage: 2 }
      ],
      locations: [
        { country: 'Colombia', percentage: 45 },
        { country: 'México', percentage: 18 },
        { country: 'Argentina', percentage: 12 },
        { country: 'Chile', percentage: 8 },
        { country: 'Otros', percentage: 17 }
      ],
      interests: [
        { interest: 'Moda', percentage: 68 },
        { interest: 'Lifestyle', percentage: 54 },
        { interest: 'Tecnología', percentage: 32 },
        { interest: 'Viajes', percentage: 28 }
      ]
    }
  });

  const [brandOpportunities, setBrandOpportunities] = useState<BrandOpportunity[]>([
    {
      id: '1',
      brand: 'Adidas Colombia',
      category: 'Deportes',
      estimatedValue: 8500,
      matchScore: 95,
      requirements: ['Post en feed', 'Stories', 'Mención en video'],
      deadline: '2024-02-15',
      status: 'available'
    },
    {
      id: '2',
      brand: 'L\'Oréal Paris',
      category: 'Belleza',
      estimatedValue: 12000,
      matchScore: 88,
      requirements: ['Video tutorial', '3 posts', 'Stories por 5 días'],
      deadline: '2024-02-20',
      status: 'available'
    },
    {
      id: '3',
      brand: 'Apple iPhone',
      category: 'Tecnología',
      estimatedValue: 15000,
      matchScore: 92,
      requirements: ['Unboxing video', 'Stories daily use', 'Review post'],
      deadline: '2024-02-10',
      status: 'negotiating'
    }
  ]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return Instagram;
      case 'tiktok': return TikTok;
      case 'youtube': return Youtube;
      case 'twitter': return Twitter;
      case 'facebook': return Facebook;
      case 'linkedin': return Linkedin;
      default: return Users;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'applied': return 'text-blue-600 bg-blue-100';
      case 'negotiating': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfluenceMetricCard
          icon={Users}
          title="Seguidores Totales"
          value={metrics.totalFollowers.toLocaleString()}
          change="+18%"
          positive={true}
        />
        <InfluenceMetricCard
          icon={Heart}
          title="Engagement Rate"
          value={`${metrics.engagementRate}%`}
          change="+0.3%"
          positive={true}
        />
        <InfluenceMetricCard
          icon={Shield}
          title="Authentic Followers"
          value={`${metrics.authenticFollowers}%`}
          change="+2%"
          positive={true}
        />
        <InfluenceMetricCard
          icon={Star}
          title="Brand Safety Score"
          value={`${metrics.brandSafetyScore}/100`}
          change="+5"
          positive={true}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por plataforma */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Performance por Plataforma</h3>
          <div className="space-y-4">
            {metrics.platformStats.map((platform, index) => {
              const IconComponent = getPlatformIcon(platform.platform);
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-6 h-6 text-[#01257D]" />
                    <div>
                      <h4 className="font-semibold">{platform.platform}</h4>
                      <p className="text-sm text-gray-600">{platform.followers.toLocaleString()} seguidores</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{platform.engagement}%</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        platform.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {platform.growth > 0 ? '+' : ''}{platform.growth}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{(platform.avgReach / 1000).toFixed(0)}K alcance promedio</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROI de colaboraciones recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">ROI de Colaboraciones Recientes</h3>
          <div className="space-y-4">
            {metrics.collaborations.slice(0, 3).map((collab, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{collab.brand}</h4>
                  <span className="text-sm font-medium text-green-600">ROI: {collab.roi}%</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Alcance:</span>
                    <div className="font-medium">{(collab.reach / 1000000).toFixed(1)}M</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Engagement:</span>
                    <div className="font-medium">{(collab.engagement / 1000).toFixed(0)}K</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Sentiment:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{collab.sentimentAfter}%</span>
                      {collab.sentimentAfter > collab.sentimentBefore ? (
                        <ArrowUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Safety y Authentic Followers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Brand Safety Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Contenido apropiado</span>
              <span className="text-green-600 font-medium">98%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Lenguaje profesional</span>
              <span className="text-green-600 font-medium">95%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sin controversias</span>
              <span className="text-green-600 font-medium">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Alineación de valores</span>
              <span className="text-green-600 font-medium">89%</span>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Perfil seguro para marcas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Análisis de Followers</h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#01257D] mb-2">{metrics.authenticFollowers}%</div>
              <div className="text-gray-600">Followers Auténticos</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-bold text-green-600">
                  {Math.round(metrics.totalFollowers * metrics.authenticFollowers / 100).toLocaleString()}
                </div>
                <div className="text-green-800">Reales</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="font-bold text-red-600">
                  {Math.round(metrics.totalFollowers * (100 - metrics.authenticFollowers) / 100).toLocaleString()}
                </div>
                <div className="text-red-800">Bots/Inactivos</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollaborations = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Historial de Colaboraciones</h3>
        <div className="space-y-4">
          {metrics.collaborations.map((collab, index) => (
            <div key={index} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{collab.brand}</h4>
                  <p className="text-sm text-gray-600">{new Date(collab.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">ROI: {collab.roi}%</div>
                  <div className="text-sm text-gray-600 capitalize">{collab.type}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {(collab.reach / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-blue-800">Alcance</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {(collab.engagement / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-purple-800">Engagement</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{collab.sentimentBefore}%</div>
                  <div className="text-sm text-green-800">Sentiment Antes</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{collab.sentimentAfter}%</div>
                  <div className="text-sm text-green-800">Sentiment Después</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Cambio en sentiment:</span>
                  <span className={`flex items-center space-x-1 text-sm font-medium ${
                    collab.sentimentAfter > collab.sentimentBefore ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {collab.sentimentAfter > collab.sentimentBefore ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(collab.sentimentAfter - collab.sentimentBefore)}%</span>
                  </span>
                </div>
                <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90 text-sm">
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOpportunities = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Oportunidades de Marca</h3>
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </button>
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {brandOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{opportunity.brand}</h4>
                  <p className="text-sm text-gray-600">{opportunity.category}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(opportunity.status)}`}>
                  {opportunity.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    ${opportunity.estimatedValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-800">Valor Estimado</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{opportunity.matchScore}%</div>
                  <div className="text-sm text-blue-800">Match Score</div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="font-medium mb-2">Requerimientos:</h5>
                <ul className="space-y-1">
                  {opportunity.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                </div>
                <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90 text-sm">
                  {opportunity.status === 'available' ? 'Aplicar' : 'Ver Estado'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCompetitors = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Análisis Competitivo</h3>
        <div className="space-y-4">
          {metrics.competitors.map((competitor, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              competitor.name === 'Tú' ? 'border-[#01257D] bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold ${competitor.name === 'Tú' ? 'text-[#01257D]' : ''}`}>
                  {competitor.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    #{index + 1}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg">{(competitor.followers / 1000000).toFixed(1)}M</div>
                  <div className="text-gray-600">Seguidores</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{competitor.engagement}%</div>
                  <div className="text-gray-600">Engagement</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold text-lg ${competitor.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {competitor.growth > 0 ? '+' : ''}{competitor.growth}%
                  </div>
                  <div className="text-gray-600">Crecimiento</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">{competitor.brandDeals}</div>
                  <div className="text-gray-600">Brand Deals</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-6">
      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Grupos de Edad</h3>
          <div className="space-y-3">
            {metrics.audienceDemographics.ageGroups.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{group.range} años</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#01257D]"
                      style={{ width: `${group.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{group.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución por Género</h3>
          <div className="space-y-3">
            {metrics.audienceDemographics.genders.map((gender, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{gender.gender}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${gender.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{gender.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Ubicaciones Principales</h3>
          <div className="space-y-3">
            {metrics.audienceDemographics.locations.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{location.country}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${location.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{location.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Intereses Principales</h3>
          <div className="space-y-3">
            {metrics.audienceDemographics.interests.map((interest, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{interest.interest}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-yellow-500"
                      style={{ width: `${interest.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{interest.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Influence Tracker
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis completo de influencia y oportunidades de marca
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
            
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'collaborations', label: 'Colaboraciones', icon: DollarSign },
            { id: 'competitors', label: 'Competidores', icon: Target },
            { id: 'opportunities', label: 'Oportunidades', icon: Star },
            { id: 'audience', label: 'Audiencia', icon: Users }
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
          {activeView === 'collaborations' && renderCollaborations()}
          {activeView === 'competitors' && renderCompetitors()}
          {activeView === 'opportunities' && renderOpportunities()}
          {activeView === 'audience' && renderAudience()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function InfluenceMetricCard({ icon: Icon, title, value, change, positive }: {
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