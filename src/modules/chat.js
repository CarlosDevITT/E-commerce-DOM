// src/modules/chat.js — Módulo de Chat IA (sem MODAL, usando sidebar)
'use strict';

// Estado do chat
let isOpen = false;
let chatSidebar = null;
let chatOverlay = null;

// Configuração do assistente IA
const API_CONFIG = {
  url: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  apiKey: '' // Deixe vazio por enquanto
};

// Mensagens do chat
let messages = [
  {
    role: 'system',
    content: `Você é um assistente de vendas da DOM Eletrônicos. 
    Responda de forma educada, simpática e profissional. 
    Ofereça ajuda com produtos, preços, garantias, entregas e políticas da loja. 
    Seja breve e objetivo.`
  }
];

// Elementos DOM
let chatWidget = null;
let chatMessages = null;
let chatInput = null;
let chatSendBtn = null;

// ── Inicializar módulo ────────────────────────────────────────────────
export async function initChat() {
  console.log('💬 Inicializando módulo de Chat (sem modal)...');
  
  // Criar elementos do chat se não existirem
  createChatElements();
  
  // Configurar eventos
  setupChatEvents();
  
  console.log('✅ Chat inicializado com sucesso');
}

// ── Criar elementos do chat (sidebar) ────────────────────────────────
function createChatElements() {
  // Verificar se já existe
  if (document.getElementById('chat-sidebar')) return;
  
  // Criar overlay
  chatOverlay = document.createElement('div');
  chatOverlay.id = 'chat-sidebar-overlay';
  chatOverlay.className = 'cart-overlay';
  chatOverlay.style.display = 'none';
  
  // Criar sidebar do chat
  chatSidebar = document.createElement('aside');
  chatSidebar.id = 'chat-sidebar';
  chatSidebar.className = 'ecom-cart-sidebar';
  chatSidebar.style.width = '400px';
  chatSidebar.innerHTML = `
    <div class="ecom-cart-head">
      <div class="ecom-cart-head-left">
        <div class="ecom-cart-logo-wrap">
          <i class="fas fa-robot"></i>
        </div>
        <div>
          <p class="ecom-cart-head-label">Assistente IA</p>
          <p class="ecom-cart-head-store">DOM Eletrônicos</p>
        </div>
      </div>
      <button id="close-chat-sidebar" class="h-icon-btn cart-close-btn" aria-label="Fechar chat">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="ecom-cart-body" style="padding: 16px; display: flex; flex-direction: column; height: calc(100% - 80px);">
      <div id="chat-messages-sidebar" class="chat-messages-container" style="flex: 1; overflow-y: auto; margin-bottom: 16px; padding: 8px;">
        <div class="chat-welcome" style="text-align: center; padding: 40px 20px;">
          <i class="fas fa-comment-dots" style="font-size: 48px; color: var(--primary); margin-bottom: 16px; display: block;"></i>
          <h3>Olá! Como posso ajudar?</h3>
          <p style="color: var(--text-secondary); margin-top: 8px;">Pergunte sobre produtos, preços ou prazos de entrega.</p>
        </div>
      </div>
      
      <div class="chat-footer-sidebar" style="border-top: 1px solid var(--border); padding-top: 16px;">
        <div style="display: flex; gap: 8px;">
          <input type="text" id="chat-input-sidebar" placeholder="Digite sua pergunta..." 
            style="flex: 1; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-secondary); color: var(--text);">
          <button id="chat-send-sidebar" class="btn-primary" style="padding: 0 20px;">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 12px; text-align: center;">
          <i class="fas fa-microphone"></i> Chat IA - Respostas automáticas
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(chatOverlay);
  document.body.appendChild(chatSidebar);
}

// ── Configurar eventos ────────────────────────────────────────────────
function setupChatEvents() {
  chatSidebar = document.getElementById('chat-sidebar');
  chatOverlay = document.getElementById('chat-sidebar-overlay');
  const closeBtn = document.getElementById('close-chat-sidebar');
  const sendBtn = document.getElementById('chat-send-sidebar');
  const inputField = document.getElementById('chat-input-sidebar');
  
  // Fechar chat
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeChat());
  }
  
  if (chatOverlay) {
    chatOverlay.addEventListener('click', () => closeChat());
  }
  
  // Enviar mensagem
  if (sendBtn) {
    sendBtn.addEventListener('click', () => sendUserMessage());
  }
  
  if (inputField) {
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendUserMessage();
    });
  }
}

// ── Abrir chat (sidebar) ─────────────────────────────────────────────
export function openChat() {
  if (!chatSidebar || !chatOverlay) {
    createChatElements();
    setupChatEvents();
  }
  
  chatSidebar = document.getElementById('chat-sidebar');
  chatOverlay = document.getElementById('chat-sidebar-overlay');
  
  if (chatSidebar && chatOverlay) {
    chatSidebar.classList.add('active');
    chatOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    isOpen = true;
    
    // Focar no input
    const inputField = document.getElementById('chat-input-sidebar');
    if (inputField) inputField.focus();
  }
}

// ── Fechar chat (sidebar) ────────────────────────────────────────────
export function closeChat() {
  if (chatSidebar && chatOverlay) {
    chatSidebar.classList.remove('active');
    chatOverlay.style.display = 'none';
    document.body.style.overflow = '';
    isOpen = false;
  }
}

// ── Toggle chat ──────────────────────────────────────────────────────
export function toggleChat() {
  if (isOpen) {
    closeChat();
  } else {
    openChat();
  }
}

// ── Enviar mensagem do usuário ───────────────────────────────────────
async function sendUserMessage() {
  const inputField = document.getElementById('chat-input-sidebar');
  const message = inputField?.value.trim();
  
  if (!message) return;
  
  // Limpar input
  inputField.value = '';
  
  // Adicionar mensagem do usuário na UI
  addMessageToUI('user', message);
  
  // Mostrar indicador de digitação
  showTypingIndicator();
  
  try {
    // Processar mensagem com IA
    const response = await processWithAI(message);
    
    // Remover indicador de digitação
    removeTypingIndicator();
    
    // Adicionar resposta da IA
    addMessageToUI('assistant', response);
    
  } catch (error) {
    console.error('Erro no chat:', error);
    removeTypingIndicator();
    
    // Fallback: respostas pré-definidas
    const fallbackResponse = getFallbackResponse(message);
    addMessageToUI('assistant', fallbackResponse);
  }
}

// ── Processar com IA (API real ou simulação) ─────────────────────────
async function processWithAI(message) {
  // Adicionar mensagem ao histórico
  messages.push({ role: 'user', content: message });
  
  // Se tiver API key configurada, usar OpenAI
  if (API_CONFIG.apiKey) {
    try {
      const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: API_CONFIG.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 300
        })
      });
      
      const data = await response.json();
      const reply = data.choices[0].message.content;
      messages.push({ role: 'assistant', content: reply });
      return reply;
      
    } catch (error) {
      console.warn('API OpenAI falhou, usando fallback local');
      return getFallbackResponse(message);
    }
  }
  
  // Fallback: respostas locais inteligentes
  return getFallbackResponse(message);
}

// ── Respostas fallback (simulação de IA) ─────────────────────────────
function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();
  
  // Produtos
  if (lowerMsg.includes('notebook') || lowerMsg.includes('laptop')) {
    return "💻 Temos notebooks da Dell, Lenovo e Apple. Os preços variam de R$ 2.499 a R$ 12.999. Qual seu orçamento?";
  }
  
  if (lowerMsg.includes('smartphone') || lowerMsg.includes('celular')) {
    return "📱 Nossos smartphones mais vendidos: iPhone 15 (R$ 5.499), Samsung S24 (R$ 4.299) e Xiaomi 13 (R$ 2.999). Todos com 12x sem juros!";
  }
  
  if (lowerMsg.includes('tablet')) {
    return "📲 Temos iPad (R$ 3.699), Samsung Tab (R$ 2.199) e Multilaser (R$ 899). Frete grátis para todos!";
  }
  
  if (lowerMsg.includes('fone') || lowerMsg.includes('headphone')) {
    return "🎧 Fones Bluetooth a partir de R$ 89. Temos JBL, Samsung, Apple AirPods e Xiaomi. Qual tipo você prefere?";
  }
  
  // Preços
  if (lowerMsg.includes('preço') || lowerMsg.includes('quanto custa')) {
    return "💰 Nossos preços são os mais competitivos do mercado! Parcelamos em até 12x sem juros no cartão. Tem interesse em algum produto específico?";
  }
  
  // Entrega
  if (lowerMsg.includes('entrega') || lowerMsg.includes('frete')) {
    return "🚚 Entregamos para todo Brasil! Prazo médio de 3-7 dias úteis. Frete grátis nas compras acima de R$ 299!";
  }
  
  // Garantia
  if (lowerMsg.includes('garantia')) {
    return "🔒 Todos os produtos têm 12 meses de garantia contra defeitos de fabricação. Atendimento rápido e eficiente!";
  }
  
  // Pagamento
  if (lowerMsg.includes('pagamento') || lowerMsg.includes('parcel')) {
    return "💳 Aceitamos cartões (Visa/MasterCard/Amex), PIX com 5% OFF, boleto e débito. Parcelamos em até 12x sem juros!";
  }
  
  // Saudação
  if (lowerMsg.includes('olá') || lowerMsg.includes('oi') || lowerMsg.includes('bom dia')) {
    return "👋 Olá! Seja bem-vindo à DOM Eletrônicos! Como posso ajudá-lo hoje? Temos ofertas incríveis!";
  }
  
  // Ajuda geral
  if (lowerMsg.includes('ajuda') || lowerMsg.includes('como funciona')) {
    return "🎯 Posso ajudar com: informações de produtos, preços, formas de pagamento, prazos de entrega, garantias e devoluções. Sobre o que você gostaria de saber?";
  }
  
  // Resposta padrão
  return "😊 Obrigado por perguntar! Infelizmente não entendi completamente. Pode reformular? Posso ajudar com produtos, preços, entregas, pagamentos ou garantias.";
}

// ── Adicionar mensagem à UI ─────────────────────────────────────────
function addMessageToUI(role, content) {
  const messagesContainer = document.getElementById('chat-messages-sidebar');
  if (!messagesContainer) return;
  
  // Remover welcome message se existir
  const welcomeMsg = messagesContainer.querySelector('.chat-welcome');
  if (welcomeMsg && messagesContainer.children.length === 1) {
    welcomeMsg.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message chat-message-${role}`;
  messageDiv.style.cssText = `
    margin-bottom: 16px;
    display: flex;
    gap: 12px;
    animation: fadeIn 0.3s ease;
  `;
  
  const avatar = role === 'user' 
    ? '<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center;"><i class="fas fa-user" style="color: white; font-size: 14px;"></i></div>'
    : '<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;"><i class="fas fa-robot" style="color: white; font-size: 14px;"></i></div>';
  
  const bubbleStyle = role === 'user'
    ? 'background: var(--primary); color: white; margin-left: auto;'
    : 'background: var(--bg-secondary); color: var(--text);';
  
  messageDiv.innerHTML = `
    ${avatar}
    <div style="flex: 1; ${bubbleStyle} padding: 12px 16px; border-radius: 12px; max-width: 80%; word-wrap: break-word;">
      ${escapeHtml(content)}
      <div style="font-size: 10px; opacity: 0.7; margin-top: 8px;">
        ${new Date().toLocaleTimeString()}
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ── Mostrar indicador de digitação ───────────────────────────────────
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages-sidebar');
  if (!messagesContainer) return;
  
  const typingDiv = document.createElement('div');
  typingDiv.id = 'chat-typing-indicator';
  typingDiv.className = 'chat-message chat-message-assistant';
  typingDiv.style.cssText = `
    margin-bottom: 16px;
    display: flex;
    gap: 12px;
    animation: fadeIn 0.3s ease;
  `;
  
  typingDiv.innerHTML = `
    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
      <i class="fas fa-robot" style="color: white; font-size: 14px;"></i>
    </div>
    <div style="background: var(--bg-secondary); padding: 12px 16px; border-radius: 12px;">
      <div style="display: flex; gap: 4px;">
        <span style="width: 8px; height: 8px; background: #666; border-radius: 50%; animation: typing 1.4s infinite;">.</span>
        <span style="width: 8px; height: 8px; background: #666; border-radius: 50%; animation: typing 1.4s infinite 0.2s;">.</span>
        <span style="width: 8px; height: 8px; background: #666; border-radius: 50%; animation: typing 1.4s infinite 0.4s;">.</span>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ── Remover indicador de digitação ───────────────────────────────────
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('chat-typing-indicator');
  if (typingIndicator) typingIndicator.remove();
}

// ── Utilitário: Escape HTML ──────────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Estilos CSS para animações ───────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }
  
  #chat-sidebar {
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  #chat-sidebar.active {
    transform: translateX(0);
  }
  
  #chat-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    display: none;
  }
  
  .chat-messages-container {
    scroll-behavior: smooth;
  }
  
  .chat-messages-container::-webkit-scrollbar {
    width: 6px;
  }
  
  .chat-messages-container::-webkit-scrollbar-track {
    background: var(--border);
    border-radius: 3px;
  }
  
  .chat-messages-container::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 3px;
  }
`;

document.head.appendChild(style);