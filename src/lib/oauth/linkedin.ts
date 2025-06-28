import { Account, Profile } from 'next-auth';

export interface LinkedInProfile extends Profile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
  emailAddress?: string;
}

export interface LinkedInAccount extends Account {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  description: string;
  followerCount: number;
  logoUrl?: string;
  website?: string;
  industry?: string;
}

export interface LinkedInPost {
  id: string;
  text: string;
  createdAt: string;
  totalSocialActivityCounts: {
    numLikes: number;
    numComments: number;
    numShares: number;
  };
  author: string;
  content?: {
    media?: Array<{
      type: string;
      url: string;
    }>;
  };
}

export class LinkedInOAuthService {
  private baseUrl = 'https://api.linkedin.com/v2';

  /**
   * Obtiene información del perfil del usuario autenticado
   */
  async getProfile(accessToken: string): Promise<LinkedInProfile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~:(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:mediumElements))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const profile = await response.json();
      return profile;
    } catch (error) {
      console.error('Error obteniendo perfil de LinkedIn:', error);
      return null;
    }
  }

  /**
   * Obtiene el email del usuario autenticado
   */
  async getUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/emailAddress?q=members&projection=(elements*(handle~))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.elements && data.elements.length > 0) {
        return data.elements[0]['handle~'].emailAddress;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo email de LinkedIn:', error);
      return null;
    }
  }

  /**
   * Obtiene las organizaciones que administra el usuario
   */
  async getUserOrganizations(accessToken: string): Promise<LinkedInOrganization[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,name,description,followerCount,logoV2(original~:playableStreams),website,industries)))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.elements) {
        return data.elements.map((element: any) => {
          const org = element['organization~'];
          return {
            id: org.id,
            name: org.name,
            description: org.description || '',
            followerCount: org.followerCount || 0,
            logoUrl: org.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier,
            website: org.website,
            industry: org.industries?.[0]
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo organizaciones de LinkedIn:', error);
      return [];
    }
  }

  /**
   * Obtiene las publicaciones de una organización
   */
  async getOrganizationPosts(accessToken: string, organizationId: string, count: number = 10): Promise<LinkedInPost[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/shares?q=owners&owners=urn:li:organization:${organizationId}&count=${count}&projection=(elements*(id,text,created,totalSocialActivityCounts,author,content))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.elements) {
        return data.elements.map((element: any) => ({
          id: element.id,
          text: element.text?.text || '',
          createdAt: new Date(element.created.time).toISOString(),
          totalSocialActivityCounts: element.totalSocialActivityCounts || {
            numLikes: 0,
            numComments: 0,
            numShares: 0
          },
          author: element.author,
          content: element.content
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error obteniendo posts de LinkedIn:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de seguidores de una organización
   */
  async getOrganizationFollowerStats(accessToken: string, organizationId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      return data.elements?.[0] || null;
    } catch (error) {
      console.error('Error obteniendo estadísticas de seguidores:', error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas de engagement de publicaciones
   */
  async getShareStatistics(accessToken: string, shareId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/socialActions/${shareId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`LinkedIn API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas de share:', error);
      return null;
    }
  }

  /**
   * Analiza el sentimiento de posts de LinkedIn
   */
  async analyzePostSentiment(posts: LinkedInPost[]): Promise<any> {
    try {
      const sentimentAnalysis = posts.map(post => {
        const text = post.text.toLowerCase();
        let sentiment = 'neutral';
        let score = 0;

        // Palabras profesionales positivas
        const positiveWords = [
          'excelente', 'logro', 'éxito', 'innovación', 'líder', 'profesional', 
          'crecimiento', 'oportunidad', 'colaboración', 'excellent', 'achievement', 
          'success', 'innovation', 'leader', 'growth', 'opportunity', 'collaboration'
        ];
        
        const negativeWords = [
          'problema', 'dificultad', 'crisis', 'fallo', 'error', 'preocupación',
          'problem', 'difficulty', 'crisis', 'failure', 'error', 'concern'
        ];

        positiveWords.forEach(word => {
          if (text.includes(word)) score += 1;
        });

        negativeWords.forEach(word => {
          if (text.includes(word)) score -= 1;
        });

        if (score > 0) sentiment = 'positive';
        else if (score < 0) sentiment = 'negative';

        return {
          post_id: post.id,
          text: post.text,
          sentiment,
          score,
          engagement: post.totalSocialActivityCounts.numLikes + 
                     post.totalSocialActivityCounts.numComments + 
                     post.totalSocialActivityCounts.numShares
        };
      });

      const totalPosts = sentimentAnalysis.length;
      const positive = sentimentAnalysis.filter(p => p.sentiment === 'positive').length;
      const negative = sentimentAnalysis.filter(p => p.sentiment === 'negative').length;
      const neutral = sentimentAnalysis.filter(p => p.sentiment === 'neutral').length;

      return {
        summary: {
          total_posts: totalPosts,
          positive_percentage: totalPosts > 0 ? (positive / totalPosts) * 100 : 0,
          negative_percentage: totalPosts > 0 ? (negative / totalPosts) * 100 : 0,
          neutral_percentage: totalPosts > 0 ? (neutral / totalPosts) * 100 : 0,
        },
        detailed_analysis: sentimentAnalysis
      };
    } catch (error) {
      console.error('Error analizando sentimiento de posts:', error);
      return null;
    }
  }

  /**
   * Verifica si el token de acceso es válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/people/~`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error validando token de LinkedIn:', error);
      return false;
    }
  }
}

export const linkedinOAuth = new LinkedInOAuthService();
