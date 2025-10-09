export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model, max_tokens } = req.body;

    // Extraire le contenu du message utilisateur
    const userMessage = messages && messages[0] ? messages[0].content : '';

    // Appel à l'API Mistral
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: max_tokens || 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mistral API Error:', errorData);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status}`,
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Convertir la réponse Mistral au format Claude pour compatibilité
    const claudeFormatResponse = {
      content: [
        {
          type: 'text',
          text: data.choices && data.choices[0] ? data.choices[0].message.content : ''
        }
      ],
      model: data.model,
      usage: data.usage
    };

    return res.status(200).json(claudeFormatResponse);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
