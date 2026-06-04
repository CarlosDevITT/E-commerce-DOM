// src/modules/profile.js — Módulo de Perfil do Usuário (DOM Eletrônicos)
'use strict';

/* ─────────────────────────────────────────────────────
   ESTADO GLOBAL DO MÓDULO
───────────────────────────────────────────────────── */
let currentUser   = null;
let isAuthenticated = false;
let _activeSection  = null; // rastreia seção aberta para animação de volta

/* ─────────────────────────────────────────────────────
   1. INICIALIZAÇÃO
───────────────────────────────────────────────────── */
export async function initProfile() {
  injectStyles();
  loadUserFromStorage();
  createProfileElements();
  setupProfileEvents();
}

/* ─────────────────────────────────────────────────────
   2. STORAGE
───────────────────────────────────────────────────── */
function loadUserFromStorage() {
  try {
    const storage = window.safeStorage;
    const raw = storage.getItem('dom_user');
    if (raw) {
      currentUser     = JSON.parse(raw);
      isAuthenticated = true;
    }
  } catch {
    currentUser     = null;
    isAuthenticated = false;
  }
}

function saveUserToStorage() {
  try {
    const storage = window.safeStorage;
    if (currentUser) storage.setItem('dom_user', JSON.stringify(currentUser));
    else             storage.removeItem('dom_user');
  } catch { /* silencioso */ }
}

/* ─────────────────────────────────────────────────────
   3. CRIAÇÃO DO SIDEBAR
───────────────────────────────────────────────────── */
function createProfileElements() {
  if (document.getElementById('profile-sidebar')) return;

  /* Overlay */
  const overlay = document.createElement('div');
  overlay.id        = 'profile-sidebar-overlay';
  overlay.className = 'prof-overlay';

  /* Sidebar */
  const sidebar = document.createElement('aside');
  sidebar.id        = 'profile-sidebar';
  sidebar.className = 'prof-sidebar';
  sidebar.setAttribute('aria-label', 'Painel de Perfil');
  sidebar.innerHTML = `
    <div class="prof-head">
      <div class="prof-head-left">
        <div class="prof-head-icon">
          <i class="fas fa-user-circle"></i>
        </div>
        <div>
          <p class="prof-head-label">Minha Conta</p>
          <p class="prof-head-brand">DOM Eletrônicos</p>
        </div>
      </div>
      <button id="close-profile-sidebar" class="prof-close-btn" aria-label="Fechar perfil">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div id="profile-content" class="prof-body"></div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sidebar);
}

/* ─────────────────────────────────────────────────────
   4. EVENTOS GLOBAIS DO SIDEBAR
───────────────────────────────────────────────────── */
function setupProfileEvents() {
  document.getElementById('close-profile-sidebar')
    ?.addEventListener('click', closeProfile);
  document.getElementById('profile-sidebar-overlay')
    ?.addEventListener('click', closeProfile);

  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProfile();
  });
}

/* ─────────────────────────────────────────────────────
   5. ABRIR / FECHAR / TOGGLE
───────────────────────────────────────────────────── */
export function openProfile() {
  const sidebar = document.getElementById('profile-sidebar');
  const overlay = document.getElementById('profile-sidebar-overlay');
  if (!sidebar || !overlay) return;

  renderProfileContent();
  requestAnimationFrame(() => {
    overlay.classList.add('active');
    sidebar.classList.add('active');
  });
  document.body.style.overflow = 'hidden';
}

export function closeProfile() {
  const sidebar = document.getElementById('profile-sidebar');
  const overlay = document.getElementById('profile-sidebar-overlay');
  if (!sidebar || !overlay) return;

  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  _activeSection = null;
}

export function toggleProfile() {
  const sidebar = document.getElementById('profile-sidebar');
  sidebar?.classList.contains('active') ? closeProfile() : openProfile();
}

/* ─────────────────────────────────────────────────────
   6. RENDERIZAÇÃO PRINCIPAL
───────────────────────────────────────────────────── */
function renderProfileContent() {
  const content = document.getElementById('profile-content');
  if (!content) return;

  const html = isAuthenticated && currentUser
    ? renderLoggedInView()
    : renderLoggedOutView();

  content.innerHTML = html;
  content.scrollTop = 0;

  if (isAuthenticated && currentUser) setupLoggedInEvents();
  else                                setupLoggedOutEvents();
}

/* ─────────────────────────────────────────────────────
   7. VIEW — LOGADO
───────────────────────────────────────────────────── */
function renderLoggedInView() {
  const u = currentUser;
  const initials = getInitials(u.name);

  return `
    <!-- Header do usuário -->
    <div class="prof-user-header">
      <div class="prof-avatar-wrap">
        ${u.avatar
          ? `<img class="prof-avatar-img" src="${u.avatar}" alt="${escapeHtml(u.name)}">`
          : `<div class="prof-avatar-placeholder">${initials}</div>`
        }
        <button class="prof-avatar-edit-btn" id="edit-avatar-btn" aria-label="Alterar foto">
          <i class="fas fa-camera"></i>
        </button>
      </div>
      <h2 class="prof-user-name">${escapeHtml(u.name || 'Usuário')}</h2>
      <p class="prof-user-email">${escapeHtml(u.email || '')}</p>
      <span class="prof-badge ${u.verified ? 'prof-badge--verified' : 'prof-badge--pending'}">
        <i class="fas ${u.verified ? 'fa-shield-alt' : 'fa-clock'}"></i>
        ${u.verified ? 'Conta verificada' : 'Verificação pendente'}
      </span>
    </div>

    <!-- Stats -->
    <div class="prof-stats">
      <div class="prof-stat">
        <span class="prof-stat-val">${u.ordersCount ?? 0}</span>
        <span class="prof-stat-label">Pedidos</span>
      </div>
      <div class="prof-stat-divider"></div>
      <div class="prof-stat">
        <span class="prof-stat-val">${u.reviewCount ?? 0}</span>
        <span class="prof-stat-label">Avaliações</span>
      </div>
      <div class="prof-stat-divider"></div>
      <div class="prof-stat">
        <span class="prof-stat-val">${u.wishlistCount ?? 0}</span>
        <span class="prof-stat-label">Favoritos</span>
      </div>
    </div>

    <!-- Menu de navegação -->
    <nav class="prof-menu" aria-label="Menu do perfil">
      <p class="prof-menu-group-label">Compras</p>
      ${menuItem('profile-orders-btn',    'fa-bag-shopping',   'Meus Pedidos',          'Ver histórico completo')}
      ${menuItem('profile-wishlist-btn',  'fa-heart',          'Lista de Desejos',       `${u.wishlistCount ?? 0} itens salvos`)}

      <p class="prof-menu-group-label">Conta</p>
      ${menuItem('profile-personal-btn',  'fa-user-pen',       'Dados Pessoais',         'Nome, e-mail, telefone')}
      ${menuItem('profile-address-btn',   'fa-location-dot',   'Endereços',              'Gerenciar endereços de entrega')}
      ${menuItem('profile-payment-btn',   'fa-credit-card',    'Formas de Pagamento',    'Cartões e métodos salvos')}

      <p class="prof-menu-group-label">Configurações</p>
      ${menuItem('profile-security-btn',      'fa-lock',       'Segurança',              'Senha e autenticação')}
      ${menuItem('profile-notifications-btn', 'fa-bell',       'Notificações',           'E-mail, ofertas e pedidos')}
    </nav>

    <!-- Rodapé -->
    <div class="prof-footer">
      <button class="prof-logout-btn" id="logout-btn">
        <i class="fas fa-arrow-right-from-bracket"></i>
        Sair da conta
      </button>
      <p class="prof-member-since">
        Membro desde ${formatDate(u.createdAt, { year: 'numeric', month: 'long' })}
      </p>
    </div>
  `;
}

function menuItem(id, icon, label, sublabel) {
  return `
    <button class="prof-menu-item" id="${id}" role="menuitem">
      <span class="prof-menu-icon"><i class="fas ${icon}"></i></span>
      <span class="prof-menu-text">
        <span class="prof-menu-label">${label}</span>
        <span class="prof-menu-sub">${sublabel}</span>
      </span>
      <i class="fas fa-chevron-right prof-menu-arrow"></i>
    </button>
  `;
}

/* ─────────────────────────────────────────────────────
   8. VIEW — NÃO LOGADO (LOGIN / CADASTRO / RECUPERAR)
───────────────────────────────────────────────────── */
function renderLoggedOutView() {
  return `
    <div class="prof-auth">
      <div class="prof-auth-icon">
        <i class="fas fa-user-circle"></i>
      </div>
      <h2 class="prof-auth-title">Bem-vindo de volta</h2>
      <p class="prof-auth-sub">Acesse sua conta para ver pedidos, favoritos e muito mais.</p>

      <!-- Tabs Login / Cadastro -->
      <div class="prof-tabs">
        <button class="prof-tab active" data-tab="login">Entrar</button>
        <button class="prof-tab" data-tab="register">Criar conta</button>
      </div>

      <!-- Formulário de Login -->
      <form id="prof-login-form" class="prof-form prof-tab-panel active" data-panel="login" novalidate>
        <div class="prof-field">
          <label class="prof-field-label" for="login-email">E-mail</label>
          <div class="prof-field-wrap">
            <i class="fas fa-envelope prof-field-icon"></i>
            <input class="prof-input" type="email" id="login-email" placeholder="seu@email.com" autocomplete="email" required>
          </div>
          <span class="prof-field-error" id="login-email-err"></span>
        </div>

        <div class="prof-field">
          <div class="prof-field-row">
            <label class="prof-field-label" for="login-password">Senha</label>
            <button type="button" class="prof-forgot-link" id="forgot-password-link">Esqueci minha senha</button>
          </div>
          <div class="prof-field-wrap">
            <i class="fas fa-lock prof-field-icon"></i>
            <input class="prof-input" type="password" id="login-password" placeholder="••••••••" autocomplete="current-password" required>
            <button type="button" class="prof-toggle-pwd" data-target="login-password" aria-label="Mostrar senha">
              <i class="fas fa-eye"></i>
            </button>
          </div>
          <span class="prof-field-error" id="login-password-err"></span>
        </div>

        <button type="submit" class="prof-submit-btn" id="login-submit-btn">
          <span>Entrar</span>
          <i class="fas fa-arrow-right"></i>
        </button>
      </form>

      <!-- Formulário de Cadastro -->
      <form id="prof-register-form" class="prof-form prof-tab-panel" data-panel="register" novalidate>
        <div class="prof-field">
          <label class="prof-field-label" for="reg-name">Nome completo</label>
          <div class="prof-field-wrap">
            <i class="fas fa-user prof-field-icon"></i>
            <input class="prof-input" type="text" id="reg-name" placeholder="Seu nome" autocomplete="name" required>
          </div>
          <span class="prof-field-error" id="reg-name-err"></span>
        </div>

        <div class="prof-field">
          <label class="prof-field-label" for="reg-email">E-mail</label>
          <div class="prof-field-wrap">
            <i class="fas fa-envelope prof-field-icon"></i>
            <input class="prof-input" type="email" id="reg-email" placeholder="seu@email.com" autocomplete="email" required>
          </div>
          <span class="prof-field-error" id="reg-email-err"></span>
        </div>

        <div class="prof-field">
          <label class="prof-field-label" for="reg-password">Senha</label>
          <div class="prof-field-wrap">
            <i class="fas fa-lock prof-field-icon"></i>
            <input class="prof-input" type="password" id="reg-password" placeholder="Mínimo 8 caracteres" required>
            <button type="button" class="prof-toggle-pwd" data-target="reg-password" aria-label="Mostrar senha">
              <i class="fas fa-eye"></i>
            </button>
          </div>
          <div class="prof-password-strength" id="pwd-strength">
            <div class="prof-pwd-bar"><div class="prof-pwd-fill" id="pwd-fill"></div></div>
            <span class="prof-pwd-label" id="pwd-label"></span>
          </div>
          <span class="prof-field-error" id="reg-password-err"></span>
        </div>

        <button type="submit" class="prof-submit-btn" id="register-submit-btn">
          <span>Criar conta grátis</span>
          <i class="fas fa-arrow-right"></i>
        </button>
      </form>

      <!-- Divider Social -->
      <div class="prof-divider"><span>ou continue com</span></div>

      <div class="prof-social-btns">
        <button class="prof-social-btn" id="google-login-btn" aria-label="Entrar com Google">
          <i class="fab fa-google"></i>
          <span>Google</span>
        </button>
        <button class="prof-social-btn" id="apple-login-btn" aria-label="Entrar com Apple">
          <i class="fab fa-apple"></i>
          <span>Apple</span>
        </button>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────
   9. EVENTOS — LOGADO
───────────────────────────────────────────────────── */
function setupLoggedInEvents() {
  bind('logout-btn',               () => handleLogout());
  bind('profile-orders-btn',       () => showOrdersSection());
  bind('profile-personal-btn',     () => showPersonalDataSection());
  bind('profile-address-btn',      () => showAddressSection());
  bind('profile-payment-btn',      () => showPaymentSection());
  bind('profile-security-btn',     () => showSecuritySection());
  bind('profile-notifications-btn',() => showNotificationsSection());
  bind('profile-wishlist-btn',     () => showWishlistSection());
  bind('edit-avatar-btn',          () => handleAvatarEdit());
}

/* ─────────────────────────────────────────────────────
   10. EVENTOS — NÃO LOGADO
───────────────────────────────────────────────────── */
function setupLoggedOutEvents() {
  // Tabs Login / Cadastro
  document.querySelectorAll('.prof-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Toggle senha
  document.querySelectorAll('.prof-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.querySelector('i').className = `fas fa-eye${show ? '-slash' : ''}`;
    });
  });

  // Indicador de força de senha
  const regPwd = document.getElementById('reg-password');
  if (regPwd) {
    regPwd.addEventListener('input', () => updatePasswordStrength(regPwd.value));
  }

  // Submit login
  document.getElementById('prof-login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
  });

  // Submit cadastro
  document.getElementById('prof-register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleRegister();
  });

  // Esqueci senha
  bind('forgot-password-link', showForgotPasswordView);

  // Social
  bind('google-login-btn', () => socialLogin('Google'));
  bind('apple-login-btn',  () => socialLogin('Apple'));
}

function switchTab(tab) {
  document.querySelectorAll('.prof-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.querySelectorAll('.prof-tab-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.panel === tab);
  });
}

/* ─────────────────────────────────────────────────────
   11. AUTH: LOGIN / CADASTRO / LOGOUT
───────────────────────────────────────────────────── */
function handleLogin() {
  clearErrors();
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  let valid = true;

  if (!email || !isValidEmail(email)) {
    setError('login-email-err', 'Informe um e-mail válido');
    valid = false;
  }
  if (!password || password.length < 6) {
    setError('login-password-err', 'Senha muito curta');
    valid = false;
  }
  if (!valid) return;

  setButtonLoading('login-submit-btn', true);

  // Simulação — substituir por chamada Supabase/API real
  setTimeout(() => {
    currentUser = {
      id:            crypto.randomUUID?.() || Date.now().toString(),
      name:          email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      verified:      true,
      ordersCount:   3,
      reviewCount:   5,
      wishlistCount: 2,
      avatar:        null,
      createdAt:     new Date().toISOString(),
    };
    isAuthenticated = true;
    saveUserToStorage();
    setButtonLoading('login-submit-btn', false);
    renderProfileContent();
    showToast('Login realizado com sucesso!', 'success');
  }, 800);
}

function handleRegister() {
  clearErrors();
  const name     = document.getElementById('reg-name')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  let valid = true;

  if (!name || name.length < 2) {
    setError('reg-name-err', 'Informe seu nome completo');
    valid = false;
  }
  if (!email || !isValidEmail(email)) {
    setError('reg-email-err', 'Informe um e-mail válido');
    valid = false;
  }
  if (!password || password.length < 8) {
    setError('reg-password-err', 'A senha deve ter pelo menos 8 caracteres');
    valid = false;
  }
  if (!valid) return;

  setButtonLoading('register-submit-btn', true);

  setTimeout(() => {
    currentUser = {
      id:            crypto.randomUUID?.() || Date.now().toString(),
      name,
      email,
      verified:      false,
      ordersCount:   0,
      reviewCount:   0,
      wishlistCount: 0,
      avatar:        null,
      createdAt:     new Date().toISOString(),
    };
    isAuthenticated = true;
    saveUserToStorage();
    setButtonLoading('register-submit-btn', false);
    renderProfileContent();
    showToast('Conta criada com sucesso! Bem-vindo(a) 🎉', 'success');
  }, 900);
}

function handleLogout() {
  if (!confirm('Deseja sair da sua conta?')) return;
  currentUser     = null;
  isAuthenticated = false;
  saveUserToStorage();
  renderProfileContent();
  showToast('Você saiu da sua conta.', 'info');
}

export function logout() { handleLogout(); }

function socialLogin(provider) {
  showToast(`Login com ${provider} em breve`, 'info');
}

/* ─────────────────────────────────────────────────────
   12. SEÇÕES INTERNAS — helper de navegação
───────────────────────────────────────────────────── */
function openSection(html, afterRender) {
  const content = document.getElementById('profile-content');
  if (!content) return;
  content.innerHTML = html;
  content.scrollTop = 0;
  bind('profile-back-btn', () => renderProfileContent());
  afterRender?.();
}

function sectionHeader(title, extraBtn = '') {
  return `
    <div class="prof-section-head">
      <button class="prof-back-btn" id="profile-back-btn" aria-label="Voltar">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3 class="prof-section-title">${title}</h3>
      ${extraBtn}
    </div>
  `;
}

/* ─────────────────────────────────────────────────────
   13. PEDIDOS
───────────────────────────────────────────────────── */
function showOrdersSection() {
  const orders = currentUser?.orders || MOCK_ORDERS;

  const listHtml = orders.length === 0
    ? emptyState('fa-bag-shopping', 'Nenhum pedido ainda', 'Seus pedidos aparecerão aqui')
    : orders.map(renderOrderCard).join('');

  openSection(`
    ${sectionHeader('Meus Pedidos')}
    <div class="prof-section-body">
      ${listHtml}
    </div>
  `, () => {
    document.querySelectorAll('.order-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => showOrderDetail(btn.dataset.orderId));
    });
  });
}

function renderOrderCard(order) {
  const statusCfg = ORDER_STATUS[order.status] || { label: order.status, color: '#94a3b8', icon: 'fa-circle' };
  return `
    <div class="prof-order-card">
      <div class="prof-order-top">
        <div>
          <p class="prof-order-id">${order.id}</p>
          <p class="prof-order-date"><i class="fas fa-calendar-days"></i> ${formatDate(order.date)}</p>
        </div>
        <span class="prof-status-badge" style="--status-color:${statusCfg.color}">
          <i class="fas ${statusCfg.icon}"></i> ${statusCfg.label}
        </span>
      </div>
      <div class="prof-order-meta">
        <span><i class="fas fa-box"></i> ${order.items} ${order.items === 1 ? 'item' : 'itens'}</span>
        <span class="prof-order-total">${formatCurrency(order.total)}</span>
      </div>
      <button class="prof-detail-btn order-detail-btn" data-order-id="${order.id}">
        Ver detalhes <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  `;
}

function showOrderDetail(orderId) {
  const order = (currentUser?.orders || MOCK_ORDERS).find(o => o.id === orderId);
  if (!order) return;

  const statusCfg = ORDER_STATUS[order.status] || {};
  openSection(`
    ${sectionHeader(`Pedido ${order.id}`)}
    <div class="prof-section-body">
      <div class="prof-order-detail-card">
        <div class="prof-order-status-block" style="--status-color:${statusCfg.color}">
          <i class="fas ${statusCfg.icon} fa-2x"></i>
          <div>
            <p class="prof-od-status-label">${statusCfg.label}</p>
            <p class="prof-od-status-sub">${statusCfg.description || ''}</p>
          </div>
        </div>
        <div class="prof-od-meta">
          <div class="prof-od-row"><span>Número</span><strong>${order.id}</strong></div>
          <div class="prof-od-row"><span>Data</span><strong>${formatDate(order.date)}</strong></div>
          <div class="prof-od-row"><span>Itens</span><strong>${order.items}</strong></div>
          <div class="prof-od-row"><span>Total</span><strong class="prof-od-total">${formatCurrency(order.total)}</strong></div>
        </div>
      </div>
    </div>
  `);
}

/* ─────────────────────────────────────────────────────
   14. DADOS PESSOAIS
───────────────────────────────────────────────────── */
function showPersonalDataSection() {
  const u = currentUser || {};
  openSection(`
    ${sectionHeader('Dados Pessoais')}
    <div class="prof-section-body">
      <form id="personal-data-form" class="prof-form" novalidate>
        ${profField('user-name',      'text',  'fa-user',        'Nome completo',      u.name      || '', 'text', true)}
        ${profField('user-email',     'email', 'fa-envelope',    'E-mail',             u.email     || '', 'email')}
        ${profField('user-phone',     'tel',   'fa-phone',       'Telefone / WhatsApp',u.phone     || '', 'tel')}
        ${profField('user-cpf',       'text',  'fa-id-card',     'CPF',                u.cpf       || '', 'text')}
        ${profField('user-birthdate', 'date',  'fa-cake-candles','Data de nascimento', u.birthdate || '', 'date')}
        <button type="submit" class="prof-submit-btn" id="personal-save-btn">
          <span>Salvar alterações</span>
          <i class="fas fa-check"></i>
        </button>
      </form>
    </div>
  `, () => {
    document.getElementById('personal-data-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name      = document.getElementById('user-name')?.value.trim();
      const email     = document.getElementById('user-email')?.value.trim();
      const phone     = document.getElementById('user-phone')?.value.trim();
      const cpf       = document.getElementById('user-cpf')?.value.trim();
      const birthdate = document.getElementById('user-birthdate')?.value;

      clearErrors();
      if (!name)  { setError('user-name-err', 'Informe seu nome'); return; }
      if (!email || !isValidEmail(email)) { setError('user-email-err', 'E-mail inválido'); return; }

      setButtonLoading('personal-save-btn', true);
      setTimeout(() => {
        Object.assign(currentUser, { name, email, phone, cpf, birthdate });
        saveUserToStorage();
        setButtonLoading('personal-save-btn', false);
        showToast('Dados salvos com sucesso!', 'success');
      }, 600);
    });
  });
}

function profField(id, type, icon, label, value, autocomplete = 'off', hasError = false) {
  return `
    <div class="prof-field">
      <label class="prof-field-label" for="${id}">${label}</label>
      <div class="prof-field-wrap">
        <i class="fas ${icon} prof-field-icon"></i>
        <input class="prof-input" type="${type}" id="${id}" value="${escapeHtml(value)}"
          autocomplete="${autocomplete}" placeholder="${label}">
      </div>
      <span class="prof-field-error" id="${id}-err"></span>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────
   15. ENDEREÇOS
───────────────────────────────────────────────────── */
function showAddressSection() {
  const addresses = currentUser?.addresses || MOCK_ADDRESSES;

  const addBtn = `
    <button class="prof-icon-btn" id="add-address-btn" aria-label="Adicionar endereço">
      <i class="fas fa-plus"></i>
    </button>
  `;

  const listHtml = addresses.length === 0
    ? emptyState('fa-location-dot', 'Nenhum endereço salvo', 'Adicione um endereço de entrega')
    : addresses.map(addr => `
        <div class="prof-address-card ${addr.isDefault ? 'prof-address-card--default' : ''}">
          <div class="prof-address-icon">
            <i class="fas fa-${addr.type === 'work' ? 'building' : 'house'}"></i>
          </div>
          <div class="prof-address-info">
            ${addr.isDefault ? '<span class="prof-default-tag">Principal</span>' : ''}
            <p class="prof-address-street">${escapeHtml(addr.street)}</p>
            <p class="prof-address-city">${escapeHtml(addr.city)}, ${addr.state} — ${addr.zip}</p>
          </div>
          <div class="prof-address-actions">
            <button class="prof-icon-btn-sm" title="Editar"><i class="fas fa-pen"></i></button>
            ${!addr.isDefault ? `<button class="prof-icon-btn-sm prof-icon-btn-sm--danger" title="Remover"><i class="fas fa-trash"></i></button>` : ''}
          </div>
        </div>
      `).join('');

  openSection(`
    ${sectionHeader('Endereços', addBtn)}
    <div class="prof-section-body">
      ${listHtml}
    </div>
  `, () => {
    bind('add-address-btn', () => showToast('Formulário de endereço em breve', 'info'));
  });
}

/* ─────────────────────────────────────────────────────
   16. FORMAS DE PAGAMENTO
───────────────────────────────────────────────────── */
function showPaymentSection() {
  const cards = MOCK_CARDS;

  const addBtn = `
    <button class="prof-icon-btn" id="add-card-btn" aria-label="Adicionar cartão">
      <i class="fas fa-plus"></i>
    </button>
  `;

  const cardsHtml = cards.map(card => `
    <div class="prof-payment-card">
      <div class="prof-payment-flag">
        <i class="fab fa-cc-${card.brand.toLowerCase()}"></i>
      </div>
      <div class="prof-payment-info">
        <p class="prof-payment-name">${card.brand} •••• ${card.last4}</p>
        <p class="prof-payment-exp">Expira ${card.expiry}</p>
      </div>
      ${card.isDefault ? '<span class="prof-default-tag">Principal</span>' : ''}
      <button class="prof-icon-btn-sm prof-icon-btn-sm--danger" title="Remover">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');

  openSection(`
    ${sectionHeader('Formas de Pagamento', addBtn)}
    <div class="prof-section-body">
      ${cardsHtml}
      <div class="prof-pix-block">
        <div class="prof-pix-icon"><i class="fas fa-qrcode"></i></div>
        <div>
          <p class="prof-pix-title">Pix</p>
          <p class="prof-pix-sub">Aprovação instantânea · 5% OFF</p>
        </div>
        <span class="prof-default-tag" style="margin-left:auto">Ativo</span>
      </div>
    </div>
  `, () => {
    bind('add-card-btn', () => showToast('Adicionar cartão em breve', 'info'));
  });
}

/* ─────────────────────────────────────────────────────
   17. SEGURANÇA
───────────────────────────────────────────────────── */
function showSecuritySection() {
  openSection(`
    ${sectionHeader('Segurança')}
    <div class="prof-section-body">
      <form id="security-form" class="prof-form" novalidate>
        ${profField('current-password', 'password', 'fa-lock',        'Senha atual',           '', 'current-password')}
        ${profField('new-password',     'password', 'fa-key',         'Nova senha',            '', 'new-password')}
        ${profField('confirm-password', 'password', 'fa-check-double','Confirmar nova senha',  '', 'new-password')}

        <div class="prof-security-options">
          <label class="prof-toggle-row">
            <div>
              <p class="prof-toggle-label">Autenticação em dois fatores</p>
              <p class="prof-toggle-sub">Proteção extra para sua conta</p>
            </div>
            <label class="prof-toggle">
              <input type="checkbox" id="two-factor">
              <span class="prof-toggle-track"></span>
            </label>
          </label>
          <label class="prof-toggle-row">
            <div>
              <p class="prof-toggle-label">Notificar novos logins</p>
              <p class="prof-toggle-sub">Receba alerta por e-mail</p>
            </div>
            <label class="prof-toggle">
              <input type="checkbox" id="login-notify" checked>
              <span class="prof-toggle-track"></span>
            </label>
          </label>
        </div>

        <button type="submit" class="prof-submit-btn" id="security-save-btn">
          <span>Atualizar segurança</span>
          <i class="fas fa-shield-alt"></i>
        </button>
      </form>

      <div class="prof-danger-zone">
        <p class="prof-danger-title"><i class="fas fa-triangle-exclamation"></i> Zona de perigo</p>
        <button class="prof-danger-btn" id="delete-account-btn">
          <i class="fas fa-user-xmark"></i> Excluir minha conta
        </button>
      </div>
    </div>
  `, () => {
    // Add password toggle to security inputs
    document.querySelectorAll('#security-form .prof-field').forEach(field => {
      const input = field.querySelector('input[type="password"]');
      if (!input) return;
      const wrap = field.querySelector('.prof-field-wrap');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prof-toggle-pwd';
      btn.innerHTML = '<i class="fas fa-eye"></i>';
      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.querySelector('i').className = `fas fa-eye${show ? '-slash' : ''}`;
      });
      wrap.appendChild(btn);
    });

    document.getElementById('security-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const np = document.getElementById('new-password')?.value;
      const cp = document.getElementById('confirm-password')?.value;
      clearErrors();
      if (np && np !== cp) { setError('confirm-password-err', 'Senhas não coincidem'); return; }
      setButtonLoading('security-save-btn', true);
      setTimeout(() => {
        setButtonLoading('security-save-btn', false);
        showToast('Configurações de segurança salvas!', 'success');
      }, 700);
    });

    bind('delete-account-btn', () => {
      if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
        handleLogout();
        showToast('Conta excluída', 'info');
      }
    });
  });
}

/* ─────────────────────────────────────────────────────
   18. NOTIFICAÇÕES
───────────────────────────────────────────────────── */
function showNotificationsSection() {
  const prefs = currentUser?.notifications || {};

  const toggleRow = (id, label, sub, checked) => `
    <label class="prof-toggle-row">
      <div>
        <p class="prof-toggle-label">${label}</p>
        <p class="prof-toggle-sub">${sub}</p>
      </div>
      <label class="prof-toggle">
        <input type="checkbox" id="${id}" ${checked !== false ? 'checked' : ''}>
        <span class="prof-toggle-track"></span>
      </label>
    </label>
  `;

  openSection(`
    ${sectionHeader('Notificações')}
    <div class="prof-section-body">
      <p class="prof-section-group-label">E-mail</p>
      ${toggleRow('notif-email',  'E-mails informativos', 'Novidades e comunicados', prefs.email)}
      ${toggleRow('notif-offers', 'Ofertas e promoções',  'Descubra os melhores preços', prefs.offers)}

      <p class="prof-section-group-label" style="margin-top:20px">Pedidos</p>
      ${toggleRow('notif-orders',  'Atualização de pedidos', 'Status, rastreamento e entrega', prefs.orders)}
      ${toggleRow('notif-payment', 'Confirmação de pagamento', 'Comprovantes e faturas', prefs.payment)}

      <button class="prof-submit-btn" id="notif-save-btn">
        <span>Salvar preferências</span>
        <i class="fas fa-check"></i>
      </button>
    </div>
  `, () => {
    bind('notif-save-btn', () => {
      const n = {
        email:   document.getElementById('notif-email')?.checked,
        offers:  document.getElementById('notif-offers')?.checked,
        orders:  document.getElementById('notif-orders')?.checked,
        payment: document.getElementById('notif-payment')?.checked,
      };
      if (currentUser) {
        currentUser.notifications = n;
        saveUserToStorage();
      }
      showToast('Preferências salvas!', 'success');
    });
  });
}

/* ─────────────────────────────────────────────────────
   19. LISTA DE DESEJOS
───────────────────────────────────────────────────── */
function showWishlistSection() {
  const items = currentUser?.wishlist || [];

  const listHtml = items.length === 0
    ? emptyState('fa-heart', 'Lista de desejos vazia', 'Salve produtos para comprar depois')
    : items.map(item => `
        <div class="prof-wishlist-item">
          <img src="${item.image}" alt="${escapeHtml(item.name)}" class="prof-wishlist-img">
          <div class="prof-wishlist-info">
            <p class="prof-wishlist-name">${escapeHtml(item.name)}</p>
            <p class="prof-wishlist-price">${formatCurrency(item.price)}</p>
          </div>
          <button class="prof-icon-btn-sm prof-icon-btn-sm--danger" title="Remover">
            <i class="fas fa-heart-crack"></i>
          </button>
        </div>
      `).join('');

  openSection(`
    ${sectionHeader(`Lista de Desejos ${items.length > 0 ? `(${items.length})` : ''}`)}
    <div class="prof-section-body">
      ${listHtml}
    </div>
  `);
}

/* ─────────────────────────────────────────────────────
   20. RECUPERAÇÃO DE SENHA
───────────────────────────────────────────────────── */
function showForgotPasswordView() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  content.innerHTML = `
    <div class="prof-auth">
      <button class="prof-back-link" id="back-to-login">
        <i class="fas fa-arrow-left"></i> Voltar ao login
      </button>
      <div class="prof-auth-icon" style="font-size:40px;margin:24px 0 12px;">
        <i class="fas fa-envelope-open-text"></i>
      </div>
      <h2 class="prof-auth-title">Recuperar senha</h2>
      <p class="prof-auth-sub">Informe seu e-mail e enviaremos as instruções.</p>
      <form id="forgot-form" class="prof-form" novalidate>
        <div class="prof-field">
          <label class="prof-field-label" for="forgot-email">E-mail</label>
          <div class="prof-field-wrap">
            <i class="fas fa-envelope prof-field-icon"></i>
            <input class="prof-input" type="email" id="forgot-email" placeholder="seu@email.com" required>
          </div>
          <span class="prof-field-error" id="forgot-email-err"></span>
        </div>
        <button type="submit" class="prof-submit-btn" id="forgot-submit-btn">
          <span>Enviar instruções</span>
          <i class="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  `;
  content.scrollTop = 0;

  bind('back-to-login', () => { renderProfileContent(); });

  document.getElementById('forgot-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email')?.value.trim();
    if (!email || !isValidEmail(email)) {
      setError('forgot-email-err', 'Informe um e-mail válido');
      return;
    }
    setButtonLoading('forgot-submit-btn', true);
    setTimeout(() => {
      content.innerHTML = `
        <div class="prof-auth" style="text-align:center;padding-top:60px;">
          <div style="font-size:64px;margin-bottom:24px;color:var(--primary)">
            <i class="fas fa-envelope-circle-check"></i>
          </div>
          <h2 class="prof-auth-title">E-mail enviado!</h2>
          <p class="prof-auth-sub">Verifique sua caixa de entrada em <strong>${escapeHtml(email)}</strong> e siga as instruções.</p>
          <button class="prof-submit-btn" id="back-to-login-2" style="margin-top:32px">
            <span>Voltar ao login</span>
          </button>
        </div>
      `;
      bind('back-to-login-2', () => renderProfileContent());
    }, 1000);
  });
}

/* ─────────────────────────────────────────────────────
   21. AVATAR
───────────────────────────────────────────────────── */
function handleAvatarEdit() {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (currentUser) {
        currentUser.avatar = ev.target.result;
        saveUserToStorage();
        renderProfileContent();
        showToast('Foto atualizada!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

/* ─────────────────────────────────────────────────────
   22. FORÇA DE SENHA
───────────────────────────────────────────────────── */
function updatePasswordStrength(pwd) {
  const fill  = document.getElementById('pwd-fill');
  const label = document.getElementById('pwd-label');
  if (!fill || !label) return;

  let score = 0;
  if (pwd.length >= 8)             score++;
  if (/[A-Z]/.test(pwd))           score++;
  if (/[0-9]/.test(pwd))           score++;
  if (/[^A-Za-z0-9]/.test(pwd))   score++;

  const levels = [
    { pct: '0%',   color: 'transparent', text: '' },
    { pct: '25%',  color: '#ef4444',     text: 'Muito fraca' },
    { pct: '50%',  color: '#f59e0b',     text: 'Fraca' },
    { pct: '75%',  color: '#38bdf8',     text: 'Boa' },
    { pct: '100%', color: '#10b981',     text: 'Forte' },
  ];

  const lvl = levels[score] || levels[0];
  fill.style.width           = lvl.pct;
  fill.style.backgroundColor = lvl.color;
  label.textContent          = lvl.text;
  label.style.color          = lvl.color;
}

/* ─────────────────────────────────────────────────────
   23. TOAST
───────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  // Remove toasts antigos
  document.querySelectorAll('.dom-toast').forEach(t => t.remove());

  const icons = { success: 'fa-check-circle', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const colors = { success: '#10b981', error: '#f87171', info: '#38bdf8', warning: '#f59e0b' };

  const toast = document.createElement('div');
  toast.className = 'dom-toast';
  toast.style.cssText = `
    position:fixed; bottom:88px; right:20px; z-index:99999;
    display:flex; align-items:center; gap:10px;
    padding:13px 18px; border-radius:14px; max-width:320px;
    background:rgba(11,22,40,0.97); backdrop-filter:blur(20px);
    border:1px solid ${colors[type]}40;
    color:#f0f4ff; font-size:14px; font-weight:500;
    box-shadow:0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${colors[type]}20;
    font-family:'Inter',system-ui,sans-serif;
    transform:translateX(120%); transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  `;
  toast.innerHTML = `
    <i class="fas ${icons[type]}" style="color:${colors[type]};font-size:16px;flex-shrink:0"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

/* ─────────────────────────────────────────────────────
   24. UTILITÁRIOS
───────────────────────────────────────────────────── */
function bind(id, fn) {
  document.getElementById(id)?.addEventListener('click', fn);
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(dateString, opts = {}) {
  if (!dateString) return '—';
  const options = Object.keys(opts).length
    ? opts
    : { day: '2-digit', month: '2-digit', year: 'numeric' };
  try {
    return new Intl.DateTimeFormat('pt-BR', options).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearErrors() {
  document.querySelectorAll('.prof-field-error').forEach(e => {
    e.textContent = ''; e.style.display = 'none';
  });
}

function setButtonLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>Aguarde...</span>';
  } else {
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
  }
}

function emptyState(icon, title, sub) {
  return `
    <div class="prof-empty">
      <i class="fas ${icon}"></i>
      <p class="prof-empty-title">${title}</p>
      <p class="prof-empty-sub">${sub}</p>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────
   25. DADOS MOCK
───────────────────────────────────────────────────── */
const ORDER_STATUS = {
  delivered:  { label: 'Entregue',     color: '#10b981', icon: 'fa-circle-check',     description: 'Seu pedido foi entregue com sucesso.' },
  shipped:    { label: 'Enviado',      color: '#38bdf8', icon: 'fa-truck',             description: 'A caminho — previsão em 2 dias úteis.' },
  processing: { label: 'Processando', color: '#f59e0b', icon: 'fa-clock',             description: 'Separando e embalando seu pedido.' },
  cancelled:  { label: 'Cancelado',   color: '#f87171', icon: 'fa-circle-xmark',      description: 'Este pedido foi cancelado.' },
};

const MOCK_ORDERS = [
  { id: 'DOM-2026-001', date: '2026-05-15', total: 1299.90, status: 'delivered', items: 2 },
  { id: 'DOM-2026-002', date: '2026-05-22', total: 3499.00, status: 'shipped',   items: 1 },
  { id: 'DOM-2026-003', date: '2026-05-30', total: 199.90,  status: 'processing',items: 3 },
];

const MOCK_ADDRESSES = [
  { id: 1, street: 'Av. Paulista, 1000', city: 'São Paulo',  state: 'SP', zip: '01310-100', isDefault: true,  type: 'home' },
  { id: 2, street: 'R. dos Bandeirantes, 200', city: 'Campinas', state: 'SP', zip: '13010-050', isDefault: false, type: 'work' },
];

const MOCK_CARDS = [
  { brand: 'visa',       last4: '4242', expiry: '12/2028', isDefault: true  },
  { brand: 'mastercard', last4: '5555', expiry: '08/2027', isDefault: false },
];

/* ─────────────────────────────────────────────────────
   26. EXPORTS ADICIONAIS
───────────────────────────────────────────────────── */
export function setupProfileGlobals() {
  window.openProfile  = openProfile;
  window.closeProfile = closeProfile;
  window.toggleProfile = toggleProfile;
}

export function getCurrentUser()    { return currentUser; }
export function getIsAuthenticated(){ return isAuthenticated; }

/* ─────────────────────────────────────────────────────
   27. ESTILOS — INLINE (alinhados com identidade DOM)
───────────────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById('dom-profile-styles')) return;

  const style = document.createElement('style');
  style.id = 'dom-profile-styles';
  style.textContent = `
/* ── Variáveis locais (herdam do app.css) ─────────────── */
:root {
  --prof-primary:   #22d3ee;
  --prof-bg:        #050c1a;
  --prof-card:      #0b1628;
  --prof-border:    rgba(255,255,255,0.07);
  --prof-text:      #f0f4ff;
  --prof-muted:     #7a90b0;
  --prof-radius:    16px;
  --prof-tr:        0.22s cubic-bezier(0.4,0,0.2,1);
}

/* ── Overlay ──────────────────────────────────────────── */
.prof-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  z-index: 1998;
  opacity: 0; visibility: hidden;
  transition: opacity var(--prof-tr), visibility var(--prof-tr);
}
.prof-overlay.active { opacity: 1; visibility: visible; }

/* ── Sidebar ──────────────────────────────────────────── */
.prof-sidebar {
  position: fixed; top: 0; right: 0;
  width: min(460px, 100vw);
  height: 100dvh;
  background: var(--prof-bg);
  border-left: 1px solid var(--prof-border);
  z-index: 1999;
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  box-shadow: -20px 0 60px rgba(0,0,0,0.6);
  font-family: 'Inter',system-ui,sans-serif;
}
.prof-sidebar.active { transform: translateX(0); }

/* ── Header ───────────────────────────────────────────── */
.prof-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px;
  background: rgba(11,22,40,0.8); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--prof-border);
  flex-shrink: 0;
}
.prof-head-left { display: flex; align-items: center; gap: 14px; }
.prof-head-icon {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #22d3ee20, #818cf820);
  border: 1px solid rgba(34,211,238,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: var(--prof-primary);
}
.prof-head-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--prof-primary); margin: 0;
}
.prof-head-brand { font-size: 17px; font-weight: 900; color: #fff; margin: 0; letter-spacing: -0.5px; }

.prof-close-btn {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(255,255,255,0.05); border: 1px solid var(--prof-border);
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all var(--prof-tr);
}
.prof-close-btn:hover { background: #f87171; border-color: #f87171; transform: rotate(90deg); }

/* ── Body scrollável ──────────────────────────────────── */
.prof-body {
  flex: 1; overflow-y: auto; overflow-x: hidden;
}
.prof-body::-webkit-scrollbar { width: 4px; }
.prof-body::-webkit-scrollbar-track { background: transparent; }
.prof-body::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 4px; }

/* ── Header do usuário (logado) ───────────────────────── */
.prof-user-header {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 20px 24px;
  background: radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 70%);
  border-bottom: 1px solid var(--prof-border);
  text-align: center;
}

.prof-avatar-wrap { position: relative; margin-bottom: 16px; }

.prof-avatar-img,
.prof-avatar-placeholder {
  width: 96px; height: 96px; border-radius: 50%;
  border: 2px solid rgba(34,211,238,0.3);
  box-shadow: 0 0 0 4px rgba(34,211,238,0.08);
}
.prof-avatar-img { object-fit: cover; display: block; }
.prof-avatar-placeholder {
  background: linear-gradient(135deg, #22d3ee30, #818cf830);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: 800; color: var(--prof-primary);
  letter-spacing: -1px;
}
.prof-avatar-edit-btn {
  position: absolute; bottom: 2px; right: 2px;
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--prof-primary); border: 2px solid var(--prof-bg);
  color: #040e20; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform var(--prof-tr);
}
.prof-avatar-edit-btn:hover { transform: scale(1.1); }

.prof-user-name { font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 4px; letter-spacing: -0.5px; }
.prof-user-email { font-size: 13px; color: var(--prof-muted); margin: 0 0 12px; }

.prof-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
}
.prof-badge--verified { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); }
.prof-badge--pending  { background: rgba(245,158,11,0.12);  color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }

/* ── Stats ────────────────────────────────────────────── */
.prof-stats {
  display: flex; align-items: center;
  background: rgba(11,22,40,0.6);
  border-bottom: 1px solid var(--prof-border);
}
.prof-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 18px 12px; }
.prof-stat-val   { font-size: 22px; font-weight: 800; color: var(--prof-primary); line-height: 1; }
.prof-stat-label { font-size: 11px; color: var(--prof-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
.prof-stat-divider { width: 1px; height: 36px; background: var(--prof-border); flex-shrink: 0; }

/* ── Menu ─────────────────────────────────────────────── */
.prof-menu { padding: 12px 16px 0; }
.prof-menu-group-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--prof-muted); padding: 16px 4px 8px; margin: 0;
}
.prof-menu-item {
  width: 100%; display: flex; align-items: center; gap: 14px;
  padding: 13px 14px; border: none; border-radius: var(--prof-radius);
  background: transparent; color: var(--prof-text); cursor: pointer;
  text-align: left; transition: background var(--prof-tr);
  margin-bottom: 2px;
}
.prof-menu-item:hover { background: rgba(255,255,255,0.05); }
.prof-menu-item:hover .prof-menu-arrow { transform: translateX(3px); color: var(--prof-primary); }

.prof-menu-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: var(--prof-primary);
  transition: all var(--prof-tr);
}
.prof-menu-item:hover .prof-menu-icon { background: rgba(34,211,238,0.15); }

.prof-menu-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.prof-menu-label { font-size: 14px; font-weight: 600; color: #e8f0ff; }
.prof-menu-sub   { font-size: 12px; color: var(--prof-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prof-menu-arrow { font-size: 11px; color: #475569; transition: all var(--prof-tr); }

/* ── Footer (logado) ──────────────────────────────────── */
.prof-footer { padding: 20px; border-top: 1px solid var(--prof-border); margin-top: 8px; }
.prof-logout-btn {
  width: 100%; padding: 12px; border-radius: var(--prof-radius);
  background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
  color: #f87171; font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all var(--prof-tr);
}
.prof-logout-btn:hover { background: rgba(248,113,113,0.16); border-color: #f87171; }
.prof-member-since { font-size: 11px; color: var(--prof-muted); text-align: center; margin: 12px 0 0; }

/* ── Auth (não logado) ────────────────────────────────── */
.prof-auth { padding: 28px 24px; }
.prof-auth-icon { font-size: 52px; color: var(--prof-primary); text-align: center; margin-bottom: 12px; }
.prof-auth-title { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 8px; letter-spacing: -0.5px; text-align: center; }
.prof-auth-sub   { font-size: 14px; color: var(--prof-muted); margin: 0 0 24px; text-align: center; line-height: 1.5; }

/* ── Tabs ─────────────────────────────────────────────── */
.prof-tabs {
  display: flex; background: rgba(11,22,40,0.6);
  border: 1px solid var(--prof-border); border-radius: 12px;
  padding: 4px; margin-bottom: 24px;
}
.prof-tab {
  flex: 1; padding: 9px; border: none; border-radius: 9px;
  background: transparent; color: var(--prof-muted);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all var(--prof-tr);
}
.prof-tab.active { background: rgba(34,211,238,0.12); color: var(--prof-primary); }

/* ── Tab panels ───────────────────────────────────────── */
.prof-tab-panel { display: none; }
.prof-tab-panel.active { display: block; }

/* ── Formulário ───────────────────────────────────────── */
.prof-form { display: flex; flex-direction: column; gap: 0; }

.prof-field { margin-bottom: 16px; }
.prof-field-label { display: block; font-size: 13px; font-weight: 600; color: #c4d4f0; margin-bottom: 8px; }
.prof-field-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

.prof-field-wrap { position: relative; display: flex; align-items: center; }
.prof-field-icon {
  position: absolute; left: 14px; font-size: 13px; color: var(--prof-muted); pointer-events: none;
}
.prof-input {
  width: 100%; padding: 12px 40px 12px 40px;
  background: rgba(11,22,40,0.8); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; color: var(--prof-text); font-size: 14px; outline: none;
  transition: border-color var(--prof-tr), box-shadow var(--prof-tr);
  font-family: 'Inter',system-ui,sans-serif;
}
.prof-input:focus { border-color: var(--prof-primary); box-shadow: 0 0 0 3px rgba(34,211,238,0.12); }
.prof-input::placeholder { color: #475569; }
.prof-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }

.prof-toggle-pwd {
  position: absolute; right: 12px; background: none; border: none;
  color: var(--prof-muted); cursor: pointer; font-size: 14px; padding: 4px;
  transition: color var(--prof-tr);
}
.prof-toggle-pwd:hover { color: var(--prof-primary); }

.prof-field-error { display: none; font-size: 12px; color: #f87171; margin-top: 6px; }

.prof-forgot-link {
  background: none; border: none; color: var(--prof-primary);
  font-size: 12px; font-weight: 600; cursor: pointer; padding: 0;
  transition: opacity var(--prof-tr);
}
.prof-forgot-link:hover { opacity: 0.75; }

/* ── Força de senha ───────────────────────────────────── */
.prof-password-strength { margin: 8px 0 4px; display: flex; align-items: center; gap: 10px; }
.prof-pwd-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.prof-pwd-fill { height: 100%; width: 0; border-radius: 2px; transition: all 0.4s ease; }
.prof-pwd-label { font-size: 11px; font-weight: 600; min-width: 60px; }

/* ── Submit btn ───────────────────────────────────────── */
.prof-submit-btn {
  width: 100%; padding: 14px; margin-top: 8px; border: none; border-radius: var(--prof-radius);
  background: linear-gradient(135deg, #22d3ee, #3b82f6);
  color: #040e20; font-size: 15px; font-weight: 800; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all 0.25s ease; box-shadow: 0 4px 16px rgba(34,211,238,0.25);
  font-family: 'Inter',system-ui,sans-serif;
}
.prof-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,211,238,0.35); filter: brightness(1.06); }
.prof-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Divider social ───────────────────────────────────── */
.prof-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 24px 0; color: var(--prof-muted); font-size: 12px; font-weight: 600;
}
.prof-divider::before, .prof-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--prof-border);
}

/* ── Social buttons ───────────────────────────────────── */
.prof-social-btns { display: flex; gap: 12px; }
.prof-social-btn {
  flex: 1; padding: 12px; border-radius: 12px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--prof-border);
  color: var(--prof-text); font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all var(--prof-tr);
  font-family: 'Inter',system-ui,sans-serif;
}
.prof-social-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }

/* ── Seções internas ──────────────────────────────────── */
.prof-section-head {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 20px; border-bottom: 1px solid var(--prof-border);
  background: rgba(11,22,40,0.7); backdrop-filter: blur(10px);
  position: sticky; top: 0; z-index: 10;
}
.prof-back-btn {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--prof-border);
  background: rgba(255,255,255,0.04); color: var(--prof-text); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
  transition: all var(--prof-tr); flex-shrink: 0;
}
.prof-back-btn:hover { background: rgba(255,255,255,0.1); color: var(--prof-primary); }
.prof-section-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0; letter-spacing: -0.3px; flex: 1; }
.prof-section-group-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--prof-muted); padding: 0 0 8px; margin: 0;
}

.prof-section-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }

/* ── Ícone btn pequeno ────────────────────────────────── */
.prof-icon-btn {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--prof-border);
  background: rgba(255,255,255,0.04); color: var(--prof-text); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  transition: all var(--prof-tr); flex-shrink: 0; margin-left: auto;
}
.prof-icon-btn:hover { background: rgba(34,211,238,0.12); border-color: rgba(34,211,238,0.3); color: var(--prof-primary); }

.prof-icon-btn-sm {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--prof-border);
  background: rgba(255,255,255,0.03); color: var(--prof-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 12px;
  transition: all var(--prof-tr); flex-shrink: 0;
}
.prof-icon-btn-sm:hover { background: rgba(255,255,255,0.08); color: var(--prof-text); }
.prof-icon-btn-sm--danger:hover { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.3); }

/* ── Pedidos ──────────────────────────────────────────── */
.prof-order-card {
  background: rgba(11,22,40,0.7); border: 1px solid var(--prof-border);
  border-radius: var(--prof-radius); padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
  transition: border-color var(--prof-tr);
}
.prof-order-card:hover { border-color: rgba(34,211,238,0.2); }
.prof-order-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.prof-order-id   { font-size: 14px; font-weight: 700; color: #e0eaff; margin: 0 0 4px; }
.prof-order-date { font-size: 12px; color: var(--prof-muted); margin: 0; display: flex; align-items: center; gap: 6px; }
.prof-order-meta { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--prof-muted); }
.prof-order-total { font-size: 16px; font-weight: 800; color: var(--prof-primary); }

.prof-status-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 999px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  background: color-mix(in srgb, var(--status-color) 15%, transparent);
  color: var(--status-color);
  border: 1px solid color-mix(in srgb, var(--status-color) 30%, transparent);
}

.prof-detail-btn {
  width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--prof-border);
  background: rgba(255,255,255,0.03); color: var(--prof-muted); cursor: pointer;
  font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all var(--prof-tr); font-family: 'Inter',system-ui,sans-serif;
}
.prof-detail-btn:hover { background: rgba(34,211,238,0.08); border-color: rgba(34,211,238,0.25); color: var(--prof-primary); }

/* ── Detalhe do pedido ────────────────────────────────── */
.prof-order-detail-card { background: rgba(11,22,40,0.7); border: 1px solid var(--prof-border); border-radius: var(--prof-radius); overflow: hidden; }
.prof-order-status-block {
  display: flex; align-items: center; gap: 16px; padding: 20px;
  background: color-mix(in srgb, var(--status-color) 8%, transparent);
  border-bottom: 1px solid var(--prof-border);
  color: var(--status-color);
}
.prof-od-status-label { font-size: 16px; font-weight: 800; margin: 0 0 2px; }
.prof-od-status-sub   { font-size: 13px; color: var(--prof-muted); margin: 0; }
.prof-od-meta { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.prof-od-row  { display: flex; justify-content: space-between; font-size: 14px; color: var(--prof-muted); }
.prof-od-row strong { color: #e0eaff; }
.prof-od-total { color: var(--prof-primary) !important; font-size: 18px; }

/* ── Endereços ────────────────────────────────────────── */
.prof-address-card {
  display: flex; align-items: center; gap: 14px;
  background: rgba(11,22,40,0.7); border: 1px solid var(--prof-border);
  border-radius: var(--prof-radius); padding: 16px;
  transition: border-color var(--prof-tr);
}
.prof-address-card--default { border-color: rgba(34,211,238,0.3); background: rgba(34,211,238,0.04); }
.prof-address-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(34,211,238,0.1); color: var(--prof-primary);
  display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
}
.prof-address-info { flex: 1; min-width: 0; }
.prof-address-street { font-size: 14px; font-weight: 700; color: #e0eaff; margin: 0 0 2px; }
.prof-address-city   { font-size: 12px; color: var(--prof-muted); margin: 0; }
.prof-address-actions { display: flex; align-items: center; gap: 6px; }

/* ── Tag padrão ───────────────────────────────────────── */
.prof-default-tag {
  background: rgba(34,211,238,0.12); color: var(--prof-primary);
  border: 1px solid rgba(34,211,238,0.25); font-size: 10px; font-weight: 700;
  padding: 3px 10px; border-radius: 999px; letter-spacing: 0.04em; white-space: nowrap;
}

/* ── Pagamento ────────────────────────────────────────── */
.prof-payment-card {
  display: flex; align-items: center; gap: 14px;
  background: rgba(11,22,40,0.7); border: 1px solid var(--prof-border);
  border-radius: var(--prof-radius); padding: 16px;
}
.prof-payment-flag { font-size: 32px; color: var(--prof-muted); flex-shrink: 0; width: 40px; text-align: center; }
.prof-payment-info { flex: 1; }
.prof-payment-name { font-size: 14px; font-weight: 700; color: #e0eaff; margin: 0 0 2px; }
.prof-payment-exp  { font-size: 12px; color: var(--prof-muted); margin: 0; }

.prof-pix-block {
  display: flex; align-items: center; gap: 14px;
  background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.2);
  border-radius: var(--prof-radius); padding: 16px;
}
.prof-pix-icon { font-size: 24px; color: #10b981; flex-shrink: 0; width: 40px; text-align: center; }
.prof-pix-title { font-size: 14px; font-weight: 700; color: #e0eaff; margin: 0 0 2px; }
.prof-pix-sub   { font-size: 12px; color: #10b981; margin: 0; font-weight: 600; }

/* ── Segurança — toggles ──────────────────────────────── */
.prof-security-options { display: flex; flex-direction: column; gap: 0; margin: 8px 0 16px; }
.prof-toggle-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px 0; border-bottom: 1px solid var(--prof-border); cursor: pointer;
}
.prof-toggle-row:last-child { border-bottom: none; }
.prof-toggle-label { font-size: 14px; font-weight: 600; color: #e0eaff; margin: 0 0 2px; }
.prof-toggle-sub   { font-size: 12px; color: var(--prof-muted); margin: 0; }

.prof-toggle { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
.prof-toggle input { opacity: 0; width: 0; height: 0; }
.prof-toggle-track {
  position: absolute; cursor: pointer; inset: 0;
  background: rgba(255,255,255,0.1); border: 1px solid var(--prof-border);
  border-radius: 999px; transition: all 0.3s;
}
.prof-toggle-track::before {
  content: ''; position: absolute;
  width: 20px; height: 20px; border-radius: 50%;
  left: 2px; top: 50%; transform: translateY(-50%);
  background: var(--prof-muted); transition: all 0.3s;
}
.prof-toggle input:checked + .prof-toggle-track { background: rgba(34,211,238,0.25); border-color: var(--prof-primary); }
.prof-toggle input:checked + .prof-toggle-track::before { background: var(--prof-primary); transform: translateX(22px) translateY(-50%); }

/* ── Zona de perigo ───────────────────────────────────── */
.prof-danger-zone {
  border: 1px solid rgba(248,113,113,0.2); border-radius: var(--prof-radius);
  padding: 18px; margin-top: 8px;
  background: rgba(248,113,113,0.04);
}
.prof-danger-title { font-size: 12px; font-weight: 700; color: #f87171; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
.prof-danger-btn {
  width: 100%; padding: 11px; border-radius: 10px;
  background: transparent; border: 1px solid rgba(248,113,113,0.3);
  color: #f87171; font-size: 13px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all var(--prof-tr); font-family: 'Inter',system-ui,sans-serif;
}
.prof-danger-btn:hover { background: rgba(248,113,113,0.1); }

/* ── Notificações ─────────────────────────────────────── */
.prof-toggle-row-notif { /* alias handled via .prof-toggle-row */ }

/* ── Wishlist ─────────────────────────────────────────── */
.prof-wishlist-item {
  display: flex; align-items: center; gap: 14px;
  background: rgba(11,22,40,0.7); border: 1px solid var(--prof-border);
  border-radius: var(--prof-radius); padding: 14px;
}
.prof-wishlist-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; flex-shrink: 0; background: #1e2d45; }
.prof-wishlist-info { flex: 1; min-width: 0; }
.prof-wishlist-name  { font-size: 13px; font-weight: 600; color: #e0eaff; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prof-wishlist-price { font-size: 14px; font-weight: 800; color: var(--prof-primary); margin: 0; }

/* ── Empty state ──────────────────────────────────────── */
.prof-empty { text-align: center; padding: 60px 20px; }
.prof-empty i { font-size: 52px; color: #1e2d45; display: block; margin-bottom: 16px; }
.prof-empty-title { font-size: 16px; font-weight: 700; color: #4a6080; margin: 0 0 6px; }
.prof-empty-sub   { font-size: 13px; color: var(--prof-muted); margin: 0; }

/* ── Back link (forgot password) ─────────────────────── */
.prof-back-link {
  background: none; border: none; color: var(--prof-muted); cursor: pointer;
  font-size: 13px; font-weight: 600; padding: 0;
  display: flex; align-items: center; gap: 8px;
  transition: color var(--prof-tr); font-family: 'Inter',system-ui,sans-serif;
}
.prof-back-link:hover { color: var(--prof-primary); }

/* ── Responsivo mobile ────────────────────────────────── */
@media (max-width: 480px) {
  .prof-sidebar { width: 100vw; border-left: none; }
  .prof-auth { padding: 20px 18px; }
  .prof-section-body { padding: 16px; }
}
  `;
  document.head.appendChild(style);
}