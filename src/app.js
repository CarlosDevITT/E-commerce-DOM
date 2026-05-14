//  src/app.js — Sistema modular sem MODAL e sem SW corrompendo
'use strict';

// Importa todos os módulos existentes com tratamento de erro
let modules = {};

async function loadModule(moduleName) {
  try {
    const module = await import(`./modules/${moduleName}.js`);
    modules[moduleName] = module;
    console.log(`✅ Módulo carregado: ${moduleName}`);
    return module;
  } catch (error) {
    console.error(`❌ Erro ao carregar módulo ${moduleName}:`, error);
    return null;
  }
} 

// ── Sistema de módulos sincronizados ────────────────────────────────
const App = {
  initialized: false,

  async init() {
    if (this.initialized) return;

    try {
      console.log('🚀 Inicializando sistema modular DOM E-commerce...');

      // Carregar módulos um por um com fallback
      const moduleNames = ['auth', 'products', 'cart', 'chat', 'ui', 'product-detail', 'profile'];
      
      for (const name of moduleNames) {
        await loadModule(name);
        await this.delay(100); // Pequeno delay entre carregamentos
      }

      // Inicializar módulos que existem
      if (modules.auth && modules.auth.initAuth) await modules.auth.initAuth();
      if (modules.ui && modules.ui.initUI) await modules.ui.initUI();
      if (modules.cart && modules.cart.initCart) await modules.cart.initCart();
      if (modules.chat && modules.chat.initChat) await modules.chat.initChat();
      if (modules.products && modules.products.initProducts) await modules.products.initProducts();
      if (modules.product_detail && modules.product_detail.initProductDetail) modules.product_detail.initProductDetail();
      if (modules.profile && modules.profile.initProfile) await modules.profile.initProfile();

      // Configurar eventos
      this.setupGlobalHandlers();
      this.setupSidebarHandlers();
      this.setupCartSync();
      this.setupProductSync();

      // Carregar produtos na home
      if (modules.products && modules.products.loadProducts) {
        await modules.products.loadProducts();
      } else {
        this.loadFallbackProducts();
      }

      // Expor API global
      this.exposeGlobalAPI();

      this.initialized = true;
      console.log('✅ Sistema modular inicializado com sucesso!');
    } catch (error) {
      console.error('❌ Erro fatal na inicialização:', error);
      this.showError('Erro ao carregar aplicação. Recarregue a página.');
    }
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  loadFallbackProducts() {
    const productsContainer = document.getElementById('products-list');
    if (productsContainer) {
      productsContainer.innerHTML = `
        <div class="products-loading">
          <i class="fas fa-box-open"></i>
          <p>Produtos disponíveis em breve</p>
          <button onclick="location.reload()" class="btn-primary">Recarregar</button>
        </div>
      `;
    }
  },

  setupCartSync() {
    // Sincroniza contador do carrinho
    const updateCartUI = () => {
      const cartCount = document.getElementById('cart-count-header');
      if (cartCount) {
        try {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
          cartCount.textContent = count;
        } catch(e) {
          cartCount.textContent = '0';
        }
      }
    };
    updateCartUI();
    setInterval(updateCartUI, 1000);
  },

  setupProductSync() {
    window.showProductDetails = (productId) => {
      if (modules.products && modules.products.getProducts) {
        const products = modules.products.getProducts();
        const product = products?.find(p => p.id == productId);
        if (product && modules.product_detail && modules.product_detail.openProductDetail) {
          modules.product_detail.openProductDetail(product);
        } else {
          this.showError('Detalhes do produto temporariamente indisponível');
        }
      }
    };
  },

  setupGlobalHandlers() {
    // Search
    const searchInput = document.getElementById('search-input');
    const searchToolbar = document.getElementById('search-toolbar');
    
    const handleSearch = (e) => {
      const term = e.target.value;
      if (modules.products && modules.products.searchProducts) {
        modules.products.searchProducts(term);
      }
    };
    
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (searchToolbar) searchToolbar.addEventListener('input', handleSearch);

    // Sort
    const sortSelect = document.getElementById('sort-toolbar');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        if (e.target.value && modules.products && modules.products.sortProducts) {
          modules.products.sortProducts(e.target.value);
        }
      });
    }

    // Clear cart
    const clearCartBtn = document.getElementById('cart-clear-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        if (confirm('Limpar todo o carrinho?')) {
          if (modules.cart && modules.cart.clearCart) {
            modules.cart.clearCart();
          } else {
            localStorage.setItem('cart', '[]');
          }
          this.showSuccess('Carrinho limpo!');
          this.setupCartSync();
        }
      });
    }

    // Checkout
    const checkoutBtn = document.getElementById('checkout-button');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.checkout());
    }

    // Newsletter
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('newsletter-email')?.value;
        if (email) {
          this.showSuccess(`Obrigado por se inscrever!`);
          newsletterForm.reset();
        }
      });
    }

    // Categorias
    document.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const category = card.dataset.category;
        if (category && modules.products && modules.products.filterByCategory) {
          modules.products.filterByCategory(category);
          this.showSuccess(`Filtrando: ${category}`);
        }
      });
    });

    // FAQ Toggle
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (item) item.classList.toggle('active');
      });
    });

    // Navegação
    const logoLink = document.getElementById('logo-link');
    if (logoLink) logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.route('home');
    });

    const viewOffersBtn = document.getElementById('view-offers-btn');
    if (viewOffersBtn) viewOffersBtn.addEventListener('click', () => this.route('products'));

    const viewAllProducts = document.getElementById('view-all-products');
    if (viewAllProducts) viewAllProducts.addEventListener('click', () => this.route('products'));

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) profileBtn.addEventListener('click', () => this.route('profile'));

    const promoChatBtn = document.getElementById('promo-chat-btn');
    if (promoChatBtn) promoChatBtn.addEventListener('click', () => this.openChatModule());

    // Bottom nav
    const bottomNavHome = document.getElementById('bottom-nav-home');
    if (bottomNavHome) bottomNavHome.addEventListener('click', (e) => {
      e.preventDefault();
      this.route('home');
    });

    const bottomNavChat = document.getElementById('bottom-nav-chat');
    if (bottomNavChat) bottomNavChat.addEventListener('click', (e) => {
      e.preventDefault();
      this.openChatModule();
    });

    const bottomNavOrders = document.getElementById('bottom-nav-orders');
    if (bottomNavOrders) bottomNavOrders.addEventListener('click', (e) => {
      e.preventDefault();
      this.route('orders');
    });

    const bottomNavProfile = document.getElementById('bottom-nav-profile');
    if (bottomNavProfile) bottomNavProfile.addEventListener('click', (e) => {
      e.preventDefault();
      this.route('profile');
    });
  },

  setupSidebarHandlers() {
    // Menu mobile
    const menuBtn = document.getElementById('menu-btn');
    const closeMenu = document.getElementById('close-menu-btn');
    const overlay = document.getElementById('mobile-overlay');

    if (menuBtn && modules.ui && modules.ui.openSidebar) {
      menuBtn.onclick = () => modules.ui.openSidebar('mobile-sidebar');
    }
    if (closeMenu && modules.ui && modules.ui.closeSidebar) {
      closeMenu.onclick = () => modules.ui.closeSidebar('mobile-sidebar');
    }
    if (overlay && modules.ui && modules.ui.closeSidebar) {
      overlay.onclick = () => modules.ui.closeSidebar('mobile-sidebar');
    }

    // Carrinho sidebar
    const cartBtn = document.getElementById('cart-button-header');
    const closeCart = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');

    if (cartBtn && modules.ui && modules.ui.openSidebar) {
      cartBtn.onclick = () => modules.ui.openSidebar('cart-sidebar');
    }
    if (closeCart && modules.ui && modules.ui.closeSidebar) {
      closeCart.onclick = () => modules.ui.closeSidebar('cart-sidebar');
    }
    if (cartOverlay && modules.ui && modules.ui.closeSidebar) {
      cartOverlay.onclick = () => modules.ui.closeSidebar('cart-sidebar');
    }

    // Produto detalhe
    const closeProductDetail = document.getElementById('close-product-detail');
    const productOverlay = document.getElementById('product-detail-overlay');

    if (closeProductDetail && modules.ui && modules.ui.closeSidebar) {
      closeProductDetail.onclick = () => modules.ui.closeSidebar('product-detail-sidebar');
    }
    if (productOverlay && modules.ui && modules.ui.closeSidebar) {
      productOverlay.onclick = () => modules.ui.closeSidebar('product-detail-sidebar');
    }
  },

  openChatModule() {
    if (modules.chat && modules.chat.openChat) {
      modules.chat.openChat();
    } else {
      // Fallback: mostrar chat widget
      const chatWidget = document.getElementById('chat-widget');
      if (chatWidget) {
        chatWidget.classList.remove('hidden');
      }
    }
  },

  async route(routeName) {
    try {
      console.log(`📍 Rota: ${routeName}`);
      this.closeAllSidebars();

      switch (routeName) {
        case 'home':
          if (modules.products && modules.products.loadProducts) {
            await modules.products.loadProducts();
          }
          break;
        case 'products':
          if (modules.products && modules.products.loadProducts) {
            await modules.products.loadProducts();
          }
          break;
        case 'cart':
          if (modules.ui && modules.ui.openSidebar) {
            modules.ui.openSidebar('cart-sidebar');
          }
          break;
        case 'profile':
          this.loadProfile();
          break;
        case 'orders':
          this.loadOrders();
          break;
        default:
          if (modules.products && modules.products.loadProducts) {
            await modules.products.loadProducts();
          }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(`Erro na rota ${routeName}:`, error);
    }
  },

  loadProfile() {
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = `
        <section class="section-placeholder" style="text-align: center; padding: 60px 20px;">
          <i class="fas fa-user-circle" style="font-size: 64px; color: var(--primary);"></i>
          <h2 style="margin: 20px 0;">Perfil do Cliente</h2>
          <p style="color: var(--text-secondary);">Em breve você poderá gerenciar seus dados e pedidos aqui.</p>
          <button onclick="location.reload()" class="btn-primary" style="margin-top: 30px;">Voltar à Home</button>
        </section>
      `;
    }
  },

  loadOrders() {
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = `
        <section class="section-placeholder" style="text-align: center; padding: 60px 20px;">
          <i class="fas fa-shopping-bag" style="font-size: 64px; color: var(--primary);"></i>
          <h2 style="margin: 20px 0;">Meus Pedidos</h2>
          <p style="color: var(--text-secondary);">Histórico de compras em breve.</p>
          <button onclick="location.reload()" class="btn-primary" style="margin-top: 30px;">Voltar à Home</button>
        </section>
      `;
    }
  },

  closeAllSidebars() {
    if (modules.ui && modules.ui.closeSidebar) {
      modules.ui.closeSidebar('mobile-sidebar');
      modules.ui.closeSidebar('cart-sidebar');
      modules.ui.closeSidebar('product-detail-sidebar');
    }
  },

  exposeGlobalAPI() {
    window.dom = {
      route: (name) => this.route(name),
      openSidebar: (id) => modules.ui?.openSidebar?.(id),
      closeSidebar: (id) => modules.ui?.closeSidebar?.(id),
      cartAdd: (product) => {
        if (modules.cart && modules.cart.addToCart) {
          modules.cart.addToCart(product);
          this.showSuccess(`${product.name} adicionado ao carrinho!`);
          this.setupCartSync();
        }
      },
      cartRemove: (id) => {
        if (modules.cart && modules.cart.removeFromCart) {
          modules.cart.removeFromCart(id);
          this.setupCartSync();
        }
      },
      openChat: () => this.openChatModule(),
      closeChat: () => {
        if (modules.chat && modules.chat.closeChat) {
          modules.chat.closeChat();
        }
      },
      showProductDetails: (id) => window.showProductDetails?.(id)
    };
  },

  showError(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 12px 20px; border-radius: 8px; background: #dc2626; color: white;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  showSuccess(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; padding: 12px 20px; border-radius: 8px; background: #10b981; color: white;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  checkout() {
    this.showSuccess('Checkout em desenvolvimento!');
  }
};

// ── Inicialização com delay para garantir DOM ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => App.init(), 100));
} else {
  setTimeout(() => App.init(), 100);
}