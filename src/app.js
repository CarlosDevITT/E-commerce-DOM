
// src/app.js — Inicializador e gerenciador de rotas
‘use strict’;

import { initAuth, logout } from ‘./modules/auth.js’;
import { initProducts, loadProducts, searchProducts, sortProducts, filterByCategory } from ‘./modules/products.js’;
import { initCart, addToCart, removeFromCart, updateCartQty, clearCart } from ‘./modules/cart.js’;
import { initChat, openChat, closeChat } from ‘./modules/chat.js’;
import { initUI, openSidebar, closeSidebar, toggleSidebar } from ‘./modules/ui.js’;
import { initPWA } from ‘./modules/pwa_handler.js’;

// ── Rotas e Estados Globais ────────────────────────────────────────
const app = {
currentRoute: ‘home’,
modules: {},
initialized: false,

// ── Inicializar todos os módulos ────────────────────────────────
async init() {
if (this.initialized) return;

```
try {
  console.log('🚀 Inicializando DOM E-commerce de Eletrônicos...');

  // 1. Inicializar PWA
  await initPWA();
  console.log('✅ PWA inicializado');

  // 2. Inicializar Autenticação
  await initAuth();
  console.log('✅ Autenticação inicializada');

  // 3. Inicializar UI
  await initUI();
  console.log('✅ UI inicializada');

  // 4. Inicializar Carrinho
  await initCart();
  console.log('✅ Carrinho inicializado');

  // 5. Inicializar Chat IA
  await initChat();
  console.log('✅ Chat IA inicializado');

  // 6. Inicializar Produtos
  await initProducts();
  console.log('✅ Produtos inicializados');

  // 7. Setup handlers
  this.setupHandlers();
  console.log('✅ Handlers configurados');

  // 8. Carregar produtos na Home
  await this.route('home');
  console.log('✅ Rota Home carregada');

  this.initialized = true;
  console.log('✅ DOM Eletrônicos iniciado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao inicializar app:', error);
  this.showError('Erro ao inicializar aplicação');
}
```

},

setupHandlers() {
// Menu hamburguer
const menuBtn = document.getElementById(‘menu-btn’);
const closeMenuBtn = document.getElementById(‘close-menu-btn’);
const mobileOverlay = document.getElementById(‘mobile-overlay’);

```
if (menuBtn) {
  menuBtn.addEventListener('click', () => openSidebar('mobile-sidebar'));
}
if (closeMenuBtn) {
  closeMenuBtn.addEventListener('click', () => closeSidebar('mobile-sidebar'));
}
if (mobileOverlay) {
  mobileOverlay.addEventListener('click', () => closeSidebar('mobile-sidebar'));
}

// Carrinho
const cartBtn = document.getElementById('cart-button-header');
const closeCart = document.getElementById('close-cart');
const cartOverlay = document.getElementById('cart-overlay');

if (cartBtn) {
  cartBtn.addEventListener('click', () => openSidebar('cart-sidebar'));
}
if (closeCart) {
  closeCart.addEventListener('click', () => closeSidebar('cart-sidebar'));
}
if (cartOverlay) {
  cartOverlay.addEventListener('click', () => closeSidebar('cart-sidebar'));
}

// Search
const searchInput = document.getElementById('search-input');
if (searchInput) {
  let timer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => searchProducts(e.target.value), 300);
  });
}

// Sort
const sortToolbar = document.getElementById('sort-toolbar');
if (sortToolbar) {
  sortToolbar.addEventListener('change', (e) => {
    if (e.target.value) sortProducts(e.target.value);
  });
}

// Clear cart
const clearBtn = document.getElementById('cart-clear-btn');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar o carrinho?')) {
      clearCart();
    }
  });
}

// Checkout
const checkoutBtn = document.getElementById('checkout-button');
if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => this.checkout());
}
```

},

// ── Sistema de Rotas ───────────────────────────────────────────
async route(routeName) {
try {
console.log(`📍 Navegando para: ${routeName}`);
this.currentRoute = routeName;

```
  // Fechar sidebars
  this.closeSidebars();

  switch (routeName) {
    case 'home':
      await this.loadHome();
      break;
    case 'products':
      await this.loadProducts();
      break;
    case 'cart':
      openSidebar('cart-sidebar');
      break;
    case 'profile':
      await this.loadProfile();
      break;
    case 'orders':
      await this.loadOrders();
      break;
    case 'about':
      document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'contact':
      openChat();
      break;
    default:
      console.warn(`⚠️ Rota desconhecida: ${routeName}`);
      await this.loadHome();
  }

  // Scroll para topo
  window.scrollTo(0, 0);
} catch (error) {
  console.error(`❌ Erro ao navegar para ${routeName}:`, error);
  this.showError(`Erro ao carregar ${routeName}`);
}
```

},

async loadHome() {
const main = document.getElementById(‘main-content’);
if (!main) return;

```
// Renderizar todos os produtos na home
await loadProducts();
```

},

async loadProducts() {
const main = document.getElementById(‘main-content’);
if (!main) return;

```
// Se já existe a seção, apenas recarrega os produtos
await loadProducts();
```

},

async loadProfile() {
console.log(‘📄 Carregando perfil…’);
// TODO: Implementar lógica de perfil
this.showError(‘Função em desenvolvimento’);
},

async loadOrders() {
console.log(‘📦 Carregando pedidos…’);
// TODO: Implementar lógica de pedidos
this.showError(‘Função em desenvolvimento’);
},

async checkout() {
console.log(‘💳 Checkout iniciado’);
this.showError(‘Função em desenvolvimento’);
},

closeSidebars() {
closeSidebar(‘mobile-sidebar’);
closeSidebar(‘cart-sidebar’);
},

showError(message) {
const toast = document.createElement(‘div’);
toast.className = ‘toast toast-error’;
toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
document.body.appendChild(toast);

```
setTimeout(() => toast.remove(), 4000);
```

},

showSuccess(message) {
const toast = document.createElement(‘div’);
toast.className = ‘toast toast-success’;
toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
document.body.appendChild(toast);

```
setTimeout(() => toast.remove(), 3000);
```

},
};

// ── Expor funções globais para HTML (onclick, etc.) ────────────────
window.dom = {
// Rotas
route: (name) => app.route(name),

// Sidebars
openSidebar: (id) => openSidebar(id),
closeSidebar: (id) => closeSidebar(id),
toggleSidebar: (id) => toggleSidebar(id),

// Carrinho
cartAdd: (product) => {
addToCart(product);
app.showSuccess(‘Produto adicionado ao carrinho!’);
},
cartRemove: (id) => removeFromCart(id),
cartAddQty: (id) => updateCartQty(id, 1),
cartRemoveQty: (id) => updateCartQty(id, -1),
clearCart: () => clearCart(),

// Produtos
filterCategory: (cat) => filterByCategory(cat),
search: (term) => searchProducts(term),

// Chat
openChat: () => openChat(),
closeChat: () => closeChat(),

// Auth
logout: () => logout(),

// App
init: () => app.init(),
};

// ── Inicializar quando DOM estiver pronto ──────────────────────────
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, () => app.init());
} else {
app.init();
}

// Service Worker
if (‘serviceWorker’ in navigator) {
navigator.serviceWorker.register(’./sw.js’).catch(err => console.warn(‘SW erro:’, err));
}
