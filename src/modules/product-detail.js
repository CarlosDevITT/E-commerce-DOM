// src/modules/product-detail.js - Sidebar de detalhes do produto (OTIMIZADO)
'use strict';

let currentProduct = null;
let currentQty = 1;
let templateReady = false;

export function initProductDetail() {
  // Renderizar template uma única vez
  ensureProductDetailTemplate();
  
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

// Renderizar template HTML apenas uma vez
function ensureProductDetailTemplate() {
  if (templateReady) return;
  
  const content = document.getElementById('product-detail-content');
  if (!content) return;
  
  content.innerHTML = `
    <div style="padding: 1.5rem;">
      <img id="detail-img" src="" alt="" style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 1.5rem;">
      
      <h2 id="detail-title" style="font-size: 1.75rem; font-weight: 900; color: white; margin-bottom: 0.75rem;"></h2>
      
      <p id="detail-desc" style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.6;"></p>
      
      <div style="padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); margin-bottom: 1.5rem;">
        <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Preço</span>
        <div id="detail-price" style="font-size: 2rem; font-weight: 900; color: #38bdf8; margin-top: 0.5rem;"></div>
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
  
  // Anexar listeners
  setupProductDetailListeners();
  templateReady = true;
}

function setupProductDetailListeners() {
  const content = document.getElementById('product-detail-content');
  const qtyMinus = content.querySelector('#detail-qty-minus');
  const qtyPlus = content.querySelector('#detail-qty-plus');
  const addBtn = content.querySelector('#detail-add-btn');
  
  qtyMinus.onclick = () => {
    if (currentQty > 1) {
      currentQty--;
      content.querySelector('#detail-qty-val').textContent = currentQty;
    }
  };
  
  qtyPlus.onclick = () => {
    if (currentQty < 99) {
      currentQty++;
      content.querySelector('#detail-qty-val').textContent = currentQty;
    }
  };
  
  addBtn.onclick = () => {
    const addToCartFn = window.dom?.cartAdd || window.addToCart;
    if (typeof addToCartFn === 'function') {
      for (let i = 0; i < currentQty; i++) {
        addToCartFn(currentProduct);
      }
    }
    addBtn.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
    addBtn.disabled = true;
    setTimeout(() => {
      addBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
      addBtn.disabled = false;
      currentQty = 1;
      content.querySelector('#detail-qty-val').textContent = '1';
    }, 1800);
  };
}

export function openProductDetail(productOrId) {
  const product = getProductFromArg(productOrId);
  
  if (!product) {
    console.warn('Produto não encontrado:', productOrId);
    return;
  }
  
  currentProduct = product;
  currentQty = 1;
  
  const content = document.getElementById('product-detail-content');
  if (!content) return;
  
  // Garantir template
  if (!templateReady) {
    ensureProductDetailTemplate();
  }
  
  // Atualizar apenas os dados (sem reconstruir HTML)
  const price = Number(product.price ?? 0).toFixed(2).replace('.', ',');
  const image = product.image_url || product.imagem_url || 'https://placehold.co/400x400/1e293b/38bdf8?text=DOM';
  
  const img = content.querySelector('#detail-img');
  img.src = image;
  img.alt = product.name;
  
  const title = content.querySelector('#detail-title');
  title.textContent = product.name;
  
  const desc = content.querySelector('#detail-desc');
  desc.textContent = product.description || 'Produto de qualidade superior';
  
  const priceEl = content.querySelector('#detail-price');
  priceEl.textContent = 'R$ ' + price;
  
  const qtyVal = content.querySelector('#detail-qty-val');
  qtyVal.textContent = '1';
  
  window.dom?.openSidebar('product-detail-sidebar');
}

function getProductFromArg(productOrId) {
  if (!productOrId) return null;
  if (typeof productOrId === 'object' && productOrId.id != null) {
    return productOrId;
  }
  const products = window.dom?.getProducts?.() || window.getProducts?.() || [];
  return products.find(p => String(p.id) === String(productOrId));
}

export function closeProductDetail() {
  window.dom?.closeSidebar('product-detail-sidebar');
}