// src/header.js — Lógica do Header: Scroll, Sidebar, Carrinho
(function () {
  'use strict';

  const header       = document.getElementById('main-header');
  const menuBtn      = document.getElementById('menu-btn');
  const closeMenuBtn = document.getElementById('close-menu-btn');
  const sidebar      = document.getElementById('mobile-sidebar');
  const overlay      = document.getElementById('mobile-overlay');

  // ── Efeito de scroll no header ──────────────────────
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // ── Controle da Sidebar Mobile ───────────────────────
  function openSidebar() {
    sidebar?.classList.add('active');
    overlay?.classList.add('active');
    document.body.classList.add('no-scroll');
  }

  function closeSidebar() {
    sidebar?.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  menuBtn?.addEventListener('click', openSidebar);
  closeMenuBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSidebar(); closeCartFn(); }
  });

  // ── Controle do Cart Sidebar ──────────────────────────
  const cartOverlay = document.getElementById('cart-overlay');
  const cartSidebar = document.getElementById('cart-sidebar');
  const closeCart   = document.getElementById('close-cart');
  const cartBtn     = document.getElementById('cart-button-header');

  function openCart() {
    cartSidebar?.classList.add('active');
    cartOverlay?.classList.add('active');
    document.body.classList.add('no-scroll');
  }

  function closeCartFn() {
    cartSidebar?.classList.remove('active');
    cartOverlay?.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }

  cartBtn?.addEventListener('click', openCart);
  closeCart?.addEventListener('click', closeCartFn);
  cartOverlay?.addEventListener('click', closeCartFn);

  // Expõe globalmente
  window.domHeader = { openCart, closeCart: closeCartFn };

  // ── Lógica de Pagamento em Dinheiro (Troco) ──────────
  document.addEventListener('change', (e) => {
    if (e.target.name === 'payment_method') {
      const changeRow = document.getElementById('change-row');
      if (changeRow) {
        changeRow.classList.toggle('hidden', e.target.value !== 'cash');
      }
    }
    // Mostrar/ocultar CEP com base no tipo de entrega
    if (e.target.name === 'order_type') {
      const cepRow = document.getElementById('cep-row');
      if (cepRow) {
        cepRow.classList.toggle('hidden', e.target.value !== 'delivery');
      }
    }
  });

  // Botões de Troco (Sim/Não)
  const changeYes = document.getElementById('change-yes');
  const changeNo  = document.getElementById('change-no');
  const changeAmountRow = document.getElementById('change-amount-row');

  changeYes?.addEventListener('click', () => {
    changeYes.classList.add('active');
    changeNo?.classList.remove('active');
    changeAmountRow?.classList.remove('hidden');
  });

  changeNo?.addEventListener('click', () => {
    changeNo.classList.add('active');
    changeYes?.classList.remove('active');
    changeAmountRow?.classList.add('hidden');
  });

  // ── Atualiza badge do carrinho ──────────────────────
  window.updateCartBadge = function (count) {
    const badge = document.getElementById('cart-count-header');
    if (!badge) return;
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
  };

  // ── Hint de Parcelamento ────────────────────────────
  window.updateParcelHint = function(total) {
    const hint = document.getElementById('parcel-hint');
    if (!hint || total <= 0) { if (hint) hint.textContent = ''; return; }
    const parcela = (total / 12).toFixed(2).replace('.', ',');
    hint.textContent = `Ou 12x de R$ ${parcela} no cartão de crédito`;
  };

  // ── Sincronização de Categorias com Supabase ──────────
  async function loadCategories() {
    const desktopList = document.getElementById('desktop-categories-dropdown');
    const mobileList  = document.getElementById('mobile-categories-list');

    if (!desktopList && !mobileList) return;

    try {
      // Aguarda o manager estar disponível
      const checkManager = setInterval(async () => {
        if (window.supabaseManager?.isConnected?.()) {
          clearInterval(checkManager);
          const categorias = await window.supabaseManager.getCategorias();
          
          if (categorias && categorias.length > 0) {
            // Renderiza no Desktop
            if (desktopList) {
              desktopList.innerHTML = categorias.map(cat => `
                <li><a href="#" onclick="dom.filterCategory('${cat.nome}'); return false;">${cat.nome}</a></li>
              `).join('');
            }

            // Renderiza no Mobile
            if (mobileList) {
              mobileList.innerHTML = categorias.map(cat => `
                <li><a href="#" onclick="dom.filterCategory('${cat.nome}'); document.getElementById('close-menu-btn').click(); return false;">
                  ${getCategoryEmoji(cat.nome)} ${cat.nome}
                </a></li>
              `).join('');
            }
          } else {
            // Fallback: categorias genéricas se a tabela estiver vazia
            const fallback = ['Eletrônicos', 'Roupas', 'Casa', 'Acessórios', 'Esportes'];
            if (desktopList) {
              desktopList.innerHTML = fallback.map(n => `
                <li><a href="#" onclick="dom.filterCategory('${n}'); return false;">${n}</a></li>
              `).join('');
            }
            if (mobileList) {
              mobileList.innerHTML = fallback.map(n => `
                <li><a href="#" onclick="dom.filterCategory('${n}'); document.getElementById('close-menu-btn').click(); return false;">
                  ${getCategoryEmoji(n)} ${n}
                </a></li>
              `).join('');
            }
          }
        }
      }, 500);

      // Timeout após 10 segundos
      setTimeout(() => clearInterval(checkManager), 10000);

    } catch (err) {
      console.error('❌ Erro ao carregar categorias dinâmicas:', err);
    }
  }

  function getCategoryEmoji(name) {
    const n = name.toLowerCase();
    if (n.includes('eletrônicos')) return '📱';
    if (n.includes('roupas')) return '👕';
    if (n.includes('casa')) return '🏠';
    if (n.includes('acessórios')) return '⌚';
    if (n.includes('esporte')) return '⚽';
    if (n.includes('gamer')) return '🎮';
    return '📁';
  }

  // Inicializa
  document.addEventListener('DOMContentLoaded', loadCategories);

})();
