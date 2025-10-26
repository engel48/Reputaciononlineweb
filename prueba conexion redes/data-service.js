// Servicio de generación de datos de redes sociales
class SocialDataService {
    constructor() {
        this.postContents = [
            'Lanzamiento exitoso de nuestra nueva campaña digital. ¡Resultados increíbles en las primeras 24 horas!',
            'Detrás de cámaras de nuestro último proyecto. El equipo trabajó de manera excepcional.',
            'Celebrando 10 años de innovación constante y crecimiento sostenido en el mercado.',
            'Nuevas estrategias de marketing digital que están transformando el sector en 2025.',
            'Gracias a todos por el apoyo incondicional. ¡Alcanzamos 150K seguidores!',
            'Webinar exclusivo sobre transformación digital y nuevas tecnologías. Cupos limitados.',
            'Nuestro compromiso firme con la sostenibilidad y responsabilidad social empresarial.',
            'Historias reales de éxito de clientes que confiaron en nosotros.',
            'Innovación tecnológica aplicada a soluciones reales del mercado actual.',
            'Equipo altamente capacitado y motivado para enfrentar nuevos desafíos.',
            'Análisis de las principales tendencias del mercado digital para este trimestre.',
            'Alianza estratégica con líderes reconocidos del sector tecnológico.',
            'Evento presencial multitudinario con más de 800 asistentes de toda Latinoamérica.',
            'Actualizaciones importantes sobre nuestros productos y servicios premium.',
            'Reconocimiento internacional por nuestra labor e impacto en la industria.',
            'Inauguración de nuevas oficinas con tecnología de punta y espacios colaborativos.',
            'Datos precisos y análisis profundos que están transformando negocios.',
            'Inversión estratégica en desarrollo de talento humano y capacitación continua.',
            'Soluciones integrales y personalizadas para empresas en crecimiento acelerado.',
            'Testimonios auténticos de clientes completamente satisfechos con los resultados.',
        ];

        this.hashtags = [
            '#Marketing', '#Digital', '#Innovación', '#Negocios', '#Éxito',
            '#Crecimiento', '#Estrategia', '#Liderazgo', '#Tecnología', '#Branding',
            '#Emprendimiento', '#Transformación', '#Datos', '#Analytics', '#Tendencias'
        ];

        this.cities = [
            { name: 'Bogotá', percentage: 38 },
            { name: 'Medellín', percentage: 24 },
            { name: 'Cali', percentage: 15 },
            { name: 'Barranquilla', percentage: 10 },
            { name: 'Cartagena', percentage: 8 },
            { name: 'Otras ciudades', percentage: 5 }
        ];
    }

    generatePost(index, followers, platform) {
        // Métricas realistas basadas en benchmarks 2024-2025
        // Instagram engagement: 0.45%-4%, Facebook: 0.15%-2%
        const engagementRate = platform === 'instagram'
            ? (Math.random() * 3.5 + 0.45) / 100  // 0.45% - 4%
            : (Math.random() * 1.85 + 0.15) / 100; // 0.15% - 2%

        // Reach rate: Instagram ~3.5%, Facebook ~1.2%
        const reachRate = platform === 'instagram'
            ? (Math.random() * 2 + 2.5) / 100  // 2.5% - 4.5%
            : (Math.random() * 1 + 0.7) / 100; // 0.7% - 1.7%

        const reach = Math.floor(followers * reachRate);
        const impressions = Math.floor(reach * (1.2 + Math.random() * 0.8)); // 1.2x - 2x del reach

        const totalEngagements = Math.floor(reach * engagementRate);

        // Distribución realista de engagement: 80% likes, 15% comments, 5% shares
        const likes = Math.floor(totalEngagements * (0.75 + Math.random() * 0.1));
        const comments = Math.floor(totalEngagements * (0.12 + Math.random() * 0.08));
        const shares = totalEngagements - likes - comments;

        const actualEngagement = ((likes + comments + shares) / reach) * 100;

        const sentiments = ['positive', 'positive', 'positive', 'neutral', 'neutral', 'negative'];
        const mediaTypes = ['image', 'image', 'video', 'carousel', 'text'];

        const randomHashtags = this.shuffle([...this.hashtags]).slice(0, Math.floor(Math.random() * 4) + 2);

        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000));

        return {
            id: `post_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            content: this.postContents[index % this.postContents.length],
            timestamp: timestamp,
            likes,
            comments,
            shares: Math.max(1, shares),
            reach,
            impressions,
            engagement_rate: parseFloat(actualEngagement.toFixed(2)),
            sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
            media_type: mediaTypes[Math.floor(Math.random() * mediaTypes.length)],
            hashtags: randomHashtags,
            mentions: Math.floor(Math.random() * 4)
        };
    }

    generateMetrics(platform) {
        // Seguidores realistas: 1K - 50K para cuentas pequeñas/medianas
        const followers = Math.floor(Math.random() * 49000) + 1000;
        const following = Math.floor(Math.random() * 1500) + 200;
        const totalPosts = Math.floor(Math.random() * 800) + 100;

        // Engagement rate realista según plataforma
        const avgEngagement = platform === 'instagram'
            ? parseFloat((Math.random() * 3 + 0.5).toFixed(2))    // 0.5% - 3.5%
            : parseFloat((Math.random() * 1.5 + 0.2).toFixed(2)); // 0.2% - 1.7%

        // Reach rate realista
        const reachRate = platform === 'instagram' ? 0.035 : 0.012; // 3.5% Instagram, 1.2% Facebook
        const totalReach = Math.floor(followers * reachRate * totalPosts);

        // Growth rate mensual realista: 2% - 8%
        const growthRate = parseFloat((Math.random() * 6 + 2).toFixed(1));

        return {
            followers,
            following,
            totalPosts,
            avgEngagement,
            totalReach,
            growthRate,
            peakHours: [9, 12, 14, 18, 20, 21],
            demographics: {
                ageRanges: [
                    { range: '18-24', percentage: 19 },
                    { range: '25-34', percentage: 41 },
                    { range: '35-44', percentage: 25 },
                    { range: '45-54', percentage: 11 },
                    { range: '55+', percentage: 4 }
                ],
                gender: {
                    male: 45 + Math.floor(Math.random() * 10),
                    female: 47 + Math.floor(Math.random() * 10),
                    other: 2 + Math.floor(Math.random() * 4)
                },
                locations: this.cities
            }
        };
    }

    generateEngagementTrends(platform) {
        const trends = [];
        // Base value según plataforma
        const baseValue = platform === 'instagram' ? 0.9 : 0.4;
        const maxVariation = platform === 'instagram' ? 2.5 : 1.2;

        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const variation = (Math.random() - 0.5) * maxVariation;
            trends.push({
                date: date.toISOString().split('T')[0],
                value: parseFloat(Math.max(0.1, baseValue + variation).toFixed(2))
            });
        }
        return trends;
    }

    async connect(platform) {
        const startTime = Date.now();

        // Simular delay de red
        await this.delay(Math.random() * 200 + 100);

        // Generar métricas primero para obtener followers
        const metrics = this.generateMetrics(platform);

        // Generar posts con base en followers
        const posts = [];
        for (let i = 0; i < 20; i++) {
            posts.push(this.generatePost(i, metrics.followers, platform));
        }

        const sentimentCounts = posts.reduce((acc, post) => {
            acc[post.sentiment]++;
            return acc;
        }, { positive: 0, neutral: 0, negative: 0 });

        const totalPosts = posts.length;
        const sentimentDist = {
            positive: parseFloat(((sentimentCounts.positive / totalPosts) * 100).toFixed(1)),
            neutral: parseFloat(((sentimentCounts.neutral / totalPosts) * 100).toFixed(1)),
            negative: parseFloat(((sentimentCounts.negative / totalPosts) * 100).toFixed(1))
        };

        const endTime = Date.now();

        return {
            platform,
            accountId: `${platform}_${Math.floor(Math.random() * 9999999) + 1000000}`,
            accountName: platform === 'facebook'
                ? 'Empresa Digital Colombia'
                : '@empresadigitalcolombia',
            profileImage: `https://ui-avatars.com/api/?name=${platform === 'facebook' ? 'FB' : 'IG'}&size=200&background=${platform === 'facebook' ? '1877f2' : 'e4405f'}&color=fff`,
            verified: Math.random() > 0.25,
            metrics: metrics,
            posts: posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
            engagementTrends: this.generateEngagementTrends(platform),
            sentimentDistribution: sentimentDist,
            apiData: {
                apiVersion: platform === 'facebook' ? 'Graph API v19.0' : 'Instagram Graph API v18.0',
                collectionTime: endTime - startTime,
                lastSync: new Date(),
                dataPoints: posts.length * 12 + 47,
                rateLimit: Math.floor(Math.random() * 280) + 720,
                rateLimitMax: 1000
            }
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    shuffle(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    formatNumber(num) {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (hours < 1) return 'Hace menos de 1 hora';
        if (hours < 24) return `Hace ${hours} horas`;
        if (days === 1) return 'Hace 1 día';
        if (days < 7) return `Hace ${days} días`;
        if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
}

// Instancia global
const dataService = new SocialDataService();
