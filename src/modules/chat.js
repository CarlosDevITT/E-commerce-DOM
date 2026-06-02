// Dependências: Supabase Client configurado globalmente ou passado no init
'use strict';

let isOpen = false;
let chatSidebar = null;
let chatOverlay = null;

const chatModule = {
  conversationHistory: [],
  supabaseClient: null,
  userType: 'cliente',
  API_CONFIG: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    textModel: 'gemini-1.5-flash',
    embeddingModel: 'text-embedding-004',
    apiKey: ''
  },

  async init(supabaseClient, userType = 'cliente') {
    this.supabaseClient = supabaseClient || window.supabaseManager?.client;
    this.userType = userType;
    
    this.API_CONFIG.apiKey = window.GOOGLE_API_KEY || '';
    
    if (!this.API_CONFIG.apiKey) {
      console.warn('⚠️ Google API Key não encontrada em window.GOOGLE_API_KEY. O chat operará em modo de contingência (Fallback).');
    }

    this.createChatElements();
    this.setupChatEvents();
    console.log('✅ Chat RAG Nativo com UI Premium Inicializado.');
  },

  async buscarContextoRAG(mensagem) {
    if (!this.supabaseClient || !this.API_CONFIG.apiKey) return [];

    try {
      const embeddingUrl = `${this.API_CONFIG.baseUrl}/${this.API_CONFIG.embeddingModel}:embedContent?key=${this.API_CONFIG.apiKey}`;
      const embeddingResponse = await fetch(embeddingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${this.API_CONFIG.embeddingModel}`,
          content: { parts: [{ text: message }] }
        })
      });

      if (!embeddingResponse.ok) throw new Error('Falha ao gerar embedding.');
      
      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.embedding.values;

      const { data: documentos, error } = await this.supabaseClient.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: 0.4,
        match_count: 3
      });

      if (error) throw error;
      return documentos || [];

    } catch (error) {
      console.error('❌ Erro na busca RAG:', error);
      return [];
    }
  },

  construirPromptCliente(mensagem, contexto) {
    const contextString = contexto.length > 0
      ? contexto.map(c => `- [Artigo: ${c.titulo}]: ${c.conteudo}`).join('\n')
      : 'Nenhuma informação específica encontrada.';

    return `Você é um assistente premium da DOM.\nREGRAS: Escreva no máximo 120 palavras. Seja elegante, prestativo e direto.\nCONTEXTO: ${contextString}\nHISTÓRICO:\n${this.construirHistorico()}\nMENSAGEM: ${mensagem}`;
  },

  construirPromptFuncionario(mensagem, contexto) {
    const contextString = contexto.length > 0
      ? contexto.map(c => `- [KB ID ${c.id} - ${c.titulo}]: ${c.conteudo}`).join('\n')
      : 'Nenhum procedimento técnico encontrado.';

    return `Você é o suporte interno especializado DOM.\nREGRAS: Máximo de 150 palavras. Estruturado, técnico e direto.\nCONTEXTO: ${contextString}\nMENSAGEM: ${mensagem}`;
  },

  construirHistorico() {
    return this.conversationHistory
      .slice(-4)
      .map(msg => `${msg.tipo === 'user' ? 'Usuário' : 'Assistente'}: ${msg.conteudo}`)
      .join('\n');
  },

  async enviarMensagem(mensagem) {
    if (!mensagem.trim()) return null;

    this.conversationHistory.push({
      tipo: 'user',
      conteudo: mensagem,
      timestamp: new Date()
    });

    this.showTypingIndicator();
    const contexto = await this.buscarContextoRAG(mensagem);
    
    const prompt = this.userType === 'cliente'
      ? this.construirPromptCliente(mensagem, contexto)
      : this.construirPromptFuncionario(mensagem, contexto);

    try {
      const resposta = await this.chamarGeminiAPI(prompt);
      this.removeTypingIndicator();

      this.conversationHistory.push({
        tipo: 'assistant',
        conteudo: resposta,
        timestamp: new Date(),
        fontes: contexto.map(c => c.id)
      });

      return { mensagem: resposta, tipo: this.userType, fontes: contexto };
    } catch (error) {
      this.removeTypingIndicator();
      const fallback = this.getFallbackResponse(mensagem);
      return { mensagem: fallback, tipo: 'fallback' };
    }
  },

  async chamarGeminiAPI(prompt) {
    if (!this.API_CONFIG.apiKey) return this.getFallbackResponse(prompt);

    const url = `${this.API_CONFIG.baseUrl}/${this.API_CONFIG.textModel}:generateContent?key=${this.API_CONFIG.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 350, temperature: 0.3 }
      })
    });

    if (!response.ok) throw new Error('Erro API Gemini');
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Como posso ajudar você?';
  },

  getFallbackResponse(mensagem) {
    const msg = mensagem.toLowerCase();
    if (msg.includes('entrega') || msg.includes('frete')) return '🚚 Entregamos em todo o Brasil. Frete grátis acima de R$ 299!';
    return '👋 Olá! Sou o especialista em IA da DOM. Como posso otimizar seu dia hoje?';
  },

  createChatElements() {
    if (document.getElementById('chat-sidebar')) return;

    chatOverlay = document.createElement('div');
    chatOverlay.id = 'chat-sidebar-overlay';
    chatOverlay.className = 'premium-chat-overlay';

    chatSidebar = document.createElement('aside');
    chatSidebar.id = 'chat-sidebar';
    chatSidebar.className = 'premium-chat-sidebar';

    chatSidebar.innerHTML = `
      <div class="chat-sidebar-header">
          <div class="header-main-info">
              <div class="status-indicator-container">
                 <div class="bot-avatar-icon"><i class="fas fa-robot"></i></div>
                 <span class="active-pulse-dot"></span>
              </div>
              <div>
                  <h2>${this.userType === 'cliente' ? 'Assistente Virtual DOM' : 'DOM Tech Suporte'}</h2>
                  <p>Online · Responde instantaneamente</p>
              </div>
          </div>
          <button id="close-chat-sidebar" class="close-sidebar-action-btn" aria-label="Fechar">&times;</button>
      </div>

      <div id="chat-messages-sidebar" class="chat-messages-scroll-area">
          <div class="chat-welcome-state">
              <div class="welcome-badge-icon">✨</div>
              <h3>Olá! Como posso ajudar?</h3>
              <p>Pergunte sobre produtos, especificações técnicas, prazos de envio ou suporte da nossa loja.</p>
          </div>
      </div>

      <div class="chat-sidebar-footer-input-area">
          <div class="input-wrapper-row">
              <input id="chat-input-sidebar" type="text" placeholder="Envie sua mensagem para a IA...">
              <button id="chat-send-sidebar" class="send-action-arrow-btn">
                  <i class="fas fa-paper-plane"></i>
              </button>
          </div>
          <p class="footer-platform-attribution"><i class="fas fa-shield-halved"></i> IA Homologada · Conexão Segura SSL</p>
      </div>
    `;

    document.body.appendChild(chatOverlay);
    document.body.appendChild(chatSidebar);
    this.injectStyles();
  },

  setupChatEvents() {
    const closeBtn = document.getElementById('close-chat-sidebar');
    const sendBtn = document.getElementById('chat-send-sidebar');
    const input = document.getElementById('chat-input-sidebar');
    const overlay = document.getElementById('chat-sidebar-overlay');

    closeBtn?.addEventListener('click', () => this.closeChat());
    overlay?.addEventListener('click', () => this.closeChat());
    sendBtn?.addEventListener('click', () => this.handleSendMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSendMessage();
    });
  },

  async handleSendMessage() {
    const input = document.getElementById('chat-input-sidebar');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    this.addMessageToUI('user', message);

    const resultado = await this.enviarMensagem(message);
    if (resultado) {
      this.addMessageToUI('assistant', resultado.mensagem, resultado.fontes);
    }
  },

  addMessageToUI(role, content, fontes = []) {
    const container = document.getElementById('chat-messages-sidebar');
    if (!container) return;

    const welcome = container.querySelector('.chat-welcome-state');
    if (welcome) welcome.remove();

    const msgRow = document.createElement('div');
    msgRow.className = `chat-message-row-container ${role === 'user' ? 'user-align' : 'assistant-align'}`;

    let fontesHtml = '';
    if (fontes && fontes.length > 0) {
      fontesHtml = `<div class="rag-source-reference-label"><i class="fas fa-bookmark"></i> Fonte: ${fontes.map(f => f.titulo).join(', ')}</div>`;
    }

    msgRow.innerHTML = `
      <div class="chat-message-bubble-box ${role === 'user' ? 'bubble-premium-user' : 'bubble-premium-bot'}">
        <p class="bubble-text-content">${this.escapeHtml(content)}</p>
        ${fontesHtml}
      </div>
    `;

    container.appendChild(msgRow);
    container.scrollTop = container.scrollHeight;
  },

  showTypingIndicator() {
    const container = document.getElementById('chat-messages-sidebar');
    if (!container) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'chat-typing-indicator';
    typingDiv.className = 'chat-message-row-container assistant-align';
    typingDiv.innerHTML = `
      <div class="chat-message-bubble-box bubble-premium-bot typing-flex">
        <span class="typing-dot"></span>
        <span class="typing-dot" style="animation-delay: 0.2s"></span>
        <span class="typing-dot" style="animation-delay: 0.4s"></span>
      </div>
    `;
    container.appendChild(typingDiv);
    container.scrollTop = container.scrollHeight;
  },

  removeTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) indicator.remove();
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  openChat() {
    const sidebar = document.getElementById('chat-sidebar');
    const overlay = document.getElementById('chat-sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.add('sidebar-visible');
      overlay.classList.add('overlay-visible');
      document.body.style.overflow = 'hidden';
      isOpen = true;
      document.getElementById('chat-input-sidebar')?.focus();
    }
  },

  closeChat() {
    const sidebar = document.getElementById('chat-sidebar');
    const overlay = document.getElementById('chat-sidebar-overlay');
    if (sidebar && overlay) {
      sidebar.classList.remove('sidebar-visible');
      overlay.classList.remove('overlay-visible');
      document.body.style.overflow = '';
      isOpen = false;
    }
  },

  toggleChat() {
    isOpen ? this.closeChat() : this.openChat();
  },

  injectStyles() {
    if (document.getElementById('chat-premium-styles')) return;
    const style = document.createElement('style');
    style.id = 'chat-premium-styles';
    style.textContent = `
      :root {
        --dom-primary: #2563eb;
        --dom-dark-bg: #0f172a;
        --dom-light-gray: #f8fafc;
        --dom-text-main: #334155;
        --dom-radius: 12px;
      }
      
      .premium-chat-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
        z-index: 9999; display: none; opacity: 0; transition: opacity 0.3s ease;
      }
      .premium-chat-overlay.overlay-visible { display: block; opacity: 1; }

      .premium-chat-sidebar {
        position: fixed; right: 0; top: 0; width: 100%; max-width: 440px; height: 100%;
        background: #ffffff; box-shadow: -8px 0 32px rgba(15, 23, 42, 0.08);
        z-index: 10000; display: flex; flex-direction: column;
        transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Inter', system-ui, sans-serif;
      }
      .premium-chat-sidebar.sidebar-visible { transform: translateX(0); }

      .chat-sidebar-header {
        padding: 1.25rem 1.5rem; background: var(--dom-dark-bg); color: white;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .header-main-info { display: flex; align-items: center; gap: 1rem; }
      .status-indicator-container { position: relative; }
      .bot-avatar-icon {
        width: 42px; height: 42px; background: rgba(255,255,255,0.1); 
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem; border: 1px solid rgba(255,255,255,0.2);
      }
      .active-pulse-dot {
        position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px;
        background: #10b981; border-radius: 50%; border: 2px solid var(--dom-dark-bg);
      }
      .chat-sidebar-header h2 { margin: 0; font-size: 1.05rem; font-weight: 600; letter-spacing: -0.01em; }
      .chat-sidebar-header p { margin: 0.15rem 0 0; font-size: 0.78rem; opacity: 0.6; }
      
      .close-sidebar-action-btn {
        background: none; border: none; color: white; font-size: 1.75rem; 
        cursor: pointer; opacity: 0.7; transition: opacity 0.2s;
      }
      .close-sidebar-action-btn:hover { opacity: 1; }

      .chat-messages-scroll-area { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; background: var(--dom-light-gray); }
      .chat-welcome-state { text-align: center; padding: 3rem 1.5rem; margin: auto 0; color: #64748b; }
      .welcome-badge-icon { font-size: 2.5rem; margin-bottom: 1rem; }
      .chat-welcome-state h3 { margin: 0; font-size: 1.2rem; color: #1e293b; font-weight: 700; }
      .chat-welcome-state p { margin: 0.5rem 0 0; font-size: 0.9rem; line-height: 1.5; }

      .chat-message-row-container { display: flex; width: 100%; }
      .user-align { justify-content: flex-end; }
      .assistant-align { justify-content: flex-start; }

      .chat-message-bubble-box { max-width: 82%; padding: 0.85rem 1.1rem; border-radius: var(--dom-radius); line-height: 1.5; font-size: 0.92rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .bubble-premium-user { background: var(--dom-primary); color: white; border-bottom-right-radius: 2px; }
      .bubble-premium-bot { background: #ffffff; color: var(--dom-text-main); border-bottom-left-radius: 2px; border: 1px solid #e2e8f0; }
      .bubble-text-content { margin: 0; white-space: pre-wrap; }
      
      .rag-source-reference-label {
        margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9;
        font-size: 0.75rem; color: var(--dom-primary); font-weight: 500;
      }

      .chat-sidebar-footer-input-area { padding: 1.25rem; border-top: 1px solid #e2e8f0; background: #ffffff; }
      .input-wrapper-row {
        display: flex; gap: 0.5rem; background: var(--dom-light-gray); 
        padding: 0.4rem; border-radius: var(--dom-radius); border: 1px solid #e2e8f0;
        transition: border-color 0.2s;
      }
      .input-wrapper-row:focus-within { border-color: var(--dom-primary); }
      .input-wrapper-row input {
        flex: 1; padding: 0.6rem 0.75rem; border: none; background: transparent;
        color: #1e293b; font-size: 0.92rem; outline: none;
      }
      .send-action-arrow-btn {
        width: 38px; height: 38px; background: var(--dom-primary); color: white;
        border: none; border-radius: 10px; cursor: pointer; display: flex;
        align-items: center; justify-content: center; transition: background 0.2s;
      }
      .send-action-arrow-btn:hover { background: #1d4ed8; }
      .footer-platform-attribution { font-size: 0.72rem; color: #94a3b8; margin: 0.6rem 0 0; text-align: center; }

      .typing-flex { display: flex; gap: 4px; align-items: center; padding: 0.6rem 1rem; }
      .typing-dot { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: typingAnimation 1.4s infinite ease-in-out; }
      @keyframes typingAnimation { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

      .chat-messages-scroll-area::-webkit-scrollbar { width: 5px; }
      .chat-messages-scroll-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    `;
    document.head.appendChild(style);
  },

  async onPageLoad(userType = 'cliente') {
    await this.init(window.supabaseManager?.client, userType);
  }
};

window.chatModule = chatModule;

export function initChat() { return chatModule.onPageLoad('cliente'); }
export function initChatFuncionario() { return chatModule.onPageLoad('funcionario'); }
export function openChat() { return chatModule.openChat(); }
export function closeChat() { return chatModule.closeChat(); }
export function toggleChat() { return chatModule.toggleChat(); }