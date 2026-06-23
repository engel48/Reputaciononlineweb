/**
 * Reprocesa el sentimiento PENDIENTE (null) con Groq real.
 *
 *  - news_mentions WHERE sentiment IS NULL  → sentiment + sentiment_score (escala -1..1)
 *  - mentions      WHERE metadata->>'sentiment' IS NULL → metadata.{sentiment,sentiment_score(-100..100),sentiment_explanation}
 *
 * Política "solo Groq": si Groq falla en un item, se deja pendiente (no se fabrica valor).
 * Usa el MISMO prompt/modelo que src/lib/ai-service.ts analyzeSentiment.
 *
 * Uso:  node scripts/reprocess-pending-sentiment.cjs
 * Requiere en .env.local: GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- cargar .env.local manualmente (sin depender de dotenv) ---
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return { ...env, ...process.env };
}
const ENV = loadEnv();

const GROQ_API_KEY = ENV.GROQ_API_KEY;
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

if (!GROQ_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan GROQ_API_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Llama a Groq (real). Devuelve {sentiment, score(-1..1), explanation} o null si falla. */
async function analyzeSentiment(text) {
  const body = {
    model: GROQ_MODEL,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Eres un experto en análisis de sentimientos para español colombiano. Detectas sarcasmo, ironía, emojis y hashtags. Respondes SIEMPRE con un JSON válido con las claves: sentiment (positive|negative|neutral), score (número -1.0 a +1.0), explanation (1-2 frases en español).\nReglas de score: -1.0 a -0.3 = negative, -0.3 a +0.3 = neutral, +0.3 a +1.0 = positive.',
      },
      { role: 'user', content: `Analiza el sentimiento de este texto: "${(text || '').slice(0, 4000)}"` },
    ],
  };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`  Groq ${res.status}: ${(await res.text().catch(() => '')).slice(0, 120)}`);
      return null;
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    if (!['positive', 'negative', 'neutral'].includes(parsed.sentiment)) return null;
    let score = typeof parsed.score === 'number' ? parsed.score : 0;
    if (score > 1) score = score / 100;
    score = Math.max(-1, Math.min(1, score));
    return { sentiment: parsed.sentiment, score, explanation: parsed.explanation || '' };
  } catch (e) {
    console.warn('  Groq error:', e.message);
    return null;
  }
}

async function reprocessNewsMentions() {
  const { data, error } = await supabase
    .from('news_mentions')
    .select('id, article_title, mention_context, full_content')
    .is('sentiment', null);
  if (error) { console.error('news_mentions query error:', error.message); return; }
  console.log(`\n📰 news_mentions pendientes: ${data.length}`);
  let ok = 0, pend = 0;
  for (const m of data) {
    const text = m.mention_context || m.full_content || m.article_title || '';
    const ai = await analyzeSentiment(text);
    if (!ai) { pend++; continue; }
    const { error: upErr } = await supabase
      .from('news_mentions')
      .update({ sentiment: ai.sentiment, sentiment_score: Number(ai.score.toFixed(2)) })
      .eq('id', m.id);
    if (upErr) { console.warn('  update error:', upErr.message); pend++; }
    else ok++;
    await sleep(350);
  }
  console.log(`   ✅ analizadas: ${ok} | ⏳ pendientes: ${pend}`);
}

async function reprocessMentions() {
  const { data, error } = await supabase
    .from('mentions')
    .select('id, content, metadata');
  if (error) { console.error('mentions query error:', error.message); return; }
  const pending = (data || []).filter((m) => !m.metadata || m.metadata.sentiment == null);
  console.log(`\n💬 mentions pendientes: ${pending.length}`);
  let ok = 0, pend = 0;
  for (const m of pending) {
    const text = m.content || m.metadata?.video_title || '';
    const ai = await analyzeSentiment(text);
    if (!ai) { pend++; continue; }
    const metadata = {
      ...(m.metadata || {}),
      sentiment: ai.sentiment,
      sentiment_score: Math.round(ai.score * 100),
      sentiment_explanation: ai.explanation,
    };
    const { error: upErr } = await supabase.from('mentions').update({ metadata }).eq('id', m.id);
    if (upErr) { console.warn('  update error:', upErr.message); pend++; }
    else ok++;
    await sleep(350);
  }
  console.log(`   ✅ analizadas: ${ok} | ⏳ pendientes: ${pend}`);
}

(async () => {
  console.log('🔁 Reproceso de sentimiento pendiente con Groq real...');
  await reprocessNewsMentions();
  await reprocessMentions();
  console.log('\n✔ Listo.');
})();
