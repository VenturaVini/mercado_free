#!/bin/bash
# Script helper para Mercado Free
# Uso: ./mercadofree.sh [comando]

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Comandos disponíveis
show_help() {
    cat << EOF
🛒 Mercado Free - Script de Gerenciamento
Versão: $(cat VERSION 2>/dev/null || echo "?.?.?")

Uso: ./mercadofree.sh [comando]

📦 DOCKER:
  start              Inicia todos os containers
  stop               Para todos os containers
  restart            Reinicia todos os containers
  logs               Mostra logs de todos os containers
  logs-backend       Mostra logs apenas do backend
  logs-frontend      Mostra logs apenas do frontend
  status             Mostra status dos containers

🗄️  BANCO DE DADOS:
  migrate            Aplica migrations
  makemigrations     Cria novas migrations
  reset-db           CUIDADO: Apaga e recria o banco de dados
  populate           Popula banco com dados de exemplo
  backup             Cria backup do banco de dados

🔧 BACKEND:
  shell              Abre shell Django
  createsuperuser    Cria usuário administrador
  cancel-expired     Cancela pedidos expirados manualmente
  collectstatic      Coleta arquivos estáticos (produção)

📊 RELATÓRIOS:
  orders-today       Mostra pedidos de hoje
  orders-pending     Mostra pedidos pendentes
  orders-expired     Mostra pedidos expirados
  stock-report       Relatório de estoque

🧹 LIMPEZA:
  clean              Remove containers, volumes e imagens
  clean-pyc          Remove arquivos .pyc
  clean-logs         Limpa arquivos de log

ℹ️  INFORMAÇÕES:
  version            Mostra versão do projeto
  info               Mostra informações do sistema
  help               Mostra esta mensagem

Exemplos:
  ./mercadofree.sh start
  ./mercadofree.sh migrate
  ./mercadofree.sh orders-today

EOF
}

# Comandos Docker
cmd_start() {
    echo_info "Iniciando containers..."
    docker-compose up -d
    echo_success "Containers iniciados!"
    echo_info "Frontend: http://localhost:5173"
    echo_info "Backend: http://localhost:8000"
    echo_info "Admin: http://localhost:8000/admin"
}

cmd_stop() {
    echo_info "Parando containers..."
    docker-compose down
    echo_success "Containers parados!"
}

cmd_restart() {
    echo_info "Reiniciando containers..."
    docker-compose restart
    echo_success "Containers reiniciados!"
}

cmd_logs() {
    docker-compose logs -f
}

cmd_logs_backend() {
    docker-compose logs -f backend
}

cmd_logs_frontend() {
    docker-compose logs -f frontend
}

cmd_status() {
    echo_info "Status dos containers:"
    docker-compose ps
}

# Comandos de Banco de Dados
cmd_migrate() {
    echo_info "Aplicando migrations..."
    docker-compose exec backend python manage.py migrate
    echo_success "Migrations aplicadas!"
}

cmd_makemigrations() {
    echo_info "Criando migrations..."
    docker-compose exec backend python manage.py makemigrations
    echo_success "Migrations criadas!"
}

cmd_reset_db() {
    echo_warning "ATENÇÃO: Isso vai APAGAR TODOS OS DADOS!"
    read -p "Tem certeza? (digite 'sim' para confirmar): " confirm
    if [ "$confirm" = "sim" ]; then
        echo_info "Parando containers..."
        docker-compose down
        echo_info "Removendo volume do banco..."
        docker volume rm lojinha_pgdata 2>/dev/null || true
        echo_info "Recriando containers..."
        docker-compose up -d
        sleep 5
        echo_info "Aplicando migrations..."
        docker-compose exec backend python manage.py migrate
        echo_success "Banco de dados resetado!"
        echo_warning "Não esqueça de popular com dados de exemplo: ./mercadofree.sh populate"
    else
        echo_error "Operação cancelada."
        exit 1
    fi
}

cmd_populate() {
    echo_info "Populando banco com dados de exemplo..."
    docker-compose exec backend python manage.py populate_db
    echo_success "Banco populado!"
}

cmd_backup() {
    BACKUP_DIR="backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/mercadofree_$(date +%Y%m%d_%H%M%S).sql"
    
    echo_info "Criando backup em: $BACKUP_FILE"
    docker-compose exec -T db pg_dump -U postgres mercadofree > "$BACKUP_FILE"
    echo_success "Backup criado com sucesso!"
    echo_info "Arquivo: $BACKUP_FILE"
}

# Comandos Backend
cmd_shell() {
    echo_info "Abrindo Django shell..."
    docker-compose exec backend python manage.py shell
}

cmd_createsuperuser() {
    echo_info "Criando superusuário..."
    docker-compose exec backend python manage.py createsuperuser
}

cmd_cancel_expired() {
    echo_info "Cancelando pedidos expirados..."
    docker-compose exec backend python manage.py cancel_expired_orders
}

cmd_collectstatic() {
    echo_info "Coletando arquivos estáticos..."
    docker-compose exec backend python manage.py collectstatic --noinput
    echo_success "Arquivos estáticos coletados!"
}

# Comandos de Relatórios
cmd_orders_today() {
    echo_info "Pedidos de hoje:"
    docker-compose exec backend python manage.py shell << EOF
from apps.orders.models import Order
from django.utils import timezone

today = timezone.now().date()
orders = Order.objects.filter(created_at__date=today)

print(f"\n📊 Total de pedidos hoje: {orders.count()}\n")

for order in orders:
    print(f"Pedido #{order.id} - {order.user.username}")
    print(f"  Status: {order.get_status_display()}")
    print(f"  Total: R\$ {order.total_amount}")
    print(f"  Criado: {order.created_at.strftime('%H:%M:%S')}")
    print()
EOF
}

cmd_orders_pending() {
    echo_info "Pedidos pendentes:"
    docker-compose exec backend python manage.py shell << EOF
from apps.orders.models import Order

pending = Order.objects.filter(status='pending')

print(f"\n⏳ Total de pedidos pendentes: {pending.count()}\n")

for order in pending:
    print(f"Pedido #{order.id} - {order.user.username}")
    print(f"  Total: R\$ {order.total_amount}")
    print(f"  Expira em: {order.expires_at.strftime('%d/%m/%Y %H:%M:%S') if order.expires_at else 'N/A'}")
    print(f"  Expirado: {'Sim' if order.is_expired() else 'Não'}")
    print()
EOF
}

cmd_orders_expired() {
    echo_info "Pedidos expirados (ainda não cancelados):"
    docker-compose exec backend python manage.py shell << EOF
from apps.orders.models import Order
from django.utils import timezone

expired = Order.objects.filter(
    status='pending',
    expires_at__lt=timezone.now()
)

print(f"\n⏰ Total de pedidos expirados: {expired.count()}\n")

for order in expired:
    print(f"Pedido #{order.id} - {order.user.username}")
    print(f"  Total: R\$ {order.total_amount}")
    print(f"  Expirou em: {order.expires_at.strftime('%d/%m/%Y %H:%M:%S')}")
    print()

if expired.count() > 0:
    print("💡 Execute: ./mercadofree.sh cancel-expired")
EOF
}

cmd_stock_report() {
    echo_info "Relatório de Estoque:"
    docker-compose exec backend python manage.py shell << EOF
from apps.products.models import Product

products = Product.objects.filter(is_active=True).order_by('stock')

print(f"\n📦 Total de produtos ativos: {products.count()}\n")
print(f"{'Produto':<30} {'Estoque':>10} {'Status':<15}")
print("-" * 60)

for product in products:
    status = "🔴 ESGOTADO" if product.stock == 0 else "🟡 BAIXO" if product.stock < 5 else "🟢 OK"
    print(f"{product.name:<30} {product.stock:>10} {status:<15}")
EOF
}

# Comandos de Limpeza
cmd_clean() {
    echo_warning "Isso vai remover TODOS os containers, volumes e imagens!"
    read -p "Tem certeza? (digite 'sim' para confirmar): " confirm
    if [ "$confirm" = "sim" ]; then
        echo_info "Limpando..."
        docker-compose down -v --rmi all
        echo_success "Limpeza concluída!"
    else
        echo_error "Operação cancelada."
        exit 1
    fi
}

cmd_clean_pyc() {
    echo_info "Removendo arquivos .pyc..."
    find backend -name "*.pyc" -delete
    find backend -name "__pycache__" -type d -delete
    echo_success "Arquivos .pyc removidos!"
}

cmd_clean_logs() {
    echo_info "Limpando logs..."
    rm -rf logs/*.log
    echo_success "Logs limpos!"
}

# Comandos de Informações
cmd_version() {
    VERSION=$(cat VERSION 2>/dev/null || echo "?.?.?")
    echo "Mercado Free v$VERSION"
}

cmd_info() {
    VERSION=$(cat VERSION 2>/dev/null || echo "?.?.?")
    cat << EOF

🛒 Mercado Free v$VERSION

📊 Informações do Sistema:
  - Django: 5.0
  - Python: 3.12
  - Node: 22
  - PostgreSQL: 15
  - React: 18.2
  - Vite: 5.0
  - Tailwind: 3.3

🌐 URLs:
  - Frontend: http://localhost:5173
  - Backend: http://localhost:8000
  - API Docs: http://localhost:8000/api/
  - Admin: http://localhost:8000/admin

👥 Usuários Padrão:
  - Admin: admin / admin123
  - Cliente: cliente / cliente123

📁 Estrutura:
  - Backend: ./backend/
  - Frontend: ./frontend/
  - Docs: ./mercado_free_documentacao.md
  - Estoque: ./CONTROLE_ESTOQUE.md
  - Changes: ./CHANGELOG.md

EOF
}

# Main
case "${1:-help}" in
    # Docker
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_restart ;;
    logs) cmd_logs ;;
    logs-backend) cmd_logs_backend ;;
    logs-frontend) cmd_logs_frontend ;;
    status) cmd_status ;;
    
    # Banco de Dados
    migrate) cmd_migrate ;;
    makemigrations) cmd_makemigrations ;;
    reset-db) cmd_reset_db ;;
    populate) cmd_populate ;;
    backup) cmd_backup ;;
    
    # Backend
    shell) cmd_shell ;;
    createsuperuser) cmd_createsuperuser ;;
    cancel-expired) cmd_cancel_expired ;;
    collectstatic) cmd_collectstatic ;;
    
    # Relatórios
    orders-today) cmd_orders_today ;;
    orders-pending) cmd_orders_pending ;;
    orders-expired) cmd_orders_expired ;;
    stock-report) cmd_stock_report ;;
    
    # Limpeza
    clean) cmd_clean ;;
    clean-pyc) cmd_clean_pyc ;;
    clean-logs) cmd_clean_logs ;;
    
    # Informações
    version) cmd_version ;;
    info) cmd_info ;;
    help|--help|-h) show_help ;;
    
    *)
        echo_error "Comando desconhecido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
