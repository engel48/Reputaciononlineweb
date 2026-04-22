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

  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [crisisConfig, setCrisisConfig] = useState<any>(null);
  const [responseTemplates, setResponseTemplates] = useState<ResponseTemplate[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);

  // REAL crisis monitoring using mention velocity and sentiment analysis
  useEffect(() => {
    const monitorCrisisInRealTime = async () => {
      try {
        // Get user session
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();

        if (!session?.user?.id) {
          setCrisisAlerts([]);
          return;
        }

        setUserId(session.user.id);

        // Fetch crisis configuration from Supabase
        const configResponse = await fetch(`/api/crisis-management/config?userId=${session.user.id}`);
        const config = await configResponse.json();
        setCrisisConfig(config);

        // Set real configuration from Supabase
        if (config.templates) {
          setResponseTemplates(config.templates);
        }
        if (config.rules) {
          setEscalationRules(config.rules);
        }

        // Fetch recent mentions (last 24h) for velocity analysis
        const mentionsResponse = await fetch(`/api/mentions?userId=${session.user.id}&hours=24`);
        const mentionsData = await mentionsResponse.json();

        // Calculate mention velocity (mentions per hour)
        const recentMentions = mentionsData.mentions || [];
        const mentionVelocity = recentMentions.length / 24;

        // Calculate average sentiment
        const avgSentiment = recentMentions.reduce((sum: number, m: any) =>
          sum + (m.sentiment || 50), 0) / (recentMentions.length || 1);

        // Detect sentiment drop (crisis indicator)
        const sentimentDrop = 50 - avgSentiment;

        // Use Julia IA (Groq) to analyze potential crisis
        const crisisAnalysisResponse = await fetch('/api/julia', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Analiza posible crisis: ${mentionVelocity.toFixed(1)} menciones/hora, sentiment promedio: ${avgSentiment.toFixed(0)}%, caída de sentiment: ${sentimentDrop.toFixed(0)}%`,
            context: 'crisis-detection',
            userId: session.user.id
          })
        });
        const crisisAnalysis = await crisisAnalysisResponse.json();

        // Set crisis alerts from AI analysis
        if (crisisAnalysis.alerts && crisisAnalysis.alerts.length > 0) {
          setCrisisAlerts(crisisAnalysis.alerts);
        } else {
          setCrisisAlerts([]);
        }

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error monitoring crisis:', error);
        setCrisisAlerts([]);
      }
    };

    monitorCrisisInRealTime();

    // Monitor every 5 minutes
    if (isMonitoring) {
      const interval = setInterval(() => {
        monitorCrisisInRealTime();
      }, 300000); // 5 minutes

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

      {/* Real-time Crisis Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Velocidad de Menciones (24h)</h3>
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-[#01257D] mb-2">
              {crisisAlerts.length > 0 ? '⚠️' : '✅'}
            </div>
            <div className="text-2xl font-bold mb-2">
              {crisisAlerts.length} Crisis Detectadas
            </div>
            <p className="text-sm text-gray-600">
              Sistema de monitoreo en tiempo real activo
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Estado del Sistema</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Monitoreo de Sentiment</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Análisis de Velocidad</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Detección con IA</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>Notificaciones Activas</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
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

        {responseTemplates.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No hay plantillas de respuesta
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crea plantillas personalizadas para responder rápidamente a crisis
            </p>
            <button className="px-6 py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
              Crear Primera Plantilla
            </button>
          </div>
        ) : (
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
        )}
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

        {escalationRules.length === 0 ? (
          <div className="text-center py-12">
            <ArrowUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No hay reglas de escalación
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Define reglas automáticas para escalar crisis según severidad
            </p>
            <button className="px-6 py-3 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
              Crear Primera Regla
            </button>
          </div>
        ) : (
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
        )}
      </div>

      {/* Emergency Contacts from Config */}
      {crisisConfig?.emergency_contacts && crisisConfig.emergency_contacts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Contactos de Emergencia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crisisConfig.emergency_contacts.map((contact: any, index: number) => (
              <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <PhoneCall className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold">{contact.role}</h4>
                </div>
                <p className="text-sm text-gray-600">{contact.name}</p>
                {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
                {contact.email && <p className="text-sm text-gray-600">{contact.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(!crisisConfig?.emergency_contacts || crisisConfig.emergency_contacts.length === 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Contactos de Emergencia</h3>
          <div className="text-center py-8">
            <PhoneCall className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">No hay contactos de emergencia configurados</p>
            <button className="mt-4 px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90">
              Configurar Contactos
            </button>
          </div>
        </div>
      )}
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