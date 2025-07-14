"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Shield, Bell, MessageSquare, TrendingDown, 
  Activity, Clock, Users, MapPin, Target, Zap, Phone, 
  MessageCircle, Send, CheckCircle, XCircle, PlayCircle,
  PauseCircle, Settings, Filter, RefreshCw, Download,
  BarChart3, PieChart, ArrowUp, ArrowDown, Eye, Heart,
  Share2, AlertCircle, Flame, Siren, PhoneCall, Mail
} from 'lucide-react';

interface CrisisAlert {
  id: string;
  type: 'scandal' | 'controversy' | 'backlash' | 'misinformation' | 'viral_negative' | 'competitor_attack';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'monitoring' | 'resolved' | 'escalated';
  timestamp: string;
  source: string;
  platform: string;
  reach: number;
  engagement: number;
  sentiment: number;
  keyMentions: string[];
  affectedRegions: string[];
  trending: boolean;
  escalationLevel: number;
  responseTime: number;
  autoActions: string[];
  recommendations: string[];
}

interface ResponseTemplate {
  id: string;
  name: string;
  type: 'social' | 'press' | 'email' | 'sms';
  content: string;
  platform: string;
  approval: 'auto' | 'manual';
  conditions: string[];
}

interface EscalationRule {
  id: string;
  name: string;
  trigger: 'reach' | 'sentiment' | 'engagement' | 'time' | 'mentions';
  threshold: number;
  actions: string[];
  notifications: string[];
  active: boolean;
}

interface UserProfile {
  type: string;
  specialization?: string;
  region?: string;
}

interface CrisisManagementProps {
  userProfile: UserProfile;
}

export default function CrisisManagement({ userProfile }: CrisisManagementProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'alerts' | 'responses' | 'escalation' | 'analytics'>('dashboard');
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([
    {
      id: '1',
      type: 'controversy',
      title: 'Críticas masivas por declaraciones en entrevista',
      description: 'Incremento del 340% en menciones negativas tras entrevista matutina. Hashtag #ControversiaPolítica trending.',
      severity: 'high',
      status: 'active',
      timestamp: '2024-01-15T09:15:00Z',
      source: 'Twitter',
      platform: 'Social Media',
      reach: 2840000,
      engagement: 156780,
      sentiment: 25,
      keyMentions: ['#ControversiaPolítica', '@usuario_critico', 'declaraciones polémicas'],
      affectedRegions: ['Bogotá', 'Medellín', 'Cali'],
      trending: true,
      escalationLevel: 2,
      responseTime: 45,
      autoActions: ['Notificación enviada', 'Monitoreo intensivo activado'],
      recommendations: [
        'Emitir comunicado oficial inmediatamente',
        'Coordinar con equipo de comunicaciones',
        'Preparar respuesta en video para redes sociales',
        'Contactar periodistas clave para aclaración'
      ]
    },
    {
      id: '2',
      type: 'misinformation',
      title: 'Desinformación sobre propuestas económicas',
      description: 'Información falsa sobre política económica se está viralizando en WhatsApp y Facebook.',
      severity: 'medium',
      status: 'monitoring',
      timestamp: '2024-01-15T11:30:00Z',
      source: 'WhatsApp Groups',
      platform: 'Messaging',
      reach: 890000,
      engagement: 45600,
      sentiment: 35,
      keyMentions: ['fake news', 'propuesta económica', 'desinformación'],
      affectedRegions: ['Antioquia', 'Valle del Cauca'],
      trending: false,
      escalationLevel: 1,
      responseTime: 120,
      autoActions: ['Fact-checking iniciado', 'Contenido reportado'],
      recommendations: [
        'Crear contenido educativo con datos reales',
        'Activar red de verificadores',
        'Impulsar hashtag con información correcta'
      ]
    },
    {
      id: '3',
      type: 'viral_negative',
      title: 'Video negativo se vuelve viral',
      description: 'Clip editado fuera de contexto alcanza 1M de vistas en TikTok con sentiment negativo.',
      severity: 'critical',
      status: 'escalated',
      timestamp: '2024-01-15T08:45:00Z',
      source: 'TikTok',
      platform: 'Video',
      reach: 1200000,
      engagement: 89000,
      sentiment: 15,
      keyMentions: ['#VideoViral', 'contexto manipulado', 'edit malicioso'],
      affectedRegions: ['Nacional'],
      trending: true,
      escalationLevel: 3,
      responseTime: 30,
      autoActions: ['CEO notificado', 'Equipo legal contactado', 'Respuesta preparada'],
      recommendations: [
        'Publicar video completo sin editar',
        'Respuesta inmediata del equipo legal',
        'Activar influencers aliados para contexto',
        'Solicitar revisión de contenido a plataforma'
      ]
    }
  ]);

  const [responseTemplates, setResponseTemplates] = useState<ResponseTemplate[]>([
    {
      id: '1',
      name: 'Aclaración Política General',
      type: 'social',
      content: 'Queremos aclarar que las declaraciones han sido sacadas de contexto. Nuestra posición siempre ha sido...',
      platform: 'Twitter',
      approval: 'manual',
      conditions: ['Controversia política', 'Malinterpretación']
    },
    {
      id: '2',
      name: 'Respuesta a Desinformación',
      type: 'press',
      content: 'Comunicado oficial: Desmentimos categóricamente la información falsa que circula...',
      platform: 'Medios',
      approval: 'auto',
      conditions: ['Fake news', 'Información falsa']
    },
    {
      id: '3',
      name: 'Respuesta de Crisis Urgente',
      type: 'social',
      content: 'Mensaje urgente: Queremos dirigirnos directamente a la ciudadanía para...',
      platform: 'Todas las redes',
      approval: 'manual',
      conditions: ['Crisis crítica', 'Escalación máxima']
    }
  ]);

  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([
    {
      id: '1',
      name: 'Alcance Crítico',
      trigger: 'reach',
      threshold: 1000000,
      actions: ['Notificar CEO', 'Activar protocolo de crisis', 'Preparar rueda de prensa'],
      notifications: ['WhatsApp', 'SMS', 'Email'],
      active: true
    },
    {
      id: '2',
      name: 'Sentiment Extremo',
      trigger: 'sentiment',
      threshold: 20,
      actions: ['Respuesta inmediata', 'Contactar medios amigos', 'Activar voceros'],
      notifications: ['WhatsApp', 'Llamada telefónica'],
      active: true
    },
    {
      id: '3',
      name: 'Viral Negativo',
      trigger: 'engagement',
      threshold: 50000,
      actions: ['Contra-campaña', 'Influencers de apoyo', 'Contenido de respuesta'],
      notifications: ['WhatsApp', 'Email'],
      active: true
    }
  ]);

  // Simulación de monitoreo en tiempo real
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        // Simular actualización de alertas
        setCrisisAlerts(prev => prev.map(alert => ({
          ...alert,
          reach: alert.reach + Math.floor(Math.random() * 10000),
          engagement: alert.engagement + Math.floor(Math.random() * 1000)
        })));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'critical': return 'bg-red-200 text-red-900 border-red-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Flame className="w-4 h-4 text-red-500" />;
      case 'monitoring': return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'escalated': return <Siren className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CrisisMetricCard
          icon={AlertTriangle}
          title="Alertas Activas"
          value={crisisAlerts.filter(a => a.status === 'active').length.toString()}
          status="critical"
        />
        <CrisisMetricCard
          icon={Eye}
          title="En Monitoreo"
          value={crisisAlerts.filter(a => a.status === 'monitoring').length.toString()}
          status="warning"
        />
        <CrisisMetricCard
          icon={Siren}
          title="Escaladas"
          value={crisisAlerts.filter(a => a.status === 'escalated').length.toString()}
          status="danger"
        />
        <CrisisMetricCard
          icon={CheckCircle}
          title="Resueltas (24h)"
          value={crisisAlerts.filter(a => a.status === 'resolved').length.toString()}
          status="success"
        />
      </div>

      {/* Alertas críticas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
            Alertas de Crisis Activas
          </h3>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${isMonitoring ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {isMonitoring ? 'Monitoreo Activo' : 'Monitoreo Pausado'}
              </span>
            </div>
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {isMonitoring ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {crisisAlerts.filter(alert => alert.status === 'active' || alert.status === 'escalated').map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl border-2 ${getSeverityColor(alert.severity)} cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(alert.status)}
                  <div>
                    <h4 className="font-semibold text-lg">{alert.title}</h4>
                    <p className="text-sm opacity-80">{alert.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{(alert.reach / 1000000).toFixed(1)}M</div>
                  <div className="text-xs opacity-80">Alcance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{(alert.engagement / 1000).toFixed(0)}K</div>
                  <div className="text-xs opacity-80">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{alert.sentiment}%</div>
                  <div className="text-xs opacity-80">Sentiment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{alert.responseTime}m</div>
                  <div className="text-xs opacity-80">Tiempo Respuesta</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 opacity-60" />
                  <span className="text-sm">{alert.affectedRegions.join(', ')}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                    Responder
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                    Escalar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mapa de crisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Mapa de Crisis en Tiempo Real</h3>
          <div className="h-64 bg-gradient-to-br from-red-50 to-orange-100 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute inset-0 p-4">
              <div className="h-full w-full relative">
                {/* Simulación de mapa de crisis Colombia */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  {/* Costa con crisis media */}
                  <div className="bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer rounded-lg p-2 mb-1 text-xs text-center shadow-lg animate-pulse">
                    <div className="font-bold">⚠️ Atlántico</div>
                    <div className="text-yellow-900">Crisis Media</div>
                    <div className="text-xs">-12% sentiment</div>
                  </div>
                </div>
                
                {/* Bogotá con crisis alta */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-500 hover:bg-red-600 transition-colors cursor-pointer rounded-lg p-3 text-xs text-center shadow-xl animate-pulse">
                    <div className="font-bold text-white">🚨 Bogotá</div>
                    <div className="text-red-100">Crisis Alta</div>
                    <div className="text-xs text-red-100">-35% sentiment</div>
                    <div className="text-xs text-red-100">2.8M alcance</div>
                  </div>
                </div>
                
                {/* Medellín con crisis media */}
                <div className="absolute top-20 left-6">
                  <div className="bg-orange-400 hover:bg-orange-500 transition-colors cursor-pointer rounded-lg p-2 text-xs text-center shadow-lg">
                    <div className="font-bold">⚠️ Antioquia</div>
                    <div className="text-orange-900">Crisis Media</div>
                    <div className="text-xs">-18% sentiment</div>
                  </div>
                </div>
                
                {/* Valle sin crisis */}
                <div className="absolute top-28 left-10">
                  <div className="bg-green-300 hover:bg-green-400 transition-colors cursor-pointer rounded-lg p-2 text-xs text-center shadow-sm">
                    <div className="font-semibold">✅ Valle</div>
                    <div className="text-green-800">Normal</div>
                    <div className="text-xs">+2% sentiment</div>
                  </div>
                </div>
                
                {/* Cartagena */}
                <div className="absolute top-24 right-6">
                  <div className="bg-yellow-300 hover:bg-yellow-400 transition-colors cursor-pointer rounded-lg p-2 text-xs text-center shadow-sm">
                    <div className="font-semibold">⚠️ Bolívar</div>
                    <div className="text-yellow-800">Vigilancia</div>
                    <div className="text-xs">-5% sentiment</div>
                  </div>
                </div>
                
                {/* Alerta crítica flotante */}
                <div className="absolute top-1 left-1 bg-red-600 text-white rounded-lg p-2 text-xs animate-bounce">
                  <div className="font-bold">🚨 ALERTA CRÍTICA</div>
                  <div>3 crisis activas</div>
                </div>
                
                {/* Leyenda de crisis */}
                <div className="absolute bottom-1 right-1 bg-white/95 rounded-lg p-2 text-xs">
                  <div className="font-semibold mb-1">Nivel Crisis</div>
                  <div className="flex items-center space-x-1 mb-1">
                    <div className="w-3 h-3 bg-red-500 rounded animate-pulse"></div>
                    <span>Crítica</span>
                  </div>
                  <div className="flex items-center space-x-1 mb-1">
                    <div className="w-3 h-3 bg-orange-400 rounded"></div>
                    <span>Alta</span>
                  </div>
                  <div className="flex items-center space-x-1 mb-1">
                    <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                    <span>Media</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span>Normal</span>
                  </div>
                </div>
                
                {/* Título */}
                <div className="absolute top-1 left-20 bg-white/90 rounded-lg p-2">
                  <div className="font-bold text-sm text-red-600">🇨🇴 Monitor de Crisis</div>
                  <div className="text-xs text-gray-600">Tiempo real - {new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Análisis de Sentiment</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sentiment General</span>
              <span className="text-2xl font-bold text-red-600">32%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-red-500 h-3 rounded-full" style={{ width: '32%' }}></div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-red-600">-45%</div>
                <div className="text-gray-600">Cambio 24h</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-600">2.8M</div>
                <div className="text-gray-600">Menciones</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">15min</div>
                <div className="text-gray-600">Tiempo Crítico</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Historial de Alertas</h3>
          <div className="flex space-x-3">
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Todas las alertas</option>
              <option>Solo críticas</option>
              <option>Solo activas</option>
              <option>Resueltas</option>
            </select>
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg text-sm hover:bg-[#01257D]/90">
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {crisisAlerts.map((alert) => (
            <div key={alert.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(alert.status)}
                  <div>
                    <h4 className="font-semibold">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Alcance:</span>
                  <div className="font-medium">{(alert.reach / 1000000).toFixed(1)}M</div>
                </div>
                <div>
                  <span className="text-gray-500">Engagement:</span>
                  <div className="font-medium">{(alert.engagement / 1000).toFixed(0)}K</div>
                </div>
                <div>
                  <span className="text-gray-500">Sentiment:</span>
                  <div className="font-medium">{alert.sentiment}%</div>
                </div>
                <div>
                  <span className="text-gray-500">Plataforma:</span>
                  <div className="font-medium">{alert.platform}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{alert.affectedRegions.join(', ')}</span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                    Ver Detalles
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                    Marcar como Resuelto
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResponses = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Plantillas de Respuesta</h3>
          <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
            <Send className="w-4 h-4 mr-2 inline" />
            Nueva Plantilla
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {responseTemplates.map((template) => (
            <div key={template.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{template.name}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${template.approval === 'auto' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {template.approval === 'auto' ? 'Auto' : 'Manual'}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {template.type}
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Contenido:</div>
                <div className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  {template.content}
                </div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Plataforma:</div>
                <div className="text-sm font-medium">{template.platform}</div>
              </div>
              
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Condiciones:</div>
                <div className="flex flex-wrap gap-1">
                  {template.conditions.map((condition, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                  Editar
                </button>
                <button className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">
                  Usar Ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEscalation = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Reglas de Escalación</h3>
          <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
            <Settings className="w-4 h-4 mr-2 inline" />
            Nueva Regla
          </button>
        </div>

        <div className="space-y-4">
          {escalationRules.map((rule) => (
            <div key={rule.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <h4 className="font-semibold">{rule.name}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {rule.trigger}
                  </span>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    {rule.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Umbral:</div>
                  <div className="font-medium">{rule.threshold.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Acciones:</div>
                  <div className="space-y-1">
                    {rule.actions.map((action, index) => (
                      <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Notificaciones:</div>
                  <div className="flex flex-wrap gap-1">
                    {rule.notifications.map((notification, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {notification}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contactos de emergencia */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Contactos de Emergencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <PhoneCall className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold">Director de Comunicaciones</h4>
            </div>
            <p className="text-sm text-gray-600">María González</p>
            <p className="text-sm text-gray-600">+57 300 123 4567</p>
            <p className="text-sm text-gray-600">comunicaciones@campaign.com</p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold">Jefe de Prensa</h4>
            </div>
            <p className="text-sm text-gray-600">Carlos Rodríguez</p>
            <p className="text-sm text-gray-600">+57 301 987 6543</p>
            <p className="text-sm text-gray-600">prensa@campaign.com</p>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <Shield className="w-8 h-8 text-red-500 mr-3" />
              Crisis Management System
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Detección, monitoreo y respuesta automatizada a crisis de reputación
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </div>
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
              <Download className="w-4 h-4 mr-2 inline" />
              Exportar Reporte
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'alerts', label: 'Alertas', icon: Bell },
            { id: 'responses', label: 'Respuestas', icon: MessageCircle },
            { id: 'escalation', label: 'Escalación', icon: ArrowUp },
            { id: 'analytics', label: 'Análisis', icon: PieChart }
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
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'alerts' && renderAlerts()}
          {activeView === 'responses' && renderResponses()}
          {activeView === 'escalation' && renderEscalation()}
          {activeView === 'analytics' && renderDashboard()}
        </motion.div>
      </AnimatePresence>

      {/* Modal de detalle de alerta */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detalle de Crisis</h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">{selectedAlert.title}</h4>
                  <p className="text-gray-600 mb-4">{selectedAlert.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{(selectedAlert.reach / 1000000).toFixed(1)}M</div>
                      <div className="text-sm text-gray-600">Alcance</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{(selectedAlert.engagement / 1000).toFixed(0)}K</div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{selectedAlert.sentiment}%</div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{selectedAlert.escalationLevel}</div>
                      <div className="text-sm text-gray-600">Nivel Escalación</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2">Recomendaciones:</h5>
                  <ul className="space-y-1">
                    {selectedAlert.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Responder Crisis
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    Escalar Ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CrisisMetricCard({ icon: Icon, title, value, status }: {
  icon: any;
  title: string;
  value: string;
  status: 'success' | 'warning' | 'danger' | 'critical';
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'danger': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-[#01257D]" />
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {status}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
      <div className="text-gray-600 dark:text-gray-400">{title}</div>
    </div>
  );
}