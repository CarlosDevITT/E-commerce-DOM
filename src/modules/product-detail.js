// src/modules/product-detail.js - Sidebar de detalhes do produto
'use strict';

let currentProduct = null;
let currentQty = 1;

export function initProductDetail() {
  // Listener para cliques nos cards de produto
  document.addEventListener('click', handleProductCardClick);
  
  // Listener para botão de fechar
  const closeBtn = document.getElementById('close-product-detail');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeProductDetail());
  }
  
  // Listener para overlay
  const overlay = document.getElementById('product-detail-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => closeProductDetail());
  }
}

function handleProductCardClick(e) {
  const card = e.target.closest('.product-card');
  if (!card) return;
  
  if (e.target.closest('.add-cart-btn')) return;
  
  const productId = card.getAttribute('data-id');
  if (productId) openProductDetail(productId);
}

export function openProductDetail(productId) {
  const products = window.getProducts?.() || [];
  const product = products.find(p => String(p.id) === String(productId));
  
  if (!product) {
    console.warn('Produto não encontrado:', productId);
    return;
  }
  
  currentProduct = product;
  currentQty = 1;
  
  const sidebar = document.getElementById('product-detail-sidebar');
  if (!sidebar) return;
  
  const content = document.getElementById('product-detail-content');
  if (!content) return;
  
  const price = Number(product.price ?? 0).toFixed(2).replace('.', ',');
  const image = product.image_url || product.imagem_url || 'https://placehold.co/400x400/1e293b/38bdf8?text=DOM';
  
  content.innerHTML = `
    <div style="padding: 1.5rem;">
      <img src="${image}" alt="${product.name}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 1.5rem;">
      
      <h2 style="font-size: 1.75rem; font-weight: 900; color: white; margin-bottom: 0.75rem;">${product.name}</h2>
      
      <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.6;">${product.description || 'Produto de qualidade superior'}</p>
      
      <div style="padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem;">
        <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Preço</span>
        <div style="font-size: 2rem; font-weight: 900; color: #38bdf8; margin-top: 0.5rem;">R$ ${price}</div>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <label style="font-size: 0.875rem; color: #94a3b8; display: block; margin-bottom: 0.75rem;">Quantidade</label>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <button id="detail-qty-minus" style="width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; border-radius: 8px; cursor: pointer; font-size: 1.2rem; transition: all 0.2s ease;">−</button>
          <span id="detail-qty-val" style="font-size: 1.5rem; font-weight: 800; color: white; min-width: 40px; text-align: center;">1</span>
          <button id="detail-qty-plus" style="width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; border-radius: 8px; cursor: pointer; font-size: 1.2rem; transition: all 0.2s ease;">+</button>
        </div>
      </div>
      
      <button id="detail-add-btn" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #38bdf8, #2563eb); color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; margin-bottom: 1rem; transition: all 0.3s ease;">
        <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
      </button>
    </div>
  `;
  
  const qtyVal = content.querySelector('#detail-qty-val');
  const qtyMinus = content.querySelector('#detail-qty-minus');
  const qtyPlus = content.querySelector('#detail-qty-plus');
  const addBtn = content.querySelector('#detail-add-btn');
  
  qtyMinus.onclick = () => {
    if (currentQty > 1) {
      currentQty--;
      qtyVal.textContent = currentQty;
    }
  };
  
  qtyPlus.onclick = () => {
    if (currentQty < 99) {
      currentQty++;
      qtyVal.textContent = currentQty;
    }
  };
  
  addBtn.onclick = () => {
    const addToCartFn = window.dom?.cartAdd || window.addToCart;
    if (typeof addToCartFn === 'function') {
      for (let i = 0; i < currentQty; i++) {
        addToCartFn(product);
      }
    }
    addBtn.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
      addBtn.disabled = false;
      currentQty = 1;
      qtyVal.textContent = '1';
    }, 1800);
  };
  
  window.dom?.openSidebar('product-detail-sidebar');
}

export function closeProductDetail() {
  window.dom?.closeSidebar('product-detail-sidebar');
}