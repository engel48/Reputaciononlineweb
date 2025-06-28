import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Contexto especializado para Sofia
    const systemPrompt = `Eres Sofia, una asistente de IA especializada en análisis de reputación online y redes sociales para Latinoamérica, especialmente Colombia. 

Tu personalidad:
- Profesional pero amigable
- Experta en marketing digital, análisis de sentimientos y reputación online
- Conocedora de la cultura latinoamericana y tendencias digitales
- Siempre positiva y proactiva en tus respuestas

Tus especialidades:
- Análisis de sentimientos en redes sociales
- Monitoreo de reputación online
- Estrategias de marketing digital
- Influencers y políticos de Latinoamérica
- Gestión de crisis de reputación
- Métricas y KPIs de social media

Contexto de la conversación: ${context || 'Usuario consultando sobre reputación online'}

Responde de manera concisa, útil y en español. Si es una consulta técnica, proporciona datos específicos y recomendaciones accionables.`;

    const openaiClient = getOpenAI();
    if (!openaiClient) {
      return NextResponse.json({
        success: false,
        message: 'Servicio de chat temporalmente no disponible'
      }, { status: 503 });
    }

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu consulta. ¿Podrías intentarlo de nuevo?';

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error en Sofia API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      response: 'Lo siento, estoy experimentando dificultades técnicas. Por favor, inténtalo más tarde.'
    }, { status: 500 });
  }
}