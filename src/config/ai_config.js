// src/config/ai_config.js - Configuração da API de IA

export const AI_PROVIDER = 'openai';
export const AI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const AI_API_KEY = '';
export const AI_MODEL = 'gpt-3.5-turbo';

export const aiConfig = {
  provider: AI_PROVIDER,
  url: AI_API_URL,
  key: AI_API_KEY,
  model: AI_MODEL,
  maxTokens: 150,
  temperature: 0.7
};

export async function callAIAPI(message) {
  if (!AI_API_KEY || AI_API_KEY === '') {
    console.warn('⚠ API Key de IA não configurada');
    return null;
  }

  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: message }],
        max_tokens: aiConfig.maxTokens,
        temperature: aiConfig.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Erro ao chamar IA:', error);
    return null;
  }
}
