import { searchProducts, sortProducts } from './products.js';

export function initUI() {
  const search = document.getElementById('search-input');
  if (search) {
    search.addEventListener('input', e => {
      searchProducts(e.target.value);
    });
  }

  const sort = document.getElementById('sort-toolbar') || document.getElementById('sort');
  if (sort) {
    sort.addEventListener('change', e => {
      if (e.target.value) sortProducts(e.target.value);
    });
  }
}

export function openSidebar(id) {
  const sidebar = document.getElementById(id);
  if (!sidebar) return;
  const overlay = id === 'cart-sidebar'
    ? document.getElementById('cart-overlay')
    : document.getElementById('mobile-overlay');
  sidebar.classList.add('active');
  if (overlay) overlay.classList.add('active');
  document.body.classList.add('no-scroll');
}

export function closeSidebar(id) {
  const sidebar = document.getElementById(id);
  if (!sidebar) return;
  const overlay = id === 'cart-sidebar'
    ? document.getElementById('cart-overlay')
    : document.getElementById('mobile-overlay');
  sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.classList.remove('no-scroll');
}

export function toggleSidebar(id) {
  const sidebar = document.getElementById(id);
  if (!sidebar) return;
  if (sidebar.classList.contains('active')) {
    closeSidebar(id);
  } else {
    openSidebar(id);
  }
}
