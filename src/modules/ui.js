export function initUI() {
  // A lógica de busca e ordenação é tratada pelo App para evitar handlers duplicados.
}

export function openSidebar(id) {
  const sidebar = document.getElementById(id);
  if (!sidebar) return;
  const overlay = id === 'cart-sidebar'
    ? document.getElementById('cart-overlay')
    : id === 'product-detail-sidebar'
      ? document.getElementById('product-detail-overlay')
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
    : id === 'product-detail-sidebar'
      ? document.getElementById('product-detail-overlay')
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
