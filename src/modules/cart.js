// src/modules/chat.js — Módulo de Chat IA (sem MODAL)
'use strict';

// Estado do chat
let isOpen = false;
let chatSidebar = null;
let chatOverlay = null;

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

// ── Inicializar módulo ────────────────────────────────────────────────
export async function initChat() {
  console.log('💬 Inicializando módulo de Chat...');
  createChatElements();
  setupChatEvents();
  console.log('✅ Chat inicializado');
}

// ── Criar elementos do chat (sidebar) ────────────────────────────────
function createChatElements() {
  if (document.getElementById('chat-sidebar')) return;
  
  chatOverlay = document.createElement('div');
  chatOverlay.id = 'chat-sidebar-overlay';
  chatOverlay.className = 'cart-overlay';
  chatOverlay.style.display = 'none';
  
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
      <button id="close-chat-sidebar" class="h-icon-btn cart-close-btn">
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
      </div>
    </div>
  `;
  
  document.body.appendChild(chatOverlay);
  document.body.appendChild(chatSidebar);
}

// ── Configurar eventos ────────────────────────────────────────────────
function setupChatEvents() {
  const closeBtn = document.getElementById('close-chat-sidebar');
  const overlay = document.getElementById('chat-sidebar-overlay');
  const sendBtn = document.getElementById('chat-send-sidebar');
  const inputField = document.getElementById('chat-input-sidebar');
  
  if (closeBtn) closeBtn.addEventListener('click', () => closeChat());
  if (overlay) overlay.addEventListener('click', () => closeChat());
  
  if (sendBtn) sendBtn.addEventListener('click', () => sendUserMessage());
  if (inputField) inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendUserMessage();
  });
}

// ── Abrir chat ────────────────────────────────────────────────────────
export function openChat() {
  const sidebar = document.getElementById('chat-sidebar');
  const overlay = document.getElementById('chat-sidebar-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.add('active');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    isOpen = true;
    
    const inputField = document.getElementById('chat-input-sidebar');
    if (inputField) inputField.focus();
  }
}

// ── Fechar chat ───────────────────────────────────────────────────────
export function closeChat() {
  const sidebar = document.getElementById('chat-sidebar');
  const overlay = document.getElementById('chat-sidebar-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    isOpen = false;
  }
}

// ── Alternar chat ─────────────────────────────────────────────────────
export function toggleChat() {
  if (isOpen) closeChat();
  else openChat();
}

// ── Enviar mensagem (exportada) ───────────────────────────────────────
export async function sendMessage(message) {
  if (!message) return;
  return getFallbackResponse(message);
}

// ── Enviar mensagem do usuário ────────────────────────────────────────
async function sendUserMessage() {
  const inputField = document.getElementById('chat-input-sidebar');
  const message = inputField?.value.trim();
  
  if (!message) return;
  
  inputField.value = '';
  addMessageToUI('user', message);
  showTypingIndicator();
  
  setTimeout(() => {
    removeTypingIndicator();
    const response = getFallbackResponse(message);
    addMessageToUI('assistant', response);
  }, 500);
}

// ── Respostas fallback ────────────────────────────────────────────────
function getFallbackResponse(message) {
  const lowerMsg = message.toLowerCase();
  
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
    return "🎧 Fones Bluetooth a partir de R$ 89. Temos JBL, Samsung, Apple AirPods e Xiaomi.";
  }
  if (lowerMsg.includes('preço') || lowerMsg.includes('quanto custa')) {
    return "💰 Nossos preços são os mais competitivos! Parcelamos em até 12x sem juros. Tem interesse em algum produto específico?";
  }
  if (lowerMsg.includes('entrega') || lowerMsg.includes('frete')) {
    return "🚚 Entregamos para todo Brasil! Prazo médio de 3-7 dias úteis. Frete grátis nas compras acima de R$ 299!";
  }
  if (lowerMsg.includes('garantia')) {
    return "🔒 Todos os produtos têm 12 meses de garantia contra defeitos de fabricação.";
  }
  if (lowerMsg.includes('pagamento') || lowerMsg.includes('parcel')) {
    return "💳 Aceitamos cartões, PIX com 5% OFF, boleto e débito. Parcelamos em até 12x sem juros!";
  }
  if (lowerMsg.includes('olá') || lowerMsg.includes('oi') || lowerMsg.includes('bom dia')) {
    return "👋 Olá! Seja bem-vindo à DOM Eletrônicos! Como posso ajudá-lo hoje?";
  }
  
  return "😊 Posso ajudar com produtos, preços, entregas, pagamentos ou garantias. Sobre o que você gostaria de saber?";
}

// ── Adicionar mensagem à UI ───────────────────────────────────────────
function addMessageToUI(role, content) {
  const container = document.getElementById('chat-messages-sidebar');
  if (!container) return;
  
  const welcome = container.querySelector('.chat-welcome');
  if (welcome && container.children.length === 1) welcome.remove();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message chat-message-${role}`;
  messageDiv.style.cssText = `margin-bottom: 16px; display: flex; gap: 12px;`;
  
  const avatar = role === 'user' 
    ? '<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center;"><i class="fas fa-user" style="color: white; font-size: 14px;"></i></div>'
    : '<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;"><i class="fas fa-robot" style="color: white; font-size: 14px;"></i></div>';
  
  const bubbleStyle = role === 'user'
    ? 'background: var(--primary); color: white; margin-left: auto;'
    : 'background: var(--bg-secondary); color: var(--text);';
  
  messageDiv.innerHTML = `
    ${avatar}
    <div style="flex: 1; ${bubbleStyle} padding: 12px 16px; border-radius: 12px; max-width: 80%;">
      ${escapeHtml(content)}
      <div style="font-size: 10px; opacity: 0.7; margin-top: 8px;">${new Date().toLocaleTimeString()}</div>
    </div>
  `;
  
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages-sidebar');
  if (!container) return;
  
  const typing = document.createElement('div');
  typing.id = 'chat-typing';
  typing.innerHTML = `
    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
        <i class="fas fa-robot" style="color: white; font-size: 14px;"></i>
      </div>
      <div style="background: var(--bg-secondary); padding: 12px 16px; border-radius: 12px;">
        <div style="display: flex; gap: 4px;">
          <span style="animation: typing 1.4s infinite;">.</span>
          <span style="animation: typing 1.4s infinite 0.2s;">.</span>
          <span style="animation: typing 1.4s infinite 0.4s;">.</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const typing = document.getElementById('chat-typing');
  if (typing) typing.remove();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Adicionar estilos
const style = document.createElement('style');
style.textContent = `
  @keyframes typing {
    0%, 60%, 100% { opacity: 0.4; }
    30% { opacity: 1; }
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
    z-index: 998;
    display: none;
  }
`;
document.head.appendChild(style);