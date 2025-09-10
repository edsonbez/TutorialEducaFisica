const functions = require('firebase-functions');
const fetch = require('node-fetch');

// The `apiProxy` function handles incoming HTTP requests.
exports.apiProxy = functions.https.onRequest(async (req, res) => {
    // Set CORS headers to allow requests from any origin.
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests.
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // Only allow POST requests.
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // Get the API key from Firebase environment configuration.
    const API_KEY = functions.config().gemini.key;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + API_KEY;

    try {
        // Extract the prompt from the request body.
        const { prompt } = req.body;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        // Make the request to the Gemini API.
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        // Send the generated text back to the client.
        res.status(200).json({ text: textResponse });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});
