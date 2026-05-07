// src/modules/pwa_handler.js - PWA handler com cache e instalação

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✓ Service Worker registrado');
        
        setInterval(() => {
          registration.update();
        }, 60000);
      } catch (err) {
        console.warn('Service Worker erro:', err);
      }
    });
  }
}

export function promptPWAInstall() {
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    console.log('✓ App instalado com sucesso');
  });
}

export function checkOnlineStatus() {
  return navigator.onLine;
}

export function setupOnlineDetection() {
  window.addEventListener('online', () => {
    console.log('✓ Online');
  });

  window.addEventListener('offline', () => {
    console.log('⚠ Offline');
  });
}

