// src/modules/products.js — Módulo de Produtos integrado ao SupabaseManager
'use strict';

let allProducts = []; // fonte de verdade local
let currentPage = 0;
const PRODUCTS_PER_PAGE = 12; // Carrega 12 por vez
const MAX_CACHE_PRODUCTS = 500; // Evita cachear datasets muito grandes
const RENDER_CHUNK_DELAY = 80;

let pendingRenderHandle = null;
let pendingRenderState = null;
let searchTimeout = null;

// ── Aguarda o SupabaseManager estar pronto ─────────────────
async function waitForSupabase(retries = 50) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const check = () => {
      if (window.supabaseManager?.isConnected?.()) {
        resolve(window.supabaseManager);
      } else if (++count >= retries) {
        reject(new Error('SupabaseManager não ficou disponível após ' + retries + ' tentativas.'));
      } else {
        const delay = Math.min(100 + (count * 20), 500);
        setTimeout(check, delay);
      }
    };
    check();
  });
}

// ── Carrega produtos do Supabase ───────────────────────────
export async function loadProducts() {
  showLoading();
  try {
    const manager = await waitForSupabase();
    const data = await Promise.race([
      manager.getProdutos(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout carregando produtos')), 3000)
      )
    ]);
    allProducts = data || [];
    currentPage = 0;
    renderProductsChunked(allProducts);
    if (allProducts.length === 0) {
      console.warn('⚠️ Nenhum produto carregado do Supabase');
    }
  } catch (err) {
    console.error('❌ loadProducts:', err);
    try {
      const cached = localStorage.getItem('products_cache');
      if (cached) {
        allProducts = JSON.parse(cached);
        currentPage = 0;
        renderProductsChunked(allProducts);
        showError('Usando dados em cache. Verifique sua conexão.');
        return;
      }
    } catch (cacheErr) {
      console.error('Erro ao carregar cache:', cacheErr);
    }
    showError('Erro ao carregar produtos. Verifique sua conexão.');
  }
}

// ── Renderiza produtos em chunks para não travar ─────────────────────────
export function renderProductsChunked(list) {
  const container = document.getElementById('products-list');
  if (!container) return;

  cancelPendingRender();

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="products-loading">
        <p>😕 Nenhum produto encontrado.</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  currentPage = 0;
  renderPageChunk(list, container, 0);

  if (list.length > PRODUCTS_PER_PAGE) {
    pendingRenderState = { list, container, nextPage: 1 };
    queueRenderChunks();
  } else {
    cacheProducts(list);
  }
}

function cancelPendingRender() {
  if (pendingRenderHandle != null) {
    if (window.cancelIdleCallback && pendingRenderHandle.type === 'idle') {
      window.cancelIdleCallback(pendingRenderHandle.id);
    } else {
      clearTimeout(pendingRenderHandle.id);
    }
  }
  pendingRenderHandle = null;
  pendingRenderState = null;
}

function queueRenderChunks() {
  if (!pendingRenderState) return;

  const schedule = () => {
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(processRenderChunks, { timeout: 300 });
      pendingRenderHandle = { type: 'idle', id };
    } else {
      const id = window.setTimeout(processRenderChunks, RENDER_CHUNK_DELAY);
      pendingRenderHandle = { type: 'timeout', id };
    }
  };
  schedule();
}

function processRenderChunks(deadline) {
  if (!pendingRenderState) return;

  const { list, container } = pendingRenderState;
  let { nextPage } = pendingRenderState;
  const totalPages = Math.ceil(list.length / PRODUCTS_PER_PAGE);

  while (nextPage < totalPages) {
    renderPageChunk(list, container, nextPage);
    nextPage += 1;
    if (deadline && deadline.timeRemaining && deadline.timeRemaining() < 10) {
      break;
    }
    if (!deadline) {
      break;
    }
  }

  pendingRenderState.nextPage = nextPage;

  if (nextPage < totalPages) {
    queueRenderChunks();
  } else {
    cacheProducts(list);
  }
}

function cacheProducts(list) {
  try {
    if (list.length <= MAX_CACHE_PRODUCTS) {
      localStorage.setItem('products_cache', JSON.stringify(list));
    } else {
      localStorage.removeItem('products_cache');
    }
  } catch (e) {
    console.warn('Erro ao cachear produtos:', e);
  }
}

// ── Renderiza um chunk de produtos usando DocumentFragment ────────────────
function renderPageChunk(list, container, pageIndex) {
  const fragment = document.createDocumentFragment();
  const start = pageIndex * PRODUCTS_PER_PAGE;
  const end = Math.min(start + PRODUCTS_PER_PAGE, list.length);
  
  for (let i = start; i < end; i++) {
    const p = list[i];
    const price = Number(p.price ?? p.preco ?? 0).toFixed(2).replace('.', ',');
    const image = p.image_url || p.imagem_url || p.image || 'https://placehold.co/400x400/1e293b/38bdf8?text=DOM';
    const name = p.name || p.nome || 'Produto';
    const id = p.id;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', id);
    
    const img = document.createElement('img');
    img.src = image;
    img.alt = name;
    img.loading = 'lazy';
    img.onerror = function() { this.src = 'https://placehold.co/400x400/1e293b/38bdf8?text=DOM'; };
    
    const body = document.createElement('div');
    body.className = 'product-card-body';
    
    const titleEl = document.createElement('h3');
    titleEl.className = 'product-card-name';
    titleEl.textContent = name;
    
    const priceEl = document.createElement('span');
    priceEl.className = 'product-card-price';
    priceEl.textContent = 'R$ ' + price;
    
    const btn = document.createElement('button');
    btn.className = 'add-cart-btn';
    btn.setAttribute('data-id', id);
    btn.setAttribute('data-name', name);
    btn.setAttribute('data-price', p.price ?? p.preco ?? 0);
    btn.setAttribute('data-image', image);
    btn.textContent = 'Adicionar';
    
    body.appendChild(titleEl);
    body.appendChild(priceEl);
    body.appendChild(btn);
    card.appendChild(img);
    card.appendChild(body);
    fragment.appendChild(card);
  }
  
  container.appendChild(fragment);
}

// ── Renderiza lista de produtos (fallback) ────────────────────────────
export function renderProducts(list) {
  renderProductsChunked(list);
}

// ── Busca por texto ────────────────────────────────────────
export function searchProducts(term) {
  const t = String(term || '').toLowerCase().trim();
  clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    if (!t) {
      renderProductsChunked(allProducts);
      return;
    }
    renderProductsChunked(allProducts.filter(p =>
      (p.name || p.nome || '').toLowerCase().includes(t)
    ));
  }, 150);
}

// ── Filtro por categoria ────────────────────────────────────
export function filterByCategory(cat) {
  const title = document.getElementById('products-title');
  if (!cat) {
    if (title) title.textContent = 'Produtos';
    renderProductsChunked(allProducts);
    return;
  }
  if (title) title.textContent = cat;
  renderProductsChunked(allProducts.filter(p =>
    (p.categoria || p.category || '').toLowerCase() === cat.toLowerCase()
  ));
}

// ── Ordenação ──────────────────────────────────────────────
export function sortProducts(type) {
  const sorted = [...allProducts];
  if (type === 'price-asc')  sorted.sort((a, b) => (a.price ?? a.preco ?? 0) - (b.price ?? b.preco ?? 0));
  if (type === 'price-desc') sorted.sort((a, b) => (b.price ?? b.preco ?? 0) - (a.price ?? a.preco ?? 0));
  renderProductsChunked(sorted);
}

// ── Retorna todos os produtos (para o carrinho) ────────────
export function getProducts() { return allProducts; }

// ── Inicialização do módulo ───────────────────────────────
export async function initProducts() {
  console.log('🔧 Inicializando módulo de produtos...');
  
  // Adicionar listeners aos botões de adicionar
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-cart-btn')) {
      const productId = e.target.getAttribute('data-id');
      const productName = e.target.getAttribute('data-name');
      const productPrice = e.target.getAttribute('data-price');
      const productImage = e.target.getAttribute('data-image');
      
      if (typeof window.dom?.cartAdd === 'function') {
        window.dom.cartAdd({
          id: productId,
          name: productName,
          price: productPrice,
          image_url: productImage
        });
      }
    }
  });
  
  return true;
}

// ── Helpers de UI ──────────────────────────────────────────
function showLoading() {
  const c = document.getElementById('products-list');
  if (c) c.innerHTML = `<div class="products-loading"><div class="spinner"></div><p>Carregando produtos...</p></div>`;
}

function showError(msg) {
  const c = document.getElementById('products-list');
  if (c) c.innerHTML = `<div class="products-loading"><p>❌ ${msg}</p></div>`;
}