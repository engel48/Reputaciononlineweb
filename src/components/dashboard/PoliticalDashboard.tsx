"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendingUp, Users, Vote, Globe, BarChart3, Calendar, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';

interface PoliticalMetrics {
  approvalRating: number;
  previousApproval: number;
  voterSentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  demographicData: {
    youngVoters: number;
    adultVoters: number;
    seniorVoters: number;
  };
  keyIssues: Array<{
    issue: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    mentions: number;
  }>;
  campaignMetrics?: {
    donations: number;
    volunteers: number;
    events: number;
  };
}

const PoliticalDashboard: React.FC = () => {
  const [politicalData, setPoliticalData] = useState<PoliticalMetrics>({
    approvalRating: 0,
    previousApproval: 0,
    voterSentiment: { positive: 0, negative: 0, neutral: 0 },
    demographicData: { youngVoters: 0, adultVoters: 0, seniorVoters: 0 },
    keyIssues: [],
    campaignMetrics: { donations: 0, volunteers: 0, events: 0 }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoliticalMetrics = async () => {
      try {
        const response = await fetch('/api/political-analytics');
        const data = await response.json();
        
        if (data.success && data.metrics) {
          setPoliticalData(data.metrics);
        } else {
          // Datos de fallback si la API falla
          setPoliticalData({
            approvalRating: 72,
            previousApproval: 68,
            voterSentiment: { positive: 45, negative: 25, neutral: 30 },
            demographicData: { youngVoters: 35, adultVoters: 45, seniorVoters: 20 },
            keyIssues: [
              { issue: 'Economía', sentiment: 'positive', mentions: 450 },
              { issue: 'Seguridad', sentiment: 'neutral', mentions: 320 },
              { issue: 'Educación', sentiment: 'positive', mentions: 280 }
            ],
            campaignMetrics: { donations: 250000, volunteers: 120, events: 15 }
          });
        }
      } catch (error) {
        console.error('Error fetching political metrics:', error);
        // Datos de fallback en caso de error
        setPoliticalData({
          approvalRating: 72,
          previousApproval: 68,
          voterSentiment: { positive: 45, negative: 25, neutral: 30 },
          demographicData: { youngVoters: 35, adultVoters: 45, seniorVoters: 20 },
          keyIssues: [
            { issue: 'Economía', sentiment: 'positive', mentions: 450 },
            { issue: 'Seguridad', sentiment: 'neutral', mentions: 320 },
            { issue: 'Educación', sentiment: 'positive', mentions: 280 }
          ],
          campaignMetrics: { donations: 250000, volunteers: 120, events: 15 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPoliticalMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Político */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Crown className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Panel Político Avanzado</h2>
              <p className="text-blue-100">Métricas especializadas para líderes políticos</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{politicalData?.approvalRating || 0}%</div>
            <div className="text-sm text-blue-200">Aprobación General</div>
          </div>
        </div>
      </motion.div>

      {/* Métricas Políticas Específicas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className={`text-sm font-medium ${
              politicalData.approvalRating > politicalData.previousApproval 
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {politicalData.approvalRating > politicalData.previousApproval ? '+' : ''}
              {(politicalData.approvalRating - politicalData.previousApproval).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Aprobación Ciudadana
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{politicalData.approvalRating}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">vs mes anterior</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <Vote className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Intención de Voto
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {politicalData.voterSentiment.positive}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">favorable</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Alcance Digital
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {(politicalData.demographicData.youngVoters + 
              politicalData.demographicData.adultVoters + 
              politicalData.demographicData.seniorVoters).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">ciudadanos alcanzados</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <Zap className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Temas Clave
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {politicalData.keyIssues.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">issues monitoreados</p>
        </motion.div>
      </div>

      {/* Análisis Demográfico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Análisis Demográfico de Apoyo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{politicalData.demographicData.youngVoters}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Jóvenes (18-35)</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{politicalData.demographicData.adultVoters}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Adultos (36-55)</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{politicalData.demographicData.seniorVoters}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mayores (55+)</div>
          </div>
        </div>
      </motion.div>

      {/* Temas Políticos Clave */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-purple-600" />
          Temas Políticos en Debate
        </h3>
        <div className="space-y-3">
          {politicalData.keyIssues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  issue.sentiment === 'positive' ? 'bg-green-500' :
                  issue.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="font-medium text-gray-900 dark:text-white">{issue.issue}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{issue.mentions} menciones</span>
                {issue.sentiment === 'positive' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : issue.sentiment === 'negative' ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : (
                  <Calendar className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Métricas de Campaña (si aplica) */}
      {politicalData.campaignMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Métricas de Campaña
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">${politicalData.campaignMetrics.donations.toLocaleString()}</div>
              <div className="text-sm text-green-100">Donaciones recaudadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{politicalData.campaignMetrics.volunteers.toLocaleString()}</div>
              <div className="text-sm text-green-100">Voluntarios activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{politicalData.campaignMetrics.events}</div>
              <div className="text-sm text-green-100">Eventos realizados</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PoliticalDashboard;