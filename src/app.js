// src/app.js — Inicializador principal DOM E-commerce
'use strict';

import { loadProducts, searchProducts, sortProducts, filterByCategory, getProducts } from './modules/products.js';
import { initChatWidget } from './modules/chat.js';

// ── Namespace global para acesso externo (sidebar, onclick, etc.) ──
window.dom = {
  filterCategory: filterByCategory,
  search: searchProducts,
  
  // Módulos
  openChat: () => initChatWidget(),
  openProfile: () => {
    document.getElementById('profile-sidebar')?.classList.add('active');
    document.getElementById('profile-overlay')?.classList.add('active');
    document.body.classList.add('no-scroll');
  },
  closeProfile: () => {
    document.getElementById('profile-sidebar')?.classList.remove('active');
    document.getElementById('profile-overlay')?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  },
  openOrders: () => {
    document.getElementById('orders-sidebar')?.classList.add('active');
    document.getElementById('orders-overlay')?.classList.add('active');
    document.body.classList.add('no-scroll');
  },
  closeOrders: () => {
    document.getElementById('orders-sidebar')?.classList.remove('active');
    document.getElementById('orders-overlay')?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
};

// ── Carrinho simples integrado ─────────────────────────────────────
const cart = {
  items: [],

  load() {
    try {
      const saved = localStorage.getItem('dom_cart');
      if (saved) this.items = JSON.parse(saved);
    } catch {}
    this.render();
  },

  save() {
    localStorage.setItem('dom_cart', JSON.stringify(this.items));
  },

  add(product) {
    const existing = this.items.find(i => String(i.id) === String(product.id));
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.save();
    this.render();
    this.animateBadge();
  },

  remove(id) {
    this.items = this.items.filter(i => String(i.id) !== String(id));
    this.save();
    this.render();
  },

  updateQty(id, delta) {
    const item = this.items.find(i => String(i.id) === String(id));
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) this.remove(id);
    else { this.save(); this.render(); }
  },

  totalCount() {
    return this.items.reduce((s, i) => s + i.quantity, 0);
  },

  totalPrice() {
    return this.items.reduce((s, i) => s + (i.price * i.quantity), 0);
  },

  animateBadge() {
    const badge = document.getElementById('cart-count-header');
    if (!badge) return;
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => { badge.style.transform = ''; }, 200);
  },

  render() {
    const count = this.totalCount();
    const total = this.totalPrice();

    // Badge no header
    if (typeof window.updateCartBadge === 'function') {
      window.updateCartBadge(count);
    }

    // Subtotal + Total
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const totalEl    = document.getElementById('cart-total-val');
    const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;
    if (subtotalEl) subtotalEl.textContent = fmt(total);
    if (totalEl)    totalEl.textContent    = fmt(total);

    // Hint de parcelamento (crédito)
    if (typeof window.updateParcelHint === 'function') {
      window.updateParcelHint(total);
    }

    // Botão de checkout
    const checkoutBtn = document.getElementById('checkout-button');
    if (checkoutBtn) {
      checkoutBtn.disabled = this.items.length === 0;
      const span = checkoutBtn.querySelector('span');
      if (span) {
        span.textContent = this.items.length === 0
          ? 'Carrinho vazio'
          : `Finalizar Pedido — ${fmt(total)}`;
      }
    }

    // Renderiza itens
    const cartItemsEl = document.getElementById('cart-items');
    if (!cartItemsEl) return;

    if (this.items.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="cart-empty" style="text-align:center;padding:48px 16px;color:#94a3b8">
          <i class="fas fa-box-open" style="font-size:40px;margin-bottom:12px;display:block"></i>
          <p style="font-weight:700;color:#475569">Seu carrinho está vazio</p>
          <p style="font-size:13px;margin-top:6px">Adicione produtos para continuar</p>
        </div>`;
      return;
    }

    cartItemsEl.innerHTML = this.items.map(item => `
      <div class="cart-item-premium">
        <div class="cart-item-img-wrap">
          <img src="${item.image || 'https://placehold.co/400x400/1e293b/38bdf8?text=DOM'}" alt="${item.name}" onerror="this.onerror=null; this.src='https://placehold.co/400x400/1e293b/38bdf8?text=DOM'">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <span class="cart-item-price-unit">R$ ${Number(item.price).toFixed(2).replace('.', ',')}</span>
          <div class="cart-item-qty-row">
            <button onclick="window.dom.cartRemoveQty('${item.id}')" class="qty-btn-mini">−</button>
            <span class="qty-val-mini">${item.quantity}</span>
            <button onclick="window.dom.cartAddQty('${item.id}')" class="qty-btn-mini">+</button>
          </div>
        </div>
        <div class="cart-item-end">
          <strong class="cart-item-subtotal">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</strong>
          <button onclick="window.dom.cartRemove('${item.id}')" class="cart-remove-btn">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>`).join('');
  }
};

// Expõe funções do carrinho globalmente
window.dom.cartAdd      = (product) => cart.add(product);
window.dom.cartRemove   = (id)      => cart.remove(id);
window.dom.cartAddQty   = (id)      => cart.updateQty(id, +1);
window.dom.cartRemoveQty= (id)      => cart.updateQty(id, -1);

// ── Event Delegation para botões "Adicionar" ───────────────────────
function setupProductClickHandler() {
  const grid = document.getElementById('products-list');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-cart-btn');
    if (!btn) return;

    const product = {
      id:    btn.dataset.id,
      name:  btn.dataset.name,
      price: parseFloat(btn.dataset.price),
      image: btn.dataset.image,
    };

    cart.add(product);

    // Abrir carrinho automaticamente
    if (typeof window.domHeader?.openCart === 'function') {
      window.domHeader.openCart();
    }

    // Feedback visual no botão
    btn.textContent = '✓ Adicionado';
    btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    setTimeout(() => {
      btn.textContent = 'Adicionar';
      btn.style.background = '';
    }, 1200);
  });
}

// ── Busca ──────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => searchProducts(input.value), 300);
  });
}

// ── Sort ───────────────────────────────────────────────────────────
function setupSort() {
  const sort = document.getElementById('sort');
  if (!sort) return;
  sort.addEventListener('change', () => sortProducts(sort.value));
}

// ── Inicialização ──────────────────────────────────────────────────
async function init() {
  cart.load();
  setupProductClickHandler();
  setupSearch();
  setupSort();

  // Botão Limpar Carrinho
  document.getElementById('cart-clear-btn')?.addEventListener('click', () => {
    cart.items = [];
    cart.save();
    cart.render();
  });

  await loadProducts();
  console.log('✅ DOM E-commerce iniciado');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
