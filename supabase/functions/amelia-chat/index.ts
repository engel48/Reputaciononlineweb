import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface ChatRequest {
  message: string;
  conversation_id?: string;
  user_id: string;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const AMELIA_SYSTEM_PROMPT = `Eres Amelia, una asistente de inteligencia artificial experta en reputación digital y análisis de medios en Colombia.

**Tu personalidad:**
- Profesional pero cercana y amigable
- Conoces profundamente el contexto político y cultural colombiano
- Entiendes modismos y referencias locales
- Eres empática ante crisis reputacionales
- Orientada a soluciones prácticas

**Tu experiencia:**
- Análisis de reputación digital en redes sociales
- Monitoreo de medios colombianos (El Tiempo, Semana, RCN, Caracol, etc.)
- Crisis management y comunicación estratégica
- Política colombiana: congreso, alcaldías, gobernaciones
- Tendencias en Twitter/X, Facebook, Instagram, TikTok en Colombia
- Análisis de sentimiento y percepción pública

**Cómo respondes:**
- En español colombiano natural
- Con datos específicos cuando sea posible
- Ofreces recomendaciones accionables
- Identificas riesgos y oportunidades
- Citas fuentes cuando mencionas información verificable
- Usas emojis ocasionalmente para ser más humana 😊

**Contexto actual (Colombia 2025):**
- Uso masivo de redes sociales para política
- Polarización política fuerte
- Importancia de TikTok en campañas
- Desinformación como desafío constante
- Monitoreo 24/7 esencial para figuras públicas

**Tu rol:**
Ayudar a usuarios a entender y mejorar su reputación online, detectar crisis temprano, y crear estrategias de comunicación efectivas en el contexto colombiano.

Recuerda: Eres parte de la plataforma "Reputación Online", una herramienta colombiana líder en monitoreo reputacional.`;

async function callGeminiAPI(messages: GeminiMessage[], apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topK: 40,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, conversation_id, user_id }: ChatRequest = await req.json();

    if (!message || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing chat for user ${user_id}`);

    let conversationId = conversation_id;

    // Crear nueva conversación si no existe
    if (!conversationId) {
      const { data: newConversation, error: conversationError } = await supabase
        .from('amelia_conversations')
        .insert({
          user_id: user_id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        throw conversationError;
      }

      conversationId = newConversation.id;
      console.log(`Created new conversation: ${conversationId}`);
    }

    // Guardar mensaje del usuario
    const { error: userMessageError } = await supabase
      .from('amelia_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      throw userMessageError;
    }

    // Obtener historial de conversación (últimos 10 mensajes)
    const { data: history, error: historyError } = await supabase
      .from('amelia_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching history:', historyError);
      throw historyError;
    }

    // Construir mensajes para Gemini
    const geminiMessages: GeminiMessage[] = [
      {
        role: 'user',
        parts: [{ text: AMELIA_SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: '¡Hola! Soy Amelia, tu asistente de reputación digital. Estoy aquí para ayudarte a monitorear y mejorar tu presencia online en Colombia. ¿En qué puedo ayudarte hoy?' }]
      }
    ];

    // Agregar historial (excepto el último mensaje que ya está incluido)
    for (let i = 0; i < history.length - 1; i++) {
      const msg = history[i];
      geminiMessages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Agregar mensaje actual
    geminiMessages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    console.log(`Calling Gemini with ${geminiMessages.length} messages`);

    // Llamar a Gemini API
    const ameliaResponse = await callGeminiAPI(geminiMessages, geminiApiKey);

    console.log(`Gemini response received: ${ameliaResponse.slice(0, 100)}...`);

    // Guardar respuesta de Amelia
    const { error: ameliaMessageError } = await supabase
      .from('amelia_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: ameliaResponse,
        created_at: new Date().toISOString()
      });

    if (ameliaMessageError) {
      console.error('Error saving Amelia message:', ameliaMessageError);
      throw ameliaMessageError;
    }

    // Actualizar timestamp de conversación
    const { error: updateConversationError } = await supabase
      .from('amelia_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateConversationError) {
      console.error('Error updating conversation:', updateConversationError);
    }

    // TODO: Generar embeddings para memoria semántica (opcional)
    // Esto requiere pgvector configurado y un modelo de embeddings

    console.log(`✅ Chat processed successfully for conversation ${conversationId}`);

    return new Response(JSON.stringify({
      success: true,
      conversation_id: conversationId,
      response: ameliaResponse,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Amelia chat error:', error);

    // Respuesta de fallback si Gemini falla
    const fallbackResponse = 'Lo siento, estoy teniendo problemas técnicos en este momento. Por favor intenta nuevamente en unos momentos. Si el problema persiste, contacta a soporte.';

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      response: fallbackResponse
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
