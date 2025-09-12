import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/v2/secrets';
import fetch from 'node-fetch';

// The secret name must match the name you set in the Firebase CLI
const geminiKey = defineSecret('GEMINI_KEY');

exports.generateText = onRequest(
  { secrets: [geminiKey] },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const apiKey = geminiKey.value();
      if (!apiKey) {
        throw new Error('API key is not configured.');
      }

      const { prompt } = req.body;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      const apiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!apiResponse.ok) {
        const errorDetails = await apiResponse.text();
        throw new Error(`API error: ${apiResponse.status} - ${errorDetails}`);
      }

      const data = await apiResponse.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhum texto gerado.';
      res.status(200).json({ text: generatedText });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);