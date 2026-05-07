// src/modules/chat.js
import { createClient } from '@supabase/supabase-js';
import { AI_API_URL, AI_API_KEY } from '../config/ai_config.js';

// ============================================
// CONFIGURAÇÃO SUPABASE
// ============================================
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;
let knowledgeBase = [];
let chatHistory = [];

// Inicializar cliente Supabase
async function initSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    await loadKnowledgeBase();
  }
}

// ============================================
// CARREGAR BASE DE CONHECIMENTO DO SUPABASE
// ============================================
async function loadKnowledgeBase() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('knowledge_base')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    knowledgeBase = data || [];
    console.log(`✅ Base de conhecimento carregada: ${knowledgeBase.length} artigos`);
  } catch (error) {
    console.error('❌ Erro ao carregar base de conhecimento:', error);
  }
}

// ============================================
// SALVAR CONVERSA NO SUPABASE
// ============================================
async function saveChatMessage(userMessage, aiResponse, metadata = {}) {
  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('chat_conversations')
      .insert([
        {
          user_message: userMessage,
          ai_response: aiResponse,
          session_id: getSessionId(),
          metadata: metadata,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
  }
}

// Gerar ID de sessão
function getSessionId() {
  let sessionId = localStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
}

// ============================================
// BUSCAR RESPOSTA COM IA (Anthropic ou Custom)
// ============================================
async function getAIResponseWithKnowledge(userMsg) {
  try {
    // 1. Buscar artigos relevantes da base de conhecimento
    const relevantArticles = findRelevantArticles(userMsg);

    // 2. Construir contexto
    const context = relevantArticles
      .slice(0, 3) // Top 3 artigos
      .map(article => `📌 ${article.title}: ${article.content}`)
      .join('\n\n');

    const systemPrompt = `Você é um assistente de chat amigável e profissional para uma loja online.
Você tem acesso a uma base de conhecimento sobre produtos e políticas.

BASE DE CONHECIMENTO:
${context || 'Nenhum artigo relevante encontrado.'}

INSTRUÇÕES:
- Responda em português de forma amigável e natural
- Use emojis apropriados para tornar a conversa mais atraente
- Baseie suas respostas na base de conhecimento quando possível
- Se não souber, sugira contato com suporte
- Seja conciso e direto (máx 2-3 linhas)`;

    // 3. Chamar IA (Anthropic Claude)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          ...chatHistory.slice(-5).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: 'user', content: userMsg }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Erro da API: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    // 4. Salvar conversa
    await saveChatMessage(userMsg, aiResponse, {
      relevant_articles: relevantArticles.slice(0, 3).map(a => a.id)
    });

    return aiResponse;
  } catch (error) {
    console.error('❌ Erro ao obter resposta IA:', error);
    return '❌ Desculpe, estou com dificuldades. Tente novamente ou contate nosso suporte.';
  }
}

// ============================================
// BUSCAR ARTIGOS RELEVANTES (Similaridade simples)
// ============================================
function findRelevantArticles(userMsg) {
  const userWords = userMsg.toLowerCase().split(/\s+/);

  return knowledgeBase
    .map(article => ({
      ...article,
      relevance: calculateRelevance(userWords, article)
    }))
    .filter(a => a.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
}

function calculateRelevance(userWords, article) {
  const text = `${article.title} ${article.content} ${article.category}`.toLowerCase();
  const matches = userWords.filter(word => word.length > 2 && text.includes(word)).length;
  return matches;
}

// ============================================
// INTERFACE DO CHAT WIDGET
// ============================================
let isChatOpen = false;

export async function initChatWidget() {
  // Inicializar Supabase
  await initSupabase();

  const chatWidget = document.getElementById('chat-widget');

  if (isChatOpen && !chatWidget.classList.contains('hidden')) {
    chatWidget.classList.add('hidden');
    isChatOpen = false;
    return;
  }

  chatWidget.innerHTML = `
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-header-content">
          <h3>🤖 Assistente de Chat</h3>
          <p class="chat-status">Online</p>
        </div>
        <button id="close-chat" class="close-btn">✕</button>
      </div>
      
      <div class="chat-messages" id="chat-messages">
        <div class="chat-message ai-message">
          <span class="avatar ai-avatar">🤖</span>
          <div class="message-content">
            <div class="message-bubble ai-bubble">
              Olá! 👋 Bem-vindo! Como posso ajudá-lo com seus produtos?
            </div>
            <span class="message-time">Agora</span>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <form id="chat-form" class="chat-form">
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Digite sua pergunta..." 
            autocomplete="off" 
            maxlength="500"
            required 
          />
          <button type="submit" class="send-btn" title="Enviar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <div class="chat-powered-by">
          Powered by IA + Supabase
        </div>
      </div>
    </div>
  `;

  chatWidget.classList.remove('hidden');
  isChatOpen = true;

  // Event listeners
  const closeBtn = document.getElementById('close-chat');
  closeBtn.onclick = () => {
    chatWidget.classList.add('hidden');
    isChatOpen = false;
  };

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    // Adicionar mensagem do usuário
    addMessage('user', msg);
    chatHistory.push({ sender: 'user', text: msg });

    input.value = '';
    input.focus();

    // Mostrar indicador de digitação
    addMessage('ai', '⏳ Pensando...', true);

    // Obter resposta IA
    const response = await getAIResponseWithKnowledge(msg);

    // Remover indicador e adicionar resposta
    removeLastMessage();
    addMessage('ai', response);
    chatHistory.push({ sender: 'ai', text: response });
  };
}

// ============================================
// UTILITÁRIOS DE MENSAGEM
// ============================================
function addMessage(sender, text, isLoading = false) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  const div = document.createElement('div');
  div.className = `chat-message ${sender === 'ai' ? 'ai-message' : 'user-message'}`;

  if (sender === 'ai') {
    div.innerHTML = `
      <span class="avatar ai-avatar">🤖</span>
      <div class="message-content">
        <div class="message-bubble ai-bubble ${isLoading ? 'loading' : ''}">
          ${isLoading ? '<span class="typing-indicator"><span></span><span></span><span></span></span>' : escapeHtml(text)}
        </div>
        <span class="message-time">${getTimeString()}</span>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="message-content">
        <div class="message-bubble user-bubble">
          ${escapeHtml(text)}
        </div>
        <span class="message-time">${getTimeString()}</span>
      </div>
      <span class="avatar user-avatar">👤</span>
    `;
  }

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeLastMessage() {
  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer && messagesContainer.lastChild) {
    messagesContainer.removeChild(messagesContainer.lastChild);
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeString() {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// EXPORTAR FUNÇÕES
// ============================================
export {
  loadKnowledgeBase,
  saveChatMessage,
  getAIResponseWithKnowledge,
  initSupabase
};