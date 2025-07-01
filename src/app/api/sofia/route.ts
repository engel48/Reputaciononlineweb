import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Usar el servicio unificado de Sofia con contexto especializado
    const sofiaContext = `Usuario consultando sobre reputación online. Especialízate en:
- Análisis de sentimientos en redes sociales
- Monitoreo de reputación online  
- Estrategias de marketing digital
- Influencers y políticos de Latinoamérica
- Gestión de crisis de reputación
- Métricas y KPIs de social media

Contexto de la conversación: ${context || 'Consulta general sobre reputación online'}`;

    const response = await aiService.sofiaChat(message, sofiaContext);

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('🚨 Sofia API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      response: 'Lo siento, Sofia está experimentando dificultades técnicas. Por favor, inténtalo más tarde.'
    }, { status: 500 });
  }
}