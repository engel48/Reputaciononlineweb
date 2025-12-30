"use client";

import React from 'react';
import { Activity, Radio, Users, Hash } from 'lucide-react';
import HashtagMonitoring from '@/components/hashtags/HashtagMonitoring';
import AudienceIntelligence from '@/components/social-listening/AudienceIntelligence';
import MediaMonitoring from '@/components/social-listening/MediaMonitoring';
import { SocialListeningCard } from '@/components/dashboard/SocialListeningCard';
import { useUser } from '@/context/UserContext';

export default function MonitoreoPage() {
  const { user } = useUser();

  // Profile para AudienceIntelligence
  const userProfile = {
    type: user?.profileType || 'business',
    specialization: user?.industry || 'general',
    region: 'Colombia'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] rounded-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Centro de Monitoreo
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Monitorea tu reputación en redes sociales, hashtags y medios en tiempo real
          </p>
        </div>

        {/* Social Listening Overview */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-5 w-5 text-[#00E5FF]" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Social Listening
            </h2>
          </div>
          <SocialListeningCard />
        </section>

        {/* Grid: Hashtags + Audience Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hashtag Monitoring */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Hash className="h-5 w-5 text-[#00E5FF]" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Monitoreo de Hashtags
              </h2>
            </div>
            <HashtagMonitoring />
          </section>

          {/* Audience Intelligence */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#00E5FF]" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Análisis de Audiencia
              </h2>
            </div>
            <AudienceIntelligence userProfile={userProfile} />
          </section>
        </div>

        {/* Media Monitoring - Full Width */}
        <section>
          <MediaMonitoring />
        </section>
      </div>
    </div>
  );
}
