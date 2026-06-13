import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { callGroq, GroqMessage } from '../_shared/groq.ts';

interface ChatRequest {
  message: string;
  conversation_id?: string;
  user_id: string;
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
    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
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

    // Construir mensajes para Groq (system + historial; el historial ya incluye
    // el mensaje actual del usuario, guardado arriba).
    const groqMessages: GroqMessage[] = [
      { role: 'system', content: AMELIA_SYSTEM_PROMPT },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.content,
      })),
    ];

    console.log(`Calling Groq with ${groqMessages.length} messages`);

    // Llamar a Groq (IA real)
    const ameliaResponse = await callGroq(groqMessages, {
      apiKey: groqApiKey,
      temperature: 0.7,
      maxTokens: 4096,
    });

    console.log(`Groq response received: ${ameliaResponse.slice(0, 100)}...`);

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

    // Mensaje de error si Groq no responde (no se simula la respuesta)
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
