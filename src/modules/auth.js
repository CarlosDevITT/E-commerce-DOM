// src/modules/auth.js - Autenticação básica

class AuthService {
  constructor() {
    this.user = this.loadUser();
  }

  loadUser() {
    try {
      const stored = localStorage.getItem('ecommerce-user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Erro ao carregar usuário:', e);
      return null;
    }
  }

  saveUser(userData) {
    try {
      localStorage.setItem('ecommerce-user', JSON.stringify(userData));
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
    localStorage.removeItem('ecommerce-user');
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
