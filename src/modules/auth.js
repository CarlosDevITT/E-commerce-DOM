// src/modules/auth.js - Autenticação básica

class AuthService {
  constructor() {
    this.user = this.loadUser();
  }

  loadUser() {
    try {
      const storage = window.safeStorage;
      const stored = storage.getItem('ecommerce-user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Erro ao carregar usuário:', e);
      return null;
    }
  }

  saveUser(userData) {
    try {
      const storage = window.safeStorage;
      storage.setItem('ecommerce-user', JSON.stringify(userData));
      this.user = userData;
      return true;
    } catch (e) {
      console.error('Erro ao salvar usuário:', e);
      return false;
    }
  }

  login(email, password) {
    // Simulação de login - Na produção, chamar API real
    if (!email || !password) {
      return { success: false, error: 'Email e senha são obrigatórios' };
    }

    const userData = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      loginDate: new Date().toISOString()
    };

    this.saveUser(userData);
    return { success: true, user: userData };
  }

  logout() {
    try {
      const storage = window.safeStorage;
      storage.removeItem('ecommerce-user');
    } catch (e) {
      console.warn('Erro ao remover usuário:', e);
    }
    this.user = null;
    return { success: true };
  }

  isAuthenticated() {
    return this.user !== null;
  }

  getUser() {
    return this.user;
  }
}

export const authService = new AuthService();

export async function initAuth() {
  console.log('🔧 Inicializando módulo de autenticação...');
  return authService;
}

export async function login(email, password) {
  return authService.login(email, password);
}

export async function logout() {
  return authService.logout();
}
