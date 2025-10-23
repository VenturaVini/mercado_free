# 🛒 Mercado Free v2.0.0

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Django](https://img.shields.io/badge/Django-5.0-green.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)

> Plataforma moderna de e-commerce com controle avançado de estoque e concorrência

---

## ✨ Destaques da Versão 2.0

### 🔒 Sistema de Controle de Concorrência
- **"Quem compra primeiro leva"**: Lock de banco de dados para compras simultâneas
- Mensagens claras quando produto esgota
- Atualização automática do estoque

### ⏰ Reserva Temporária de Estoque
- **10 minutos para pagar**: Prazo automático para finalizar compra
- Cancelamento automático de pedidos expirados
- Devolução inteligente ao estoque

### 🎨 Interface Modernizada
- Tema azul profissional
- Notificações toast em tempo real
- Contador regressivo em pedidos pendentes
- Imagens e informações completas

---

## 🚀 Início Rápido

### Pré-requisitos
- Docker e Docker Compose
- Git

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/mercadofree.git
cd mercadofree

# 2. Iniciar aplicação
./mercadofree.sh start

# 3. Popular banco de dados (opcional)
./mercadofree.sh populate
```

### Acessar

- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:8000
- 👨‍💼 **Admin Panel**: http://localhost:8000/admin

### Credenciais Padrão

```
Admin:     admin / admin123
Cliente:   cliente / cliente123
```

---

## 📚 Documentação

Para informações completas sobre arquitetura, setup, funcionalidades e sistema de controle de estoque, consulte:

**[📖 Documentação Completa](mercado_free_documentacao.md)**

Inclui:
- PRD completo e arquitetura do sistema
- Instruções de instalação e configuração
- Sistema de controle de concorrência
- Reserva temporária de estoque (10 minutos)
- Cancelamento automático de pedidos
- Guias de deploy e produção

---

## 🛠️ Tecnologias

### Backend
- **Django 5.0** - Framework web Python
- **Django REST Framework** - API REST
- **PostgreSQL 15** - Banco de dados
- **JWT** - Autenticação (djangorestframework-simplejwt)
- **Gunicorn** - Servidor WSGI

### Frontend
- **React 18.2** - Biblioteca UI
- **Vite 5.0** - Build tool e dev server
- **Tailwind CSS 3.3** - Framework CSS
- **React Router 6** - Roteamento
- **Axios** - Cliente HTTP
- **Context API** - Gerenciamento de estado

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **NGINX** - Reverse proxy (produção)

---

## 📦 Funcionalidades

### Para Clientes
- ✅ Catálogo de produtos com busca e filtros
- ✅ Carrinho de compras persistente
- ✅ Sistema de pedidos com código de retirada
- ✅ Múltiplos métodos de pagamento (PIX, Cartão, Boleto)
- ✅ Acompanhamento de pedidos em tempo real
- ✅ Contador regressivo para pagamento
- ✅ Notificações visuais de ações

### Para Administradores
- ✅ Painel administrativo completo
- ✅ CRUD de produtos e categorias
- ✅ Gerenciamento de pedidos
- ✅ Controle de estoque automático
- ✅ Relatórios e estatísticas
- ✅ Cancelamento manual de pedidos

### Sistema
- ✅ Controle de concorrência (SELECT FOR UPDATE)
- ✅ Expiração automática de pedidos (10 min)
- ✅ Devolução automática ao estoque
- ✅ Transações atômicas
- ✅ Validações robustas
- ✅ Logs detalhados

---

## 🎯 Casos de Uso

### 1️⃣ Compra Normal
```
Cliente → Adiciona ao carrinho → Finaliza compra → Paga → Recebe código
```

### 2️⃣ Concorrência (Último Produto)
```
Cliente A → Finaliza primeiro → ✅ Compra confirmada
Cliente B → Finaliza depois  → ❌ "Produto esgotado"
```

### 3️⃣ Expiração de Pedido
```
Cliente → Finaliza compra → NÃO paga → Após 10 min → Cancelamento automático → Estoque devolvido
```

---

## 💻 Comandos Úteis

```bash
# Gerais
./mercadofree.sh start          # Iniciar aplicação
./mercadofree.sh stop           # Parar aplicação
./mercadofree.sh restart        # Reiniciar
./mercadofree.sh logs           # Ver logs
./mercadofree.sh status         # Status dos containers

# Banco de Dados
./mercadofree.sh migrate        # Aplicar migrations
./mercadofree.sh populate       # Popular com dados
./mercadofree.sh backup         # Criar backup

# Administração
./mercadofree.sh shell          # Django shell
./mercadofree.sh cancel-expired # Cancelar pedidos expirados

# Relatórios
./mercadofree.sh orders-today   # Pedidos de hoje
./mercadofree.sh stock-report   # Relatório de estoque

# Ajuda
./mercadofree.sh help           # Ver todos os comandos
./mercadofree.sh info           # Informações do sistema
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      NGINX (Prod)                        │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼─────┐      ┌─────▼────┐
    │ Frontend │      │  Backend │
    │  React   │◄────►│  Django  │
    │  :5173   │      │  :8000   │
    └──────────┘      └─────┬────┘
                            │
                      ┌─────▼─────┐
                      │PostgreSQL │
                      │   :5432   │
                      └───────────┘
```

---

## 🔐 Segurança

- ✅ Autenticação JWT com refresh tokens
- ✅ CORS configurado adequadamente
- ✅ Proteção CSRF habilitada
- ✅ Transações atômicas em operações críticas
- ✅ Validação de permissões em todos endpoints
- ✅ Senhas com hash seguro (PBKDF2)

---

## 📊 Performance

- ✅ SELECT FOR UPDATE para locks eficientes
- ✅ F() expressions para updates atômicos
- ✅ Índices em campos críticos
- ✅ Queries otimizadas
- ✅ Paginação em listagens
- ✅ Docker multi-stage builds (produção)

---

## 🚀 Deploy em Produção

### Checklist Rápido

```bash
# 1. Configurar variáveis de ambiente
export DEBUG=False
export SECRET_KEY="chave-super-secreta"
export ALLOWED_HOSTS="seudominio.com"

# 2. Coletar arquivos estáticos
./mercadofree.sh collectstatic

# 3. Configurar cron job para expiração
*/5 * * * * /caminho/mercadofree.sh cancel-expired

# 4. Configurar backup automático
0 2 * * * /caminho/mercadofree.sh backup

# 5. Configurar NGINX + SSL
# Ver documentação completa
```

### Detalhes Completos
Consulte [mercado_free_documentacao.md](mercado_free_documentacao.md) para instruções detalhadas de deploy.

---

## 🧪 Testes

```bash
# Backend
docker-compose exec backend python manage.py test

# Frontend
docker-compose exec frontend npm test

# Testes de integração
# Ver documentação completa
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Add: Nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **Vinicius Ventura** - *Desenvolvimento Inicial*

---

## 🆘 Suporte

Dúvidas? Consulte a [📖 Documentação Completa](mercado_free_documentacao.md) que inclui:
- Guias de instalação e uso
- Troubleshooting completo
- Exemplos de código
- Configurações de produção

---

## 🎉 Agradecimentos

- Comunidade Django
- Comunidade React
- Todos os contribuidores

---

## 📈 Roadmap

### v2.1.0 (Próxima)
- [ ] Sistema de notificações por email
- [ ] Fila de espera para produtos esgotados
- [ ] Dashboard de analytics
- [ ] Exportação de relatórios

### v2.2.0
- [ ] Sistema de cupons de desconto
- [ ] Avaliações de produtos
- [ ] Wishlist
- [ ] Histórico de preços

### v3.0.0
- [ ] App mobile (React Native)
- [ ] Gateway de pagamento real
- [ ] Sistema de frete
- [ ] Marketplace multi-vendor

---

<p align="center">
  <strong>Feito com ❤️ usando Django e React</strong>
</p>

<p align="center">
  <a href="https://github.com/seu-usuario/mercadofree">⭐ Star no GitHub</a> •
  <a href="https://github.com/seu-usuario/mercadofree/issues">🐛 Reportar Bug</a> •
  <a href="https://github.com/seu-usuario/mercadofree/issues">💡 Sugerir Feature</a>
</p>
