// src/modules/cart.js — Módulo de Carrinho Premium (Bug Fix Overflow & Supabase)
'use strict';

let cartItems = [];
let aplicadoCupom = null;
const VALOR_FRETE_GRATIS = 589.00;

export async function initCart() {
  console.log('🛒 Inicializando motor do carrinho premium...');
  loadCart();
  injectCartUXStyles();
  renderCart();
  setupCartEvents();
  
  // Busca inicial de recomendados
  await carregarProdutosSugeridosSupabase();
  console.log('✅ Carrinho e recomendações carregados.');
}

function loadCart() {
  try {
    const storage = window.safeStorage;
    cartItems = JSON.parse(storage.getItem('cart') || '[]') || [];
  } catch (error) {
    console.warn('Erro ao carregar o carrinho:', error);
    cartItems = [];
  }
}

function persistCart() {
  try {
    const storage = window.safeStorage;
    storage.setItem('cart', JSON.stringify(cartItems));
  } catch (error) {
    console.warn('Erro ao persistir o carrinho:', error);
  }
}

export function addToCart(product) {
  if (!product || product.id == null) return;

  const id = String(product.id);
  const existing = cartItems.find(item => String(item.id) === id);

  if (existing) {
    existing.quantity = (Number(existing.quantity) || 1) + 1;
  } else {
    cartItems.push({
      id,
      name: product.name || product.nome || 'Produto Premium',
      price: Number(product.price ?? product.preco ?? 0) || 0,
      image: product.image_url || product.imagem_url || product.image || '',
      quantity: 1
    });
  }

  persistCart();
  renderCart();
  abrirSidebarCarrinho();
  
  // Atualiza as sugestões sem travar o fluxo
  carregarProdutosSugeridosSupabase().catch(err => console.error(err));
}

export function updateQuantity(id, change) {
  const item = cartItems.find(i => String(i.id) === String(id));
  if (!item) return;

  item.quantity = (Number(item.quantity) || 1) + change;

  if (item.quantity <= 0) {
    removeFromCart(id);
  } else {
    persistCart();
    renderCart();
  }
}

export function removeFromCart(id) {
  if (id == null) return;
  const key = String(id);
  
  const itemEl = document.querySelector(`.cart-item[data-id="${key}"]`);
  if (itemEl) {
    itemEl.classList.add('cart-item-fade-out');
    setTimeout(() => {
      cartItems = cartItems.filter(item => String(item.id) !== key);
      persistCart();
      renderCart();
      carregarProdutosSugeridosSupabase().catch(() => {});
    }, 200);
  } else {
    cartItems = cartItems.filter(item => String(item.id) !== key);
    persistCart();
    renderCart();
    carregarProdutosSugeridosSupabase().catch(() => {});
  }
}

export function clearCart() {
  cartItems = [];
  aplicadoCupom = null;
  persistCart();
  renderCart();
  carregarProdutosSugeridosSupabase().catch(() => {});
}

function abrirSidebarCarrinho() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (sidebar && overlay) {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    // UX: Evita rolar o fundo, mas mantém scrollbar interna funcional
    document.body.style.setProperty('overflow', 'hidden', 'important');
  }
}

export function fecharSidebarCarrinho() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    // Devolve o scroll natural para a tela principal imediatamente
    document.body.style.overflow = '';
  }
}

/**
 * Busca produtos sugeridos no Supabase filtrando os itens existentes.
 * CORREÇÃO BUG 400: Alterada a formatação do filtro .not() para chaves {}, padrão JS-client do PostgREST.
 */
async function carregarProdutosSugeridosSupabase() {
  const carouselContainer = document.getElementById('related-products-carousel');
  if (!carouselContainer) return;

  try {
    const supabase = window.supabaseManager?.client;
    if (!supabase) {
      carouselContainer.innerHTML = `<p class="related-error">Supabase offline.</p>`;
      return;
    }

    const idsNoCarrinho = cartItems.map(item => String(item.id));
    
    let query = supabase
      .from('products')
      .select('id, name, nome, price, preco, image_url, imagem_url, image')
      .limit(6);

    // FIX: Sintaxe correta para exclusão por lista no Supabase JS
    if (idsNoCarrinho.length > 0) {
      query = query.not('id', 'in', `(${idsNoCarrinho.join(',')})`);
    }

    const { data: produtos, error } = await query;

    if (error) throw error;

    if (!produtos || produtos.length === 0) {
      carouselContainer.innerHTML = `<p class="related-error">Sem ofertas adicionais no momento.</p>`;
      return;
    }

    carouselContainer.innerHTML = produtos.map(prod => {
      const id = prod.id;
      const nome = prod.name || prod.nome || 'Produto';
      const preco = Number(prod.price ?? prod.preco ?? 0);
      const imagem = prod.image_url || prod.imagem_url || prod.image || 'https://placehold.co/80x80/1e293b/38bdf8?text=DOM';

      return `
        <div class="related-card" data-id="${id}" data-nome="${nome}" data-preco="${preco}" data-imagem="${imagem}">
          <img src="${imagem}" alt="${nome}" class="related-card-img" loading="lazy">
          <h5 class="related-card-title">${nome}</h5>
          <p class="related-card-price">${formatCurrency(preco)}</p>
          <button type="button" class="btn-add-related">Adicionar</button>
        </div>
      `;
    }).join('');

    carouselContainer.querySelectorAll('.btn-add-related').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.related-card');
        if (card) {
          const dataset = card.dataset;
          addToCart({
            id: dataset.id,
            name: dataset.nome,
            price: Number(dataset.preco),
            image: dataset.imagem
          });
        }
      });
    });

  } catch (err) {
    console.error('Erro ao carregar recomendações do Supabase:', err);
    carouselContainer.innerHTML = `<p class="related-error">Dificuldade ao atualizar ofertas.</p>`;
  }
}

function setupCartEvents() {
  const itemsContainer = document.getElementById('cart-items');
  const clearBtn = document.getElementById('cart-clear-btn');
  const btnCupom = document.getElementById('cart-apply-coupon');
  const inputCupom = document.getElementById('cart-coupon-input');
  const prevBtn = document.getElementById('related-prev-btn');
  const nextBtn = document.getElementById('related-next-btn');
  const carousel = document.getElementById('related-products-carousel');
  
  // Gatilhos de Fechamento da Interface Lateral
  const closeBtn = document.getElementById('close-cart');
  const overlay = document.getElementById('cart-overlay');

  closeBtn?.addEventListener('click', fecharSidebarCarrinho);
  overlay?.addEventListener('click', fecharSidebarCarrinho);

  itemsContainer?.addEventListener('click', (event) => {
    const target = event.target;
    const itemEl = target.closest('.cart-item');
    if (!itemEl) return;
    const id = itemEl.dataset.id;

    if (target.closest('.qty-minus')) {
      updateQuantity(id, -1);
    } else if (target.closest('.qty-plus')) {
      updateQuantity(id, 1);
    } else if (target.closest('.cart-remove-btn')) {
      removeFromCart(id);
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (confirm('Deseja esvaziar o carrinho?')) clearCart();
  });

  btnCupom?.addEventListener('click', () => {
    const cupom = inputCupom?.value?.trim().toUpperCase();
    if (cupom === 'DOM10') {
      aplicadoCupom = { codigo: 'DOM10', desconto: 0.10 };
      renderCart();
    } else if (cupom) {
      alert('Cupom inválido ou expirado.');
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (carousel) carousel.scrollBy({ left: 140, behavior: 'smooth' });
  });

  prevBtn?.addEventListener('click', () => {
    if (carousel) carousel.scrollBy({ left: -140, behavior: 'smooth' });
  });
}

function formatCurrency(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function renderCart() {
  const itemsContainer = document.getElementById('cart-items');
  const cartItemsCount = document.getElementById('cart-items-count');
  const subtotalVal = document.getElementById('cart-subtotal-val');
  const totalVal = document.getElementById('cart-total-val');
  const cartCountHeader = document.getElementById('cart-count-header');
  const checkoutBtn = document.getElementById('checkout-button');
  const parcelHint = document.getElementById('parcel-hint');
  const progressContainer = document.getElementById('shipping-progress-container');
  const discountRow = document.getElementById('cart-discount-row');

  if (!itemsContainer) return;

  if (cartItems.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fas fa-shopping-bag" style="font-size:2rem; color:#475569; margin-bottom:0.5rem;"></i>
        <p>Seu carrinho está vazio</p>
      </div>`;
    if (progressContainer) progressContainer.innerHTML = '';
  } else {
    itemsContainer.innerHTML = cartItems.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image || 'https://placehold.co/80x80/1e293b/38bdf8?text=DOM'}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-price-row">
             <span class="cart-item-price">${formatCurrency(item.price)}</span>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-selector">
              <button type="button" class="qty-btn qty-minus">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button type="button" class="qty-btn qty-plus">+</button>
            </div>
            <button type="button" class="cart-remove-btn" aria-label="Remover item"><i class="far fa-trash-alt"></i></button>
          </div>
        </div>
      </div>`).join('');
  }

  const totalQuantity = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * (Number(item.quantity) || 1)), 0);
  
  let descontoValor = 0;
  if (aplicadoCupom) descontoValor = subtotal * aplicadoCupom.desconto;
  const total = Math.max(0, subtotal - descontoValor);

  if (cartItemsCount) cartItemsCount.textContent = String(totalQuantity);
  if (cartCountHeader) cartCountHeader.textContent = String(totalQuantity);
  if (subtotalVal) subtotalVal.textContent = formatCurrency(subtotal);
  if (totalVal) totalVal.textContent = formatCurrency(total);
  
  if (discountRow) {
    if (descontoValor > 0) {
      discountRow.innerHTML = `<span>Desconto (${aplicadoCupom.codigo})</span><span style="color:#10b981;">-${formatCurrency(descontoValor)}</span>`;
      discountRow.style.display = 'flex';
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (progressContainer && cartItems.length > 0) {
    const restante = VALOR_FRETE_GRATIS - subtotal;
    const progresso = Math.min(100, (subtotal / VALOR_FRETE_GRATIS) * 100);
    
    if (restante > 0) {
      progressContainer.innerHTML = `
        <div class="shipping-notice">Faltam <strong>${formatCurrency(restante)}</strong> para ter <strong>Frete Grátis</strong></div>
        <div class="shipping-bar-bg"><div class="shipping-bar-fill" style="width: ${progresso}%"></div></div>
      `;
    } else {
      progressContainer.innerHTML = `
        <div class="shipping-notice" style="color:#10b981;">🎉 Você ganhou <strong>Frete Grátis!</strong></div>
        <div class="shipping-bar-bg"><div class="shipping-bar-fill" style="width:100%; background:#10b981;"></div></div>
      `;
    }
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = totalQuantity === 0;
    const span = checkoutBtn.querySelector('span');
    if (span) span.textContent = totalQuantity === 0 ? 'Carrinho vazio' : 'Finalizar compra';
  }
  
  if (parcelHint) {
    parcelHint.textContent = totalQuantity === 0 ? '' : `Ou em até 12x de ${formatCurrency(total / 12)} sem juros`;
  }
}

function injectCartUXStyles() {
  if (document.getElementById('cart-ux-premium-styles')) return;
  const style = document.createElement('style');
  style.id = 'cart-ux-premium-styles';
  style.textContent = `
    .ecom-cart-sidebar {
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
      overflow: hidden !important;
      background: #0b1329 !important;
      color: #f8fafc !important;
      font-family: 'Inter', sans-serif !important;
      position: fixed;
      top: 0;
      right: -450px;
      width: 100%;
      max-width: 420px;
      z-index: 9999;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: -10px 0 30px rgba(0,0,0,0.5);
    }
    .ecom-cart-sidebar.active {
      right: 0 !important;
    }
    
    .cart-overlay {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(2, 6, 23, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9998;
      opacity: 0; visibility: hidden;
      transition: all 0.25s ease;
    }
    .cart-overlay.active {
      opacity: 1 !important;
      visibility: visible !important;
    }

    .ecom-cart-scrollable-content {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 1rem 1.25rem !important;
      scroll-behavior: smooth !important;
    }
    .ecom-cart-scrollable-content::-webkit-scrollbar { width: 6px; }
    .ecom-cart-scrollable-content::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }

    .ecom-cart-items-head { display: flex; justify-content: space-between; align-items: center; margin: 1rem 0; }
    .ecom-cart-items-head h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .btn-text { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; text-decoration: underline; }

    .cart-item {
      display: flex; gap: 0.75rem; padding: 0.85rem; background: #111c44;
      border-radius: 12px; margin-bottom: 0.75rem; border: 1px solid #1e293b;
    }
    .cart-item-image img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
    .cart-item-info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .cart-item-info h4 { margin: 0; font-size: 0.9rem; color: #f8fafc; font-weight: 600; }
    .cart-item-price { font-weight: 700; color: #38bdf8; font-size: 0.95rem; }
    
    .cart-item-actions { display: flex; justify-content: space-between; align-items: center; }
    .quantity-selector { display: flex; align-items: center; background: #1e293b; border-radius: 20px; padding: 2px; }
    .qty-btn { background: transparent; border: none; width: 24px; height: 24px; cursor: pointer; font-weight: bold; color: #94a3b8; border-radius: 50%; }
    .qty-btn:hover { background: #334155; color: #fff; }
    .qty-value { padding: 0 0.4rem; font-size: 0.85rem; font-weight: 600; min-width: 16px; text-align: center; color: #fff; }
    .cart-remove-btn { background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 0.95rem; }
    .cart-remove-btn:hover { color: #f43f5e; }

    /* Carrossel */
    .ecom-related-section { margin: 1.5rem 0; padding: 1rem 0; border-top: 1px dashed #1e293b; border-bottom: 1px dashed #1e293b; }
    .related-title { font-size: 0.9rem; font-weight: 700; color: #f8fafc; margin: 0 0 0.85rem 0; text-transform: uppercase; }
    .related-carousel-container { position: relative; display: flex; align-items: center; }
    .related-products-grid { display: flex; gap: 0.75rem; overflow-x: auto; scroll-behavior: smooth; width: 100%; padding-bottom: 0.5rem; }
    .related-products-grid::-webkit-scrollbar { height: 4px; }
    .related-products-grid::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
    
    .related-card { flex: 0 0 120px; background: #111c44; border: 1px solid #1e293b; border-radius: 10px; padding: 0.6rem; text-align: center; }
    .related-card-img { width: 100%; height: 70px; object-fit: cover; border-radius: 6px; }
    .related-card-title { font-size: 0.75rem; margin: 0; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .related-card-price { font-size: 0.85rem; font-weight: 700; color: #38bdf8; margin: 0.2rem 0; }
    .btn-add-related { background: #1e293b; border: 1px solid #334155; border-radius: 6px; font-size: 0.75rem; padding: 4px 0; width: 100%; cursor: pointer; color: #f8fafc; }
    .btn-add-related:hover { background: #38bdf8; color: #0b1329; }
    
    .carousel-nav-btn { position: absolute; top: 35%; background: #1e293b; border: 1px solid #334155; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94a3b8; z-index: 2; }
    .carousel-nav-btn.prev { left: -8px; }
    .carousel-nav-btn.next { right: -8px; }

    .ecom-coupon-row { display: flex; gap: 0.5rem; margin-top: 0.65rem; }
    .ecom-coupon-row input { flex: 1; padding: 0.6rem; background: #111c44; border: 1px solid #1e293b; border-radius: 8px; color: #fff; outline: none; }
    .ecom-coupon-row button { padding: 0 1rem; background: #38bdf8; color: #0b1329; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    
    #shipping-progress-container { background: #111c44; padding: 0.75rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid #1e293b; }
    .shipping-notice { font-size: 0.8rem; color: #cbd5e1; }
    .shipping-bar-bg { background: #1e293b; width: 100%; height: 6px; border-radius: 3px; overflow: hidden; }
    .shipping-bar-fill { background: #38bdf8; height: 100%; transition: width 0.3s ease; }
    
    .cart-empty { text-align: center; padding: 2rem 0; color: #64748b; }
  `;
  document.head.appendChild(style);
}