import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Server configuration is incomplete' }, 500);
  }
  const authorization = request.headers.get('Authorization');
  if (!authorization) return jsonResponse({ error: 'Authentication required' }, 401);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return jsonResponse({ error: 'Invalid authentication' }, 401);

  let body: { textHe?: unknown; voiceId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
  }
  if (typeof body.textHe !== 'string' || body.textHe.trim().length === 0 || body.textHe.length > 2000) {
    return jsonResponse({ error: 'textHe must contain between 1 and 2000 characters' }, 400);
  }
  if (body.voiceId !== undefined && (typeof body.voiceId !== 'string' || body.voiceId.length > 128)) {
    return jsonResponse({ error: 'voiceId must be a short string' }, 400);
  }

  const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  const voiceId = typeof body.voiceId === 'string'
    ? body.voiceId
    : Deno.env.get('ELEVENLABS_VOICE_ID');

  try {
    let response: Response;
    let mimeType = 'audio/mpeg';
    if (elevenLabsKey && voiceId) {
      response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenLabsKey,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text: body.textHe.trim(),
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );
    } else if (openAiApiKey) {
      mimeType = 'audio/mpeg';
      response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice: 'alloy',
          input: body.textHe.trim(),
          instructions: 'Speak clearly and naturally in Hebrew.',
          response_format: 'mp3',
        }),
      });
    } else {
      return jsonResponse({ error: 'No text-to-speech provider is configured' }, 503);
    }
    if (!response.ok) {
      console.error('TTS provider failed:', response.status, await response.text());
      return jsonResponse({ error: 'Could not generate audio' }, 502);
    }
    const audio = new Uint8Array(await response.arrayBuffer());
    if (audio.length === 0) return jsonResponse({ error: 'Audio provider returned empty audio' }, 502);
    return jsonResponse({ audioBase64: encodeBase64(audio), mimeType });
  } catch (error) {
    console.error('TTS generation failed:', error);
    return jsonResponse({ error: 'Could not generate audio' }, 502);
  }
});
