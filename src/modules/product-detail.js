// Product detail modal — v2.0 (Enhanced)
(function () {
    'use strict';

    /* ─── CSS injetado uma vez ────────────────────────────────────────────── */
    const STYLE_ID = 'product-detail-styles';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
      #product-detail-modal {
        font-family: var(--font);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      #product-detail-modal.is-open { opacity: 1; }
      #product-detail-modal .modal-panel {
        transform: translateY(40px);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        opacity: 0;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      #product-detail-modal.is-open .modal-panel {
        transform: translateY(0);
        opacity: 1;
      }
      #product-detail-modal .modal-backdrop {
        background: rgba(2, 6, 23, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      #product-detail-modal .detail-img-wrap {
        position: relative;
        overflow: hidden;
        background: #020617;
      }
      #product-detail-modal .detail-img-wrap img {
        width:100%; height:100%; object-fit:cover;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
      #product-detail-modal .detail-img-wrap:hover img { transform: scale(1.1); }
      #product-detail-modal .promo-badge {
        position:absolute; top:16px; left:16px;
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        color:#fff; font-size:0.75rem; font-weight:800;
        padding:5px 12px; border-radius:12px;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
      }
      #product-detail-modal .btn-add {
        background: linear-gradient(135deg, #38bdf8, #2563eb);
        color:#fff; border:none; border-radius:14px;
        padding:14px 24px; font-weight:800;
        font-size:0.95rem; cursor:pointer;
        display:flex; align-items:center; justify-content:center; gap:10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
        flex:1;
      }
      #product-detail-modal .btn-add:hover {
        transform: translateY(-3px);
        box-shadow: 0 20px 30px -10px rgba(37, 99, 235, 0.6);
        filter: brightness(1.1);
      }
      #product-detail-modal .btn-add:active { transform: scale(0.95); }
      #product-detail-modal .btn-share {
        background: rgba(255, 255, 255, 0.05);
        color:#fff; border:1px solid rgba(255, 255, 255, 0.1);
        border-radius:14px; padding:14px; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        transition: all 0.2s ease;
      }
      #product-detail-modal .btn-share:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-1px); }
      #product-detail-modal .btn-close-icon {
        position:absolute; top:16px; right:16px;
        width:40px; height:40px; border-radius:50%;
        background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1);
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        color:#fff; font-size:1.2rem; z-index:10;
        transition: all 0.3s ease;
      }
      #product-detail-modal .btn-close-icon:hover {
        background: #ef4444; transform: rotate(90deg);
      }
      #product-detail-modal .price-final {
        font-size:2rem; font-weight:900; letter-spacing:-0.04em;
        color: #38bdf8;
      }
      #product-detail-modal .price-original {
        font-size:0.9rem; color:#64748b;
        text-decoration:line-through; font-weight:500; margin-left:8px;
      }
      #product-detail-modal .detail-divider {
        height:1px;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, rgba(255,255,255,0));
        margin:20px 0;
      }
      #product-detail-modal .category-tag {
        display:inline-flex; align-items:center; gap:6px;
        background: rgba(56, 189, 248, 0.1); color:#38bdf8;
        border:1px solid rgba(56, 189, 248, 0.2); border-radius:20px;
        padding:4px 12px; font-size:0.75rem; font-weight:700;
        letter-spacing:0.05em; text-transform:uppercase;
      }
      #product-detail-modal .qty-control {
        display:flex; align-items:center;
        background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius:14px; overflow:hidden;
      }
      #product-detail-modal .qty-control button {
        width:40px; height:40px; border:none;
        background:transparent; cursor:pointer; font-size:1.1rem;
        color:#fff; display:flex; align-items:center; justify-content:center;
        transition: all 0.2s ease;
      }
      #product-detail-modal .qty-control button:hover { background: rgba(56, 189, 248, 0.2); color:#38bdf8; }
      #product-detail-modal .qty-control .qty-val {
        min-width:40px; text-align:center; font-weight:800;
        font-size:1.1rem; color:#fff;
      }
      #product-detail-modal .modal-scroll::-webkit-scrollbar { width: 5px; }
      #product-detail-modal .modal-scroll::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.3); border-radius: 10px; }

    `;
        document.head.appendChild(style);
    }

    let _qty = 1;

    function createModal() {
        if (document.getElementById('product-detail-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'product-detail-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Detalhes do produto');
        modal.className = 'fixed inset-0 z-[9999] hidden items-center justify-center p-4';

        modal.innerHTML = `
      <div class="modal-backdrop absolute inset-0" data-action="close"></div>
      <div class="modal-panel relative rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col">
        <button class="btn-close-icon" data-action="close" aria-label="Fechar">
          <i class="fas fa-times"></i>
        </button>
        <div id="product-detail-content" class="modal-scroll overflow-y-auto flex-1"></div>
      </div>
    `;

        document.body.appendChild(modal);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('flex')) closeProductDetail();
        });

        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="close"]')) closeProductDetail();
        });
    }

    function calcDiscount(original, final) {
        if (!original || original <= final) return null;
        return Math.round((1 - final / original) * 100);
    }

    function renderProduct(product, priceInfo) {
        _qty = 1;
        const discount = priceInfo.hasPromo ? calcDiscount(priceInfo.original, priceInfo.final) : null;

        const imgBlock = product.image_url
            ? `<div class="detail-img-wrap w-full h-full" style="min-height:220px;">
           <img src="${product.image_url}" alt="${product.name}" loading="lazy">
           ${discount ? `<span class="promo-badge">-${discount}%</span>` : ''}
         </div>`
            : `<div class="detail-img-wrap w-full h-full flex items-center justify-center" style="min-height:220px;">
           <i class="fas fa-utensils text-5xl" style="color:#b0d8c0;"></i>
         </div>`;

        const priceBlock = priceInfo.hasPromo
            ? `<div class="flex items-baseline flex-wrap gap-1 mt-1">
           <span class="price-final is-promo">R$ ${priceInfo.final.toFixed(2).replace('.', ',')}</span>
           <span class="price-original">R$ ${priceInfo.original.toFixed(2).replace('.', ',')}</span>
         </div>`
            : `<div class="mt-1">
           <span class="price-final">R$ ${priceInfo.final.toFixed(2).replace('.', ',')}</span>
         </div>`;

        const categoryTag = product.category
            ? `<span class="category-tag"><i class="fas fa-tag" style="font-size:0.6rem"></i> ${product.category}</span>`
            : '';

        return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div class="overflow-hidden" style="min-height:220px;">${imgBlock}</div>
        <div class="p-6 flex flex-col">
          ${categoryTag}
          <h3 class="text-2xl font-black text-white mt-2 leading-tight" style="letter-spacing:-0.03em;">
            ${product.name}
          </h3>
          ${product.description
                ? `<p class="text-base text-gray-400 mt-3 leading-relaxed">${product.description}</p>`
                : ''}
          <div class="detail-divider"></div>
          <div>
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest">Preço</span>
            ${priceBlock}
          </div>
          <div class="detail-divider"></div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold text-gray-600">Quantidade</span>
            <div class="qty-control">
              <button id="detail-qty-minus" aria-label="Diminuir">
                <i class="fas fa-minus" style="font-size:0.65rem;"></i>
              </button>
              <span class="qty-val" id="detail-qty-val">1</span>
              <button id="detail-qty-plus" aria-label="Aumentar">
                <i class="fas fa-plus" style="font-size:0.65rem;"></i>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-3 mt-auto">
            <button id="detail-add-btn" class="btn-add">
              <i class="fas fa-cart-plus"></i>
              <span>Adicionar</span>
            </button>
            <button id="detail-share-btn" class="btn-share" title="Compartilhar">
              <i class="fas fa-share-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    }

    function openProductDetail(productId) {
        createModal();
        const modal = document.getElementById('product-detail-modal');
        const content = document.getElementById('product-detail-content');
        if (!modal || !content) return;

        const products = window.products || [];
        const product = products.find(p => String(p.id) === String(productId));
        if (!product) { console.warn('[ProductDetail] Produto não encontrado:', productId); return; }

        const priceInfo = (typeof window.getDisplayPrice === 'function' && window.getDisplayPrice(product))
            || { final: product.price || 0, hasPromo: false };

        content.innerHTML = renderProduct(product, priceInfo);
        content.scrollTop = 0;

        const qtyVal = content.querySelector('#detail-qty-val');
        const qtyMinus = content.querySelector('#detail-qty-minus');
        const qtyPlus = content.querySelector('#detail-qty-plus');
        const addBtn = content.querySelector('#detail-add-btn');
        const shareBtn = content.querySelector('#detail-share-btn');

        qtyMinus.onclick = () => { if (_qty > 1) { _qty--; qtyVal.textContent = _qty; } };
        qtyPlus.onclick = () => { if (_qty < 99) { _qty++; qtyVal.textContent = _qty; } };

        addBtn.onclick = () => {
            for (let i = 0; i < _qty; i++) {
                if (typeof window.addToCart === 'function') window.addToCart(product.id);
                else if (window.cartManager) window.cartManager.addItem(product);
            }
            addBtn.innerHTML = `<i class="fas fa-check"></i><span>Adicionado!</span>`;
            addBtn.classList.add('added');
            addBtn.disabled = true;
            setTimeout(() => {
                addBtn.innerHTML = `<i class="fas fa-cart-plus"></i><span>Adicionar</span>`;
                addBtn.classList.remove('added');
                addBtn.disabled = false;
                _qty = 1;
                if (qtyVal) qtyVal.textContent = '1';
            }, 1800);
        };

        shareBtn.onclick = () => {
            if (typeof window.shareProduct === 'function')
                window.shareProduct(product.name, product.description, product.id);
        };

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
    }

    function closeProductDetail() {
        const modal = document.getElementById('product-detail-modal');
        if (!modal) return;
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
        const onEnd = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            modal.removeEventListener('transitionend', onEnd);
        };
        modal.addEventListener('transitionend', onEnd);
        setTimeout(onEnd, 350);
    }

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.produto-card') || e.target.closest('.story-card');
        if (!card) return;
        if (e.target.closest('.add-to-cart') || e.target.closest('.add-to-cart-story') || e.target.closest('.share-product')) return;
        const id = card.getAttribute('data-id') || card.dataset.id;
        if (id) openProductDetail(id);
    });

    window.openProductDetail = openProductDetail;
    window.closeProductDetail = closeProductDetail;

})();