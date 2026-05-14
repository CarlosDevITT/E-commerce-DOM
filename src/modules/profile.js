// src/modules/profile.js — Módulo de Perfil do Usuário (sem MODAL)
'use strict';

// Estado do perfil
let currentUser = null;
let isAuthenticated = false;

// Elementos DOM
let profileSidebar = null;
let profileOverlay = null;

// ── Inicializar módulo ────────────────────────────────────────────────
export async function initProfile() {
  console.log('👤 Inicializando módulo de Perfil...');
  
  // Carregar usuário do localStorage/session
  loadUserFromStorage();
  
  // Criar elementos do perfil (sidebar)
  createProfileElements();
  
  // Configurar eventos
  setupProfileEvents();
  
  console.log('✅ Perfil inicializado com sucesso');
}

// ── Carregar usuário do storage ──────────────────────────────────────
function loadUserFromStorage() {
  try {
    const savedUser = localStorage.getItem('dom_user');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      isAuthenticated = true;
    } else {
      currentUser = null;
      isAuthenticated = false;
    }
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    currentUser = null;
    isAuthenticated = false;
  }
}

// ── Salvar usuário no storage ────────────────────────────────────────
function saveUserToStorage() {
  try {
    if (currentUser) {
      localStorage.setItem('dom_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dom_user');
    }
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
  }
}

// ── Criar elementos do perfil (sidebar) ──────────────────────────────
function createProfileElements() {
  // Verificar se já existe
  if (document.getElementById('profile-sidebar')) return;
  
  // Criar overlay
  profileOverlay = document.createElement('div');
  profileOverlay.id = 'profile-sidebar-overlay';
  profileOverlay.className = 'cart-overlay';
  profileOverlay.style.display = 'none';
  
  // Criar sidebar do perfil
  profileSidebar = document.createElement('aside');
  profileSidebar.id = 'profile-sidebar';
  profileSidebar.className = 'ecom-cart-sidebar';
  profileSidebar.style.width = '450px';
  profileSidebar.innerHTML = `
    <div class="ecom-cart-head">
      <div class="ecom-cart-head-left">
        <div class="ecom-cart-logo-wrap">
          <i class="fas fa-user-circle"></i>
        </div>
        <div>
          <p class="ecom-cart-head-label">Minha Conta</p>
          <p class="ecom-cart-head-store">DOM Eletrônicos</p>
        </div>
      </div>
      <button id="close-profile-sidebar" class="h-icon-btn cart-close-btn" aria-label="Fechar perfil">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="ecom-cart-body" id="profile-content">
      <!-- Conteúdo dinâmico será inserido aqui -->
      <div class="profile-loading">
        <div class="spinner"></div>
        <p>Carregando...</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(profileOverlay);
  document.body.appendChild(profileSidebar);
}

// ── Configurar eventos do perfil ─────────────────────────────────────
function setupProfileEvents() {
  const closeBtn = document.getElementById('close-profile-sidebar');
  const overlay = document.getElementById('profile-sidebar-overlay');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeProfile());
  }
  
  if (overlay) {
    overlay.addEventListener('click', () => closeProfile());
  }
}

// ── Abrir perfil (sidebar) ───────────────────────────────────────────
export function openProfile() {
  const sidebar = document.getElementById('profile-sidebar');
  const overlay = document.getElementById('profile-sidebar-overlay');
  
  if (sidebar && overlay) {
    renderProfileContent();
    sidebar.classList.add('active');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

// ── Fechar perfil ────────────────────────────────────────────────────
export function closeProfile() {
  const sidebar = document.getElementById('profile-sidebar');
  const overlay = document.getElementById('profile-sidebar-overlay');
  
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ── Alternar perfil ──────────────────────────────────────────────────
export function toggleProfile() {
  const sidebar = document.getElementById('profile-sidebar');
  if (sidebar && sidebar.classList.contains('active')) {
    closeProfile();
  } else {
    openProfile();
  }
}

// ── Renderizar conteúdo do perfil ────────────────────────────────────
function renderProfileContent() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  if (isAuthenticated && currentUser) {
    content.innerHTML = renderLoggedInView();
    setupLoggedInEvents();
  } else {
    content.innerHTML = renderLoggedOutView();
    setupLoggedOutEvents();
  }
}

// ── Renderizar visualização de usuário logado ────────────────────────
function renderLoggedInView() {
  return `
    <div class="profile-user-header">
      <div class="profile-avatar">
        ${currentUser.avatar 
          ? `<img src="${currentUser.avatar}" alt="${currentUser.name}">`
          : `<div class="avatar-placeholder">
               <i class="fas fa-user"></i>
             </div>`
        }
        <button class="edit-avatar-btn" id="edit-avatar-btn">
          <i class="fas fa-camera"></i>
        </button>
      </div>
      <h3>${escapeHtml(currentUser.name || 'Usuário')}</h3>
      <p class="profile-email">${escapeHtml(currentUser.email || 'usuario@email.com')}</p>
      <span class="profile-badge ${currentUser.verified ? 'verified' : 'unverified'}">
        <i class="fas ${currentUser.verified ? 'fa-check-circle' : 'fa-clock'}"></i>
        ${currentUser.verified ? 'Verificado' : 'Pendente'}
      </span>
    </div>
    
    <div class="profile-stats">
      <div class="stat-card">
        <i class="fas fa-shopping-bag"></i>
        <div>
          <span class="stat-value">${currentUser.ordersCount || 0}</span>
          <span class="stat-label">Pedidos</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fas fa-star"></i>
        <div>
          <span class="stat-value">${currentUser.reviewCount || 0}</span>
          <span class="stat-label">Avaliações</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fas fa-heart"></i>
        <div>
          <span class="stat-value">${currentUser.wishlistCount || 0}</span>
          <span class="stat-label">Favoritos</span>
        </div>
      </div>
    </div>
    
    <div class="profile-menu">
      <button class="profile-menu-item" id="profile-orders-btn">
        <i class="fas fa-truck"></i>
        <span>Meus Pedidos</span>
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <button class="profile-menu-item" id="profile-personal-btn">
        <i class="fas fa-user-edit"></i>
        <span>Dados Pessoais</span>
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <button class="profile-menu-item" id="profile-address-btn">
        <i class="fas fa-map-marker-alt"></i>
        <span>Endereços</span>
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <button class="profile-menu-item" id="profile-payment-btn">
        <i class="fas fa-credit-card"></i>
        <span>Formas de Pagamento</span>
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <button class="profile-menu-item" id="profile-security-btn">
        <i class="fas fa-lock"></i>
        <span>Segurança</span>
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <button class="profile-menu-item" id="profile-notifications-btn">
        <i class="fas fa-bell"></i>
        <span>Notificações</span>
        <i class="fas fa-chevron-right"></i>
      </button>
      
      <button class="profile-menu-item" id="profile-wishlist-btn">
        <i class="fas fa-heart"></i>
        <span>Lista de Desejos</span>
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    
    <div class="profile-footer">
      <button class="btn-logout" id="logout-btn">
        <i class="fas fa-sign-out-alt"></i>
        Sair da Conta
      </button>
    </div>
  `;
}

// ── Renderizar visualização de usuário não logado ────────────────────
function renderLoggedOutView() {
  return `
    <div class="profile-login-view">
      <div class="profile-login-icon">
        <i class="fas fa-user-circle"></i>
      </div>
      <h3>Faça seu login</h3>
      <p>Acesse sua conta para ver seus pedidos, favoritos e muito mais.</p>
      
      <form id="profile-login-form" class="profile-login-form">
        <div class="form-group">
          <label>E-mail</label>
          <input type="email" id="login-email" placeholder="seu@email.com" required>
        </div>
        
        <div class="form-group">
          <label>Senha</label>
          <input type="password" id="login-password" placeholder="••••••••" required>
        </div>
        
        <button type="submit" class="btn-primary btn-login">
          <i class="fas fa-sign-in-alt"></i>
          Entrar
        </button>
        
        <div class="profile-links">
          <a href="#" id="forgot-password-link">Esqueci minha senha</a>
          <a href="#" id="create-account-link">Criar nova conta</a>
        </div>
      </form>
      
      <div class="social-login">
        <p>Ou continue com</p>
        <div class="social-buttons">
          <button class="social-btn google" id="google-login-btn">
            <i class="fab fa-google"></i>
          </button>
          <button class="social-btn facebook" id="facebook-login-btn">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="social-btn apple" id="apple-login-btn">
            <i class="fab fa-apple"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Configurar eventos do usuário logado ─────────────────────────────
function setupLoggedInEvents() {
  // Botão de logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => logout());
  }
  
  // Menu items
  const ordersBtn = document.getElementById('profile-orders-btn');
  if (ordersBtn) ordersBtn.addEventListener('click', () => showOrdersSection());
  
  const personalBtn = document.getElementById('profile-personal-btn');
  if (personalBtn) personalBtn.addEventListener('click', () => showPersonalDataSection());
  
  const addressBtn = document.getElementById('profile-address-btn');
  if (addressBtn) addressBtn.addEventListener('click', () => showAddressSection());
  
  const paymentBtn = document.getElementById('profile-payment-btn');
  if (paymentBtn) paymentBtn.addEventListener('click', () => showPaymentSection());
  
  const securityBtn = document.getElementById('profile-security-btn');
  if (securityBtn) securityBtn.addEventListener('click', () => showSecuritySection());
  
  const notificationsBtn = document.getElementById('profile-notifications-btn');
  if (notificationsBtn) notificationsBtn.addEventListener('click', () => showNotificationsSection());
  
  const wishlistBtn = document.getElementById('profile-wishlist-btn');
  if (wishlistBtn) wishlistBtn.addEventListener('click', () => showWishlistSection());
  
  const editAvatarBtn = document.getElementById('edit-avatar-btn');
  if (editAvatarBtn) editAvatarBtn.addEventListener('click', () => showAvatarUpload());
}

// ── Configurar eventos do usuário não logado ─────────────────────────
function setupLoggedOutEvents() {
  const loginForm = document.getElementById('profile-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin();
    });
  }
  
  const forgotLink = document.getElementById('forgot-password-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPassword();
    });
  }
  
  const createLink = document.getElementById('create-account-link');
  if (createLink) {
    createLink.addEventListener('click', (e) => {
      e.preventDefault();
      showCreateAccount();
    });
  }
  
  // Social login (simulação)
  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) googleBtn.addEventListener('click', () => socialLogin('google'));
  
  const facebookBtn = document.getElementById('facebook-login-btn');
  if (facebookBtn) facebookBtn.addEventListener('click', () => socialLogin('facebook'));
  
  const appleBtn = document.getElementById('apple-login-btn');
  if (appleBtn) appleBtn.addEventListener('click', () => socialLogin('apple'));
}

// ── Login manual ─────────────────────────────────────────────────────
function handleLogin() {
  const email = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;
  
  if (!email || !password) {
    showToast('Preencha todos os campos', 'error');
    return;
  }
  
  // Simulação de login (substituir por API real)
  setTimeout(() => {
    currentUser = {
      id: '123456',
      name: email.split('@')[0],
      email: email,
      verified: true,
      ordersCount: 3,
      reviewCount: 5,
      wishlistCount: 2,
      avatar: null,
      createdAt: new Date().toISOString()
    };
    
    isAuthenticated = true;
    saveUserToStorage();
    renderProfileContent();
    setupLoggedInEvents();
    showToast('Login realizado com sucesso!', 'success');
  }, 500);
}

// ── Logout ───────────────────────────────────────────────────────────
export function logout() {
  currentUser = null;
  isAuthenticated = false;
  saveUserToStorage();
  renderProfileContent();
  setupLoggedOutEvents();
  showToast('Você saiu da sua conta', 'info');
}

// ── Social login ─────────────────────────────────────────────────────
function socialLogin(provider) {
  showToast(`Login com ${provider} em desenvolvimento`, 'info');
}

// ── Mostrar seção de pedidos ─────────────────────────────────────────
function showOrdersSection() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="profile-section-header">
      <button class="back-btn" id="profile-back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3>Meus Pedidos</h3>
    </div>
    <div class="orders-list">
      ${renderOrdersList()}
    </div>
  `;
  
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderProfileContent());
  }
}

// ── Renderizar lista de pedidos ──────────────────────────────────────
function renderOrdersList() {
  const orders = currentUser?.orders || [
    {
      id: 'DOM-2024-001',
      date: '2024-12-15',
      total: 1299.90,
      status: 'delivered',
      items: 2
    },
    {
      id: 'DOM-2024-002',
      date: '2024-12-20',
      total: 3499.00,
      status: 'shipped',
      items: 1
    },
    {
      id: 'DOM-2024-003',
      date: '2024-12-25',
      total: 199.90,
      status: 'processing',
      items: 3
    }
  ];
  
  if (!orders || orders.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-shopping-bag"></i>
        <p>Nenhum pedido encontrado</p>
      </div>
    `;
  }
  
  return orders.map(order => `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-header">
        <span class="order-id">${order.id}</span>
        <span class="order-status status-${order.status}">
          ${getStatusText(order.status)}
        </span>
      </div>
      <div class="order-details">
        <span><i class="fas fa-calendar"></i> ${formatDate(order.date)}</span>
        <span><i class="fas fa-box"></i> ${order.items} itens</span>
        <span><i class="fas fa-money-bill"></i> ${formatCurrency(order.total)}</span>
      </div>
      <button class="order-details-btn" onclick="window.viewOrderDetails('${order.id}')">
        Ver Detalhes
      </button>
    </div>
  `).join('');
}

// ── Mostrar dados pessoais ───────────────────────────────────────────
function showPersonalDataSection() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="profile-section-header">
      <button class="back-btn" id="profile-back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3>Dados Pessoais</h3>
    </div>
    
    <form id="personal-data-form" class="profile-form">
      <div class="form-group">
        <label>Nome completo</label>
        <input type="text" id="user-name" value="${escapeHtml(currentUser?.name || '')}" placeholder="Seu nome completo">
      </div>
      
      <div class="form-group">
        <label>E-mail</label>
        <input type="email" id="user-email" value="${escapeHtml(currentUser?.email || '')}" placeholder="seu@email.com">
      </div>
      
      <div class="form-group">
        <label>Telefone</label>
        <input type="tel" id="user-phone" value="${currentUser?.phone || ''}" placeholder="(11) 99999-9999">
      </div>
      
      <div class="form-group">
        <label>Data de Nascimento</label>
        <input type="date" id="user-birthdate" value="${currentUser?.birthdate || ''}">
      </div>
      
      <button type="submit" class="btn-primary">
        <i class="fas fa-save"></i>
        Salvar Alterações
      </button>
    </form>
  `;
  
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderProfileContent());
  }
  
  const form = document.getElementById('personal-data-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      savePersonalData();
    });
  }
}

// ── Salvar dados pessoais ────────────────────────────────────────────
function savePersonalData() {
  const name = document.getElementById('user-name')?.value;
  const email = document.getElementById('user-email')?.value;
  const phone = document.getElementById('user-phone')?.value;
  const birthdate = document.getElementById('user-birthdate')?.value;
  
  if (currentUser) {
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;
    currentUser.birthdate = birthdate;
    saveUserToStorage();
    showToast('Dados salvos com sucesso!', 'success');
  }
}

// ── Mostrar endereços ────────────────────────────────────────────────
function showAddressSection() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  const addresses = currentUser?.addresses || [
    {
      id: 1,
      street: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zip: '01310-100',
      isDefault: true
    }
  ];
  
  content.innerHTML = `
    <div class="profile-section-header">
      <button class="back-btn" id="profile-back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3>Endereços</h3>
      <button class="add-btn" id="add-address-btn">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    
    <div class="addresses-list">
      ${addresses.map(addr => `
        <div class="address-card ${addr.isDefault ? 'default' : ''}">
          <div class="address-info">
            <p><strong>${addr.street}</strong></p>
            <p>${addr.city}, ${addr.state} - ${addr.zip}</p>
          </div>
          <div class="address-actions">
            ${addr.isDefault ? '<span class="default-badge">Principal</span>' : ''}
            <button class="edit-address-btn" data-id="${addr.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-address-btn" data-id="${addr.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderProfileContent());
  }
}

// ── Mostrar formas de pagamento ──────────────────────────────────────
function showPaymentSection() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="profile-section-header">
      <button class="back-btn" id="profile-back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3>Formas de Pagamento</h3>
      <button class="add-btn" id="add-payment-btn">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    
    <div class="payment-methods-list">
      <div class="payment-card">
        <i class="fab fa-cc-visa"></i>
        <div>
          <p>Visa •••• 4242</p>
          <span>Expira 12/2026</span>
        </div>
        <button class="delete-payment-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      
      <div class="payment-card">
        <i class="fab fa-cc-mastercard"></i>
        <div>
          <p>Mastercard •••• 5555</p>
          <span>Expira 08/2025</span>
        </div>
        <button class="delete-payment-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderProfileContent());
  }
}

// ── Mostrar segurança ────────────────────────────────────────────────
function showSecuritySection() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="profile-section-header">
      <button class="back-btn" id="profile-back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3>Segurança</h3>
    </div>
    
    <form id="security-form" class="profile-form">
      <div class="form-group">
        <label>Senha atual</label>
        <input type="password" id="current-password" placeholder="••••••••">
      </div>
      
      <div class="form-group">
        <label>Nova senha</label>
        <input type="password" id="new-password" placeholder="••••••••">
      </div>
      
      <div class="form-group">
        <label>Confirmar nova senha</label>
        <input type="password" id="confirm-password" placeholder="••••••••">
      </div>
      
      <div class="security-options">
        <label class="checkbox-label">
          <input type="checkbox" id="two-factor">
          <span>Ativar autenticação de dois fatores</span>
        </label>
        
        <label class="checkbox-label">
          <input type="checkbox" id="login-notify">
          <span>Notificar sobre novos logins</span>
        </label>
      </div>
      
      <button type="submit" class="btn-primary">
        <i class="fas fa-save"></i>
        Atualizar segurança
      </button>
    </form>
  `;
  
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderProfileContent());
  }
  
  const form = document.getElementById('security-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Configurações de segurança salvas', 'success');
    });
  }
}

// ── Mostrar notificações ─────────────────────────────────────────────
function showNotificationsSection() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="profile-section-header">
      <button class="back-btn" id="profile-back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3>Notificações</h3>
    </div>
    
    <div class="notifications-settings">
      <label class="toggle-label">
        <span>Notificações por e-mail</span>
        <label class="toggle">
          <input type="checkbox" id="email-notifications" checked>
          <span class="toggle-slider"></span>
        </label>
      </label>
      
      <label class="toggle-label">
        <span>Notificações de ofertas</span>
        <label class="toggle">
          <input type="checkbox" id="promo-notifications" checked>
          <span class="toggle-slider"></span>
        </label>
      </label>
      
      <label class="toggle-label">
        <span>Notificações de pedidos</span>
        <label class="toggle">
          <input type="checkbox" id="order-notifications" checked>
          <span class="toggle-slider"></span>
        </label>
      </label>
    </div>
  `;
  
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderProfileContent());
  }
}

// ── Mostrar lista de desejos ─────────────────────────────────────────
function showWishlistSection() {
  const content = document.getElementById('profile-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="profile-section-header">
      <button class="back-btn" id="profile-back-btn">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h3>Lista de Desejos</h3>
    </div>
    
    <div class="wishlist-grid">
      <div class="empty-state">
        <i class="fas fa-heart"></i>
        <p>Sua lista de desejos está vazia</p>
        <button class="btn-primary" onclick="window.dom?.route('products')">
          Explorar produtos
        </button>
      </div>
    </div>
  `;
  
  const backBtn = document.getElementById('profile-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderProfileContent());
  }
}

// ── Mostrar avatar upload ────────────────────────────────────────────
function showAvatarUpload() {
  showToast('Upload de avatar em desenvolvimento', 'info');
}

// ── Mostrar forgot password ──────────────────────────────────────────
function showForgotPassword() {
  showToast('Recuperação de senha em desenvolvimento', 'info');
}

// ── Mostrar create account ───────────────────────────────────────────
function showCreateAccount() {
  showToast('Criação de conta em desenvolvimento', 'info');
}

// ── Utilitário: Formatar data ────────────────────────────────────────
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// ── Utilitário: Formatar moeda ───────────────────────────────────────
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// ── Utilitário: Escape HTML ──────────────────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Utilitário: Status text ──────────────────────────────────────────
function getStatusText(status) {
  const statusMap = {
    'delivered': 'Entregue',
    'shipped': 'Enviado',
    'processing': 'Processando',
    'cancelled': 'Cancelado'
  };
  return statusMap[status] || status;
}

// ── Utilitário: Show toast ───────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#dc2626' : '#3b82f6'};
    color: white;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease;
  `;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Expor funções globalmente ────────────────────────────────────────
export function setupProfileGlobals() {
  window.openProfile = () => openProfile();
  window.closeProfile = () => closeProfile();
  window.viewOrderDetails = (orderId) => {
    showToast(`Detalhes do pedido ${orderId} em breve`, 'info');
  };
}

// Adicionar estilos CSS
const profileStyles = document.createElement('style');
profileStyles.textContent = `
  #profile-sidebar {
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  #profile-sidebar.active {
    transform: translateX(0);
  }
  
  #profile-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 998;
    display: none;
  }
  
  .profile-user-header {
    text-align: center;
    padding: 24px;
    border-bottom: 1px solid var(--border);
  }
  
  .profile-avatar {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
  }
  
  .profile-avatar img,
  .avatar-placeholder {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar-placeholder i {
    font-size: 48px;
    color: white;
  }
  
  .edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .profile-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    margin-top: 8px;
  }
  
  .profile-badge.verified {
    background: #10b98120;
    color: #10b981;
  }
  
  .profile-badge.unverified {
    background: #f59e0b20;
    color: #f59e0b;
  }
  
  .profile-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 20px;
    background: var(--bg-secondary);
    margin: 16px;
    border-radius: 12px;
  }
  
  .stat-card {
    text-align: center;
  }
  
  .stat-card i {
    font-size: 24px;
    color: var(--primary);
    margin-bottom: 8px;
  }
  
  .stat-value {
    display: block;
    font-size: 20px;
    font-weight: bold;
  }
  
  .stat-label {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .profile-menu {
    padding: 0 16px;
  }
  
  .profile-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    width: 100%;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    color: var(--text);
  }
  
  .profile-menu-item span {
    flex: 1;
    text-align: left;
  }
  
  .profile-menu-item:hover {
    background: var(--bg-secondary);
  }
  
  .profile-footer {
    padding: 20px;
    border-top: 1px solid var(--border);
    margin-top: 20px;
  }
  
  .btn-logout {
    width: 100%;
    padding: 12px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .profile-login-view {
    padding: 24px;
    text-align: center;
  }
  
  .profile-login-icon i {
    font-size: 80px;
    color: var(--primary);
    margin-bottom: 16px;
  }
  
  .profile-login-form {
    margin-top: 24px;
  }
  
  .form-group {
    margin-bottom: 16px;
    text-align: left;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg-secondary);
    color: var(--text);
  }
  
  .btn-login {
    width: 100%;
    margin-top: 16px;
  }
  
  .profile-links {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
  }
  
  .profile-links a {
    color: var(--primary);
    text-decoration: none;
    font-size: 14px;
  }
  
  .social-login {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }
  
  .social-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 12px;
  }
  
  .social-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg-secondary);
    cursor: pointer;
  }
  
  .profile-section-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  
  .back-btn, .add-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: var(--text);
  }
  
  .add-btn {
    margin-left: auto;
  }
  
  .order-card {
    padding: 16px;
    margin: 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .order-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .status-delivered { background: #10b98120; color: #10b981; }
  .status-shipped { background: #3b82f620; color: #3b82f6; }
  .status-processing { background: #f59e0b20; color: #f59e0b; }
  
  .order-details {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }
  
  .order-details-btn {
    width: 100%;
    padding: 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
  }
  
  .address-card, .payment-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    margin: 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  
  .address-card.default {
    border-color: var(--primary);
    background: var(--primary)10;
  }
  
  .default-badge {
    background: var(--primary);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
  }
  
  .toggle-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  
  .toggle {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
  }
  
  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 34px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
  
  input:checked + .toggle-slider {
    background-color: var(--primary);
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }
  
  .empty-state i {
    font-size: 64px;
    color: var(--text-secondary);
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;

document.head.appendChild(profileStyles);