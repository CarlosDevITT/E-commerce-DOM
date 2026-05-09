// src/app.js — Inicializador e gerenciador de rotas
‘use strict’;

import { initAuth, logout } from ‘./modules/auth.js’;
import { initProducts, loadProducts, searchProducts, sortProducts, filterByCategory } from ‘./modules/products.js’;
import { initCart, addToCart, removeFromCart, updateCartQty, clearCart } from ‘./modules/cart.js’;
import { initChat } from ‘./modules/chat.js’;
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
  console.log('🚀 Inicializando DOM E-commerce...');

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

  // 7. Carregar produtos na Home
  await this.route('home');
  console.log('✅ Rota Home carregada');

  this.initialized = true;
  console.log('✅ DOM E-commerce iniciado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao inicializar app:', error);
  this.showError('Erro ao inicializar aplicação');
}
```

},

// ── Sistema de Rotas ───────────────────────────────────────────
async route(routeName) {
try {
console.log(`📍 Navegando para: ${routeName}`);
this.currentRoute = routeName;

```
  // Fechar sidebars abertas
  this.closeSidebars();

  switch (routeName) {
    case 'home':
      await this.loadHome();
      break;
    case 'products':
      await this.loadProducts();
      break;
    case 'cart':
      await this.loadCart();
      break;
    case 'profile':
      await this.loadProfile();
      break;
    case 'orders':
      await this.loadOrders();
      break;
    default:
      console.warn(`⚠️ Rota desconhecida: ${routeName}`);
      await this.loadHome();
  }

  // Scrollar para topo
  window.scrollTo(0, 0);
} catch (error) {
  console.error(`❌ Erro ao navegar para ${routeName}:`, error);
  this.showError(`Erro ao carregar ${routeName}`);
}
```

},

async loadHome() {
const main = document.querySelector(‘main’) || document.getElementById(‘app’);
if (!main) return;

```
main.innerHTML = `
  <div class="home-section">
    <h1>Bem-vinda à DOM</h1>
    <div id="products-list" class="products-grid"></div>
  </div>
`;
await loadProducts();
```

},

async loadProducts() {
const main = document.querySelector(‘main’) || document.getElementById(‘app’);
if (!main) return;

```
main.innerHTML = `
  <div class="products-section">
    <div class="products-header">
      <h1>Produtos</h1>
      <div class="products-controls">
        <input type="text" id="search-input" placeholder="Buscar produtos...">
        <select id="sort">
          <option value="">Ordenar por</option>
          <option value="price-asc">Preço: menor</option>
          <option value="price-desc">Preço: maior</option>
          <option value="name">Nome</option>
        </select>
      </div>
    </div>
    <div id="products-list" class="products-grid"></div>
  </div>
`;
await loadProducts();
this.setupSearch();
this.setupSort();
```

},

async loadCart() {
const main = document.querySelector(‘main’) || document.getElementById(‘app’);
if (!main) return;

```
main.innerHTML = `
  <div class="cart-section">
    <h1>Meu Carrinho</h1>
    <div id="cart-items"></div>
    <div class="cart-summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span id="cart-subtotal-val">R$ 0,00</span>
      </div>
      <div class="summary-row">
        <span>Total:</span>
        <strong id="cart-total-val">R$ 0,00</strong>
      </div>
      <button id="checkout-button" class="btn-primary">
        <span>Finalizar Pedido</span>
      </button>
      <button id="cart-clear-btn" class="btn-secondary">Limpar Carrinho</button>
    </div>
  </div>
`;
this.setupCartUI();
```

},

async loadProfile() {
const main = document.querySelector(‘main’) || document.getElementById(‘app’);
if (!main) return;

```
main.innerHTML = `
  <div class="profile-section">
    <h1>Meu Perfil</h1>
    <div id="profile-content"></div>
  </div>
`;
```

},

async loadOrders() {
const main = document.querySelector(‘main’) || document.getElementById(‘app’);
if (!main) return;

```
main.innerHTML = `
  <div class="orders-section">
    <h1>Meus Pedidos</h1>
    <div id="orders-content"></div>
  </div>
`;
```

},

// ── Helpers UI ─────────────────────────────────────────────────
setupSearch() {
const input = document.getElementById(‘search-input’);
if (!input) return;

```
let timer;
input.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => searchProducts(input.value), 300);
});
```

},

setupSort() {
const sort = document.getElementById(‘sort’);
if (!sort) return;

```
sort.addEventListener('change', () => {
  const value = sort.value;
  if (value) sortProducts(value);
});
```

},

setupCartUI() {
const clearBtn = document.getElementById(‘cart-clear-btn’);
const checkoutBtn = document.getElementById(‘checkout-button’);

```
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (confirm('Limpar carrinho?')) {
      clearCart();
      this.loadCart();
    }
  });
}

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    this.checkout();
  });
}
```

},

async checkout() {
// TODO: Implementar lógica de checkout
console.log(‘💳 Checkout iniciado’);
alert(‘Funcionalidade em desenvolvimento’);
},

closeSidebars() {
const sidebars = document.querySelectorAll(’[data-sidebar]’);
sidebars.forEach(sb => closeSidebar(sb.id));
},

showError(message) {
const toast = document.createElement(‘div’);
toast.className = ‘toast error’;
toast.textContent = message;
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
cartAdd: (product) => addToCart(product),
cartRemove: (id) => removeFromCart(id),
cartAddQty: (id) => updateCartQty(id, 1),
cartRemoveQty: (id) => updateCartQty(id, -1),
clearCart: () => clearCart(),

// Produtos
filterCategory: (cat) => filterByCategory(cat),
search: (term) => searchProducts(term),

// Auth
logout: () => logout(),

// Inicialização
init: () => app.init(),
};

// ── Inicializar quando DOM estiver pronto ──────────────────────────
if (document.readyState === ‘loading’) {
document.addEventListener(‘DOMContentLoaded’, () => app.init());
} else {
app.init();
}
