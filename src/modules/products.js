// src/modules/products.js — Módulo de Produtos integrado ao SupabaseManager
'use strict';

let allProducts = []; // fonte de verdade local

// ── Aguarda o SupabaseManager estar pronto ─────────────────
async function waitForSupabase(retries = 20) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const check = () => {
      if (window.supabaseManager?.isConnected?.()) {
        resolve(window.supabaseManager);
      } else if (++count >= retries) {
        reject(new Error('SupabaseManager não ficou disponível.'));
      } else {
        setTimeout(check, 300);
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
    const data = await manager.getProdutos();
    allProducts = data || [];
    renderProducts(allProducts);
  } catch (err) {
    console.error('❌ loadProducts:', err);
    showError('Erro ao carregar produtos. Verifique sua conexão.');
  }
}

// ── Renderiza lista de produtos ────────────────────────────
export function renderProducts(list) {
  const container = document.getElementById('products-list');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="products-loading">
        <p>😕 Nenhum produto encontrado.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map((p, index) => {
    const price   = Number(p.price ?? p.preco ?? 0).toFixed(2).replace('.', ',');
    const image   = p.image_url || p.imagem_url || p.image || 'https://placehold.co/400x400/1e293b/38bdf8?text=DOM';
    const name    = p.name || p.nome || 'Produto';
    const id      = p.id;

    return `
      <div class="product-card" data-id="${id}" style="animation-delay: ${index * 0.05}s">
        <img src="${image}" alt="${name}" loading="lazy" onerror="this.onerror=null; this.src='https://placehold.co/400x400/1e293b/38bdf8?text=DOM'">
        <div class="product-card-body">
          <h3 class="product-card-name">${name}</h3>
          <span class="product-card-price">R$ ${price}</span>
          <button class="add-cart-btn" data-id="${id}" data-name="${name}" data-price="${p.price ?? p.preco ?? 0}" data-image="${image}">
            Adicionar
          </button>
        </div>
      </div>`;
  }).join('');
}

// ── Busca por texto ────────────────────────────────────────
export function searchProducts(term) {
  const t = (term || '').toLowerCase().trim();
  if (!t) { renderProducts(allProducts); return; }
  renderProducts(allProducts.filter(p =>
    (p.name || p.nome || '').toLowerCase().includes(t)
  ));
}

// ── Filtro por categoria ────────────────────────────────────
export function filterByCategory(cat) {
  const title = document.getElementById('products-title');
  if (!cat) {
    if (title) title.textContent = 'Produtos';
    renderProducts(allProducts);
    return;
  }
  if (title) title.textContent = cat;
  renderProducts(allProducts.filter(p =>
    (p.categoria || p.category || '').toLowerCase() === cat.toLowerCase()
  ));
}

// ── Ordenação ──────────────────────────────────────────────
export function sortProducts(type) {
  const sorted = [...allProducts];
  if (type === 'price-asc')  sorted.sort((a, b) => (a.price ?? a.preco ?? 0) - (b.price ?? b.preco ?? 0));
  if (type === 'price-desc') sorted.sort((a, b) => (b.price ?? b.preco ?? 0) - (a.price ?? a.preco ?? 0));
  renderProducts(sorted);
}

// ── Retorna todos os produtos (para o carrinho) ────────────
export function getProducts() { return allProducts; }

// ── Helpers de UI ──────────────────────────────────────────
function showLoading() {
  const c = document.getElementById('products-list');
  if (c) c.innerHTML = `<div class="products-loading"><div class="spinner"></div><p>Carregando produtos...</p></div>`;
}

function showError(msg) {
  const c = document.getElementById('products-list');
  if (c) c.innerHTML = `<div class="products-loading"><p>❌ ${msg}</p></div>`;
}