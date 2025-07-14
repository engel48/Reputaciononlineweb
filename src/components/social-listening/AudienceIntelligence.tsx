"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MapPin, Clock, TrendingUp, Eye, MessageCircle,
  BarChart3, PieChart, Calendar, Filter, Download,
  User, Activity, Heart, ArrowUp, ArrowDown
} from 'lucide-react';

interface UserProfile {
  type: string;
  specialization?: string;
  region?: string;
}

interface AudienceIntelligenceProps {
  userProfile: UserProfile;
}

export default function AudienceIntelligence({ userProfile }: AudienceIntelligenceProps) {
  const [activeView, setActiveView] = useState<'demographics' | 'behavior' | 'interests' | 'growth'>('demographics');

  const audienceData = {
    totalAudience: 2847563,
    realFollowers: 89.4,
    avgAge: 28.5,
    demographics: {
      age: [
        { range: '18-24', percentage: 35, count: 996647 },
        { range: '25-34', percentage: 42, count: 1195976 },
        { range: '35-44', percentage: 18, count: 512561 },
        { range: '45+', percentage: 5, count: 142379 }
      ],
      gender: [
        { type: 'Femenino', percentage: 58, count: 1651587 },
        { type: 'Masculino', percentage: 40, count: 1139025 },
        { type: 'Otro', percentage: 2, count: 56951 }
      ],
      location: [
        { country: 'Colombia', percentage: 45, city: 'Bogotá', count: 1281403 },
        { country: 'México', percentage: 18, city: 'CDMX', count: 512561 },
        { country: 'Argentina', percentage: 12, city: 'Buenos Aires', count: 341707 },
        { country: 'Chile', percentage: 8, city: 'Santiago', count: 227805 },
        { country: 'Perú', percentage: 6, city: 'Lima', count: 170854 }
      ]
    },
    behavior: {
      activeHours: [
        { hour: '6-9', activity: 15 },
        { hour: '9-12', activity: 35 },
        { hour: '12-15', activity: 45 },
        { hour: '15-18', activity: 65 },
        { hour: '18-21', activity: 85 },
        { hour: '21-24', activity: 55 }
      ],
      platforms: [
        { platform: 'Instagram', usage: 78, engagement: 4.2 },
        { platform: 'TikTok', usage: 65, engagement: 6.8 },
        { platform: 'Facebook', usage: 45, engagement: 2.1 },
        { platform: 'Twitter', usage: 32, engagement: 1.8 }
      ],
      contentTypes: [
        { type: 'Videos', preference: 68 },
        { type: 'Fotos', preference: 85 },
        { type: 'Stories', preference: 72 },
        { type: 'Livestreams', preference: 34 }
      ]
    },
    interests: [
      { category: 'Moda', percentage: 68, growth: '+12%' },
      { category: 'Lifestyle', percentage: 54, growth: '+8%' },
      { category: 'Tecnología', percentage: 32, growth: '+15%' },
      { category: 'Viajes', percentage: 28, growth: '+5%' },
      { category: 'Fitness', percentage: 25, growth: '+18%' },
      { category: 'Gastronomía', percentage: 22, growth: '+7%' }
    ],
    growth: {
      monthly: [
        { month: 'Ene', followers: 2650000, engagement: 3.8 },
        { month: 'Feb', followers: 2720000, engagement: 4.0 },
        { month: 'Mar', followers: 2780000, engagement: 4.1 },
        { month: 'Abr', followers: 2847563, engagement: 4.2 }
      ],
      sources: [
        { source: 'Orgánico', percentage: 65 },
        { source: 'Hashtags', percentage: 20 },
        { source: 'Colaboraciones', percentage: 10 },
        { source: 'Publicidad', percentage: 5 }
      ]
    }
  };

  const renderDemographics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-[#01257D]" />
          Grupos de Edad
        </h3>
        <div className="space-y-4">
          {audienceData.demographics.age.map((group, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{group.range} años</span>
                <span className="text-sm text-gray-600">{group.count.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${group.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-10">{group.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-[#01257D]" />
          Distribución por Género
        </h3>
        <div className="space-y-4">
          {audienceData.demographics.gender.map((gender, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium flex items-center">
                  {gender.type === 'Femenino' && <User className="w-4 h-4 mr-2 text-pink-500" />}
                  {gender.type === 'Masculino' && <User className="w-4 h-4 mr-2 text-blue-500" />}
                  {gender.type}
                </span>
                <span className="text-sm text-gray-600">{gender.count.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      gender.type === 'Femenino' ? 'bg-pink-500' :
                      gender.type === 'Masculino' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${gender.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-10">{gender.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-[#01257D]" />
          Ubicaciones Principales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audienceData.demographics.location.map((location, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{location.country}</span>
                <span className="text-sm text-gray-600">{location.percentage}%</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">📍 {location.city}</div>
              <div className="text-sm font-medium">{location.count.toLocaleString()} seguidores</div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${location.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBehavior = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-[#01257D]" />
          Horarios de Mayor Actividad
        </h3>
        <div className="space-y-3">
          {audienceData.behavior.activeHours.map((hour, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="font-medium">{hour.hour}</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                    style={{ width: `${hour.activity}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-10">{hour.activity}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Uso de Plataformas</h3>
        <div className="space-y-4">
          {audienceData.behavior.platforms.map((platform, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{platform.platform}</span>
                <span className="text-sm text-gray-600">{platform.engagement}% engagement</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#01257D]"
                    style={{ width: `${platform.usage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{platform.usage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Preferencias de Contenido</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {audienceData.behavior.contentTypes.map((content, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-[#01257D] mb-2">{content.preference}%</div>
              <div className="text-sm font-medium">{content.type}</div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#01257D]"
                  style={{ width: `${content.preference}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-[#01257D]" />
          Intereses y Categorías
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {audienceData.interests.map((interest, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{interest.category}</h4>
                <span className="text-sm text-green-600 font-medium">{interest.growth}</span>
              </div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: `${interest.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{interest.percentage}%</span>
              </div>
              <div className="text-xs text-gray-600">
                {Math.round(audienceData.totalAudience * interest.percentage / 100).toLocaleString()} seguidores
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGrowth = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-[#01257D]" />
          Crecimiento Mensual
        </h3>
        <div className="space-y-4">
          {audienceData.growth.monthly.map((month, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <div className="font-semibold">{month.month}</div>
                <div className="text-sm text-gray-600">{month.followers.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  {index > 0 && `+${((month.followers - audienceData.growth.monthly[index-1].followers) / 1000).toFixed(0)}K`}
                </div>
                <div className="text-sm text-gray-600">{month.engagement}% eng.</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Fuentes de Crecimiento</h3>
        <div className="space-y-4">
          {audienceData.growth.sources.map((source, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{source.source}</span>
                <span className="text-sm text-gray-600">
                  {Math.round(audienceData.totalAudience * source.percentage / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                    style={{ width: `${source.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-10">{source.percentage}%</span>
              </div>
            </div>
          ))}
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
              Audience Intelligence
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Análisis profundo de tu audiencia personalizada
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {/* Métricas resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{audienceData.totalAudience.toLocaleString()}</div>
            <div className="text-sm text-blue-800">Total Audiencia</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{audienceData.realFollowers}%</div>
            <div className="text-sm text-green-800">Followers Reales</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{audienceData.avgAge}</div>
            <div className="text-sm text-purple-800">Edad Promedio</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">4.2%</div>
            <div className="text-sm text-orange-800">Engagement Rate</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'demographics', label: 'Demografía', icon: Users },
            { id: 'behavior', label: 'Comportamiento', icon: BarChart3 },
            { id: 'interests', label: 'Intereses', icon: Heart },
            { id: 'growth', label: 'Crecimiento', icon: TrendingUp }
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
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeView === 'demographics' && renderDemographics()}
        {activeView === 'behavior' && renderBehavior()}
        {activeView === 'interests' && renderInterests()}
        {activeView === 'growth' && renderGrowth()}
      </motion.div>
    </div>
  );
}