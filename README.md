# ECOMMERCE DOM 🛍️

Um e-commerce modular, mobile-first, PWA-ready com IA integrada. Desenvolvido com HTML5, CSS3 moderno, JavaScript ES6+, Supabase e SweetAlert2.

## ✨ Características

- **Mobile-First**: Layout responsivo otimizado para dispositivos móveis
- **PWA**: Progressive Web App com suporte offline via Service Worker
- **Dark Theme Moderno**: Paleta de cores preta com degradê azul escuro
- **Chat IA**: Interface de chat simulado pronta para integração com APIs reais
- **Carrinho de Compras**: Sistema completo com localStorage persistente
- **Sistema Modular**: Arquitetura limpa e escalável
- **Performance**: Cache inteligente e otimizações de carregamento

## 📁 Estrutura de Pastas

```
ECOMMERCE DOM/
├── index.html                 # HTML principal
├── manifest.json              # Configuração PWA
├── sw.js                      # Service Worker
├── styles/
│   ├── main.css              # CSS global
│   ├── main-cart.css         # Estilos do carrinho
│   └── components/
│       ├── sidebar.css       # Bottom Navigation
│       ├── chat.css          # Chat IA
│       └── products.css      # Cards de produtos
├── src/
│   ├── app.js               # Inicializador
│   ├── config/
│   │   ├── supabase.js      # Config Supabase
│   │   └── ai_config.js     # Config IA
│   └── modules/
│       ├── auth.js          # Autenticação
│       ├── products.js      # Lógica de produtos
│       ├── cart.js          # Sistema de carrinho
│       ├── chat.js          # Chat IA
│       ├── ui.js            # Controle de UI
│       └── pwa_handler.js   # PWA utils
└── assets/
    ├── icons/               # Ícones PWA
    └── img/                 # Imagens dos produtos
```

## 🚀 Como Começar

### 1. Instalação

```bash
# Clone ou baixe o projeto
cd ECOMMERCE DOM

# Sirva o arquivo localmente (use Live Server ou similar)
# VS Code: Clique em "Go Live"
# Ou use: npx http-server
```

### 2. Configuração

#### Supabase
1. Crie uma conta em [supabase.com](https://supabase.com)
2. Copie sua URL e Anon Key
3. Atualize `src/config/supabase.js`:
```javascript
const SUPABASE_URL = 'sua-url-aqui';
const SUPABASE_KEY = 'sua-chave-aqui';
```

#### API de IA
1. Obtenha uma chave em [OpenAI](https://openai.com) ou similar
2. Atualize `src/config/ai_config.js`:
```javascript
const AI_API_KEY = 'sua-chave-aqui';
```

### 3. Desenvolvimento

```javascript
// Todos os módulos são importados em app.js
// Abra o console do navegador para ver logs

// O carrinho é salvo em localStorage automaticamente
// Acesse: localStorage.getItem('ecommerce-cart')

// O usuário é salvo em localStorage
// Acesse: localStorage.getItem('ecommerce-user')
```

## 📦 Principais Módulos

### products.js
```javascript
import { products, renderProducts } from './modules/products.js';

// Acessar produtos
console.log(products);

// Renderizar na página
renderProducts(container);
```

### cart.js
```javascript
import { addToCart, renderCartModal, updateCartBadge } from './modules/cart.js';

// Adicionar ao carrinho
addToCart(product);

// Mostrar modal
renderCartModal();

// Atualizar badge
updateCartBadge();
```

### chat.js
```javascript
import { initChatWidget } from './modules/chat.js';

// Inicializar chat
initChatWidget();

// Respostas customizadas em getAIResponse()
```

### auth.js
```javascript
import { authService } from './modules/auth.js';

// Login
authService.login('user@email.com', 'password');

// Logout
authService.logout();

// Verificar se autenticado
authService.isAuthenticated();
```

## 🎨 Customização

### Cores
Edite as variáveis CSS em `styles/main.css`:
```css
:root {
  --bg-900: #020617;      /* Fundo escuro */
  --blue-500: #2563eb;    /* Azul primário */
  --text-primary: #e2e8f0; /* Texto claro */
  /* ... mais cores ... */
}
```

### Produtos
Edite `src/modules/products.js`:
```javascript
export const products = [
  {
    id: 1,
    name: 'Seu Produto',
    price: 99.90,
    discount: 15,
    image: 'url-imagem',
    description: 'Descrição',
    rating: 4.5,
    reviews: 100,
    inStock: true
  }
];
```

## 🔧 Recursos Avançados

### Service Worker
O `sw.js` implementa:
- Cache de assets estáticos
- Network-first strategy com fallback
- Sincronização offline

### PWA
Suporta:
- Instalação como app nativo
- Modo offline
- Sincronização em background

### Responsividade
Breakpoints:
- Mobile: até 600px
- Tablet: 600px - 1000px
- Desktop: acima de 1000px

## 📊 Performance

- **Lighthouse Score**: ~90+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cache Strategy**: Network-first com fallback

## 🤝 Integração APIs

### Supabase
```javascript
// Implementar queries para seu banco
supabaseAPI.fetchProducts();
supabaseAPI.saveCart(data);
supabaseAPI.saveOrder(data);
```

### OpenAI
```javascript
// Chamar API de IA
callAIAPI('Sua mensagem').then(response => {
  console.log(response);
});
```

## 🐛 Troubleshooting

**Service Worker não carrega?**
- Verifique que está em HTTPS ou localhost
- Limpe o cache: DevTools > Application > Clear storage

**Carrinho vazio ao recarregar?**
- Verifique localStorage em DevTools > Application > Local Storage
- Confirme que localStorage está habilitado

**Chat não funciona?**
- Verifique a chave de API em ai_config.js
- Abra o console (F12) para ver erros

## 📝 Licença

Este projeto é de código aberto para fins educacionais.

## 👨‍💻 Autor

Desenvolvido com ❤️ para e-commerce modernos.

---

**Dúvidas?** Abra uma issue ou entre em contato!
