/*
  Esta é uma API de proxy que atua como uma ponte entre seu frontend (site)
  e a API do Gemini. Isso resolve problemas de CORS e autenticação,
  garantindo que sua chave de API permaneça segura.
*/

// A chave da API é definida aqui.
// Suba esse arquivo para sua hospedagem na web (ex: Vercel, Netlify).
const API_KEY = ""; // Insira sua chave da API do Gemini aqui

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  const { message } = await request.json();

  if (!message) {
    return new Response('Mensagem não fornecida', { status: 400 });
  }

  const payload = {
    contents: [{
      parts: [{ text: message }]
    }],
    systemInstruction: {
      parts: [{ text: "Você é um assistente de educação física amigável e informativo. Responda a perguntas sobre exercícios, nutrição, esportes e bem-estar, mantendo uma abordagem de incentivo e segurança." }]
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  const result = await response.json();

  const candidate = result.candidates?.[0];
  const responseText = candidate?.content?.parts?.[0]?.text || "Desculpe, não consegui obter uma resposta.";

  return new Response(JSON.stringify({ response: responseText }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Isso permite que o seu site acesse a API
    }
  });
}