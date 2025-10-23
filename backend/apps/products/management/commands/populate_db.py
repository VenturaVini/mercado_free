from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de exemplo'

    def handle(self, *args, **kwargs):
        self.stdout.write('Criando dados de exemplo...')

        # Criar usuários
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='admin123',
                role='admin',
                first_name='Admin',
                last_name='Sistema'
            )
            self.stdout.write(self.style.SUCCESS('✓ Admin criado'))
        
        if not User.objects.filter(username='cliente').exists():
            cliente = User.objects.create_user(
                username='cliente',
                email='cliente@example.com',
                password='cliente123',
                role='cliente',
                first_name='João',
                last_name='Silva'
            )
            self.stdout.write(self.style.SUCCESS('✓ Cliente criado'))

        # Criar categorias
        categorias_data = [
            {'name': 'Smartphones', 'description': 'Celulares e smartphones'},
            {'name': 'Notebooks', 'description': 'Notebooks e laptops'},
            {'name': 'TVs', 'description': 'Televisores e Smart TVs'},
            {'name': 'Áudio', 'description': 'Fones, caixas de som e áudio'},
            {'name': 'Acessórios', 'description': 'Acessórios diversos'},
        ]

        categorias = {}
        for cat_data in categorias_data:
            cat, created = Category.objects.get_or_create(**cat_data)
            categorias[cat.name] = cat
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Categoria {cat.name} criada'))

        # Criar produtos
        produtos_data = [
            {
                'name': 'iPhone 15 Pro Max 256GB',
                'description': 'Smartphone Apple iPhone 15 Pro Max com 256GB, câmera profissional e chip A17 Pro',
                'price': 8999.00,
                'stock': 15,
                'category': categorias['Smartphones'],
            },
            {
                'name': 'Samsung Galaxy S24 Ultra',
                'description': 'Samsung Galaxy S24 Ultra 512GB, tela AMOLED 6.8", S Pen inclusa',
                'price': 7499.00,
                'stock': 20,
                'category': categorias['Smartphones'],
            },
            {
                'name': 'MacBook Pro M3 14"',
                'description': 'MacBook Pro 14" com chip M3, 16GB RAM, 512GB SSD',
                'price': 15999.00,
                'stock': 8,
                'category': categorias['Notebooks'],
            },
            {
                'name': 'Dell XPS 15',
                'description': 'Dell XPS 15 Intel i7, 32GB RAM, 1TB SSD, RTX 4050',
                'price': 12999.00,
                'stock': 12,
                'category': categorias['Notebooks'],
            },
            {
                'name': 'Smart TV Samsung 65" QLED',
                'description': 'Smart TV Samsung 65" QLED 4K, HDR10+, Tizen OS',
                'price': 4999.00,
                'stock': 10,
                'category': categorias['TVs'],
            },
            {
                'name': 'LG OLED 55" C3',
                'description': 'Smart TV LG OLED 55" C3, 4K, 120Hz, HDMI 2.1',
                'price': 5999.00,
                'stock': 7,
                'category': categorias['TVs'],
            },
            {
                'name': 'AirPods Pro 2ª Geração',
                'description': 'Fone Apple AirPods Pro com cancelamento de ruído ativo',
                'price': 2199.00,
                'stock': 30,
                'category': categorias['Áudio'],
            },
            {
                'name': 'Sony WH-1000XM5',
                'description': 'Headphone Sony WH-1000XM5 com cancelamento de ruído premium',
                'price': 2499.00,
                'stock': 25,
                'category': categorias['Áudio'],
            },
            {
                'name': 'JBL Flip 6',
                'description': 'Caixa de som portátil JBL Flip 6, Bluetooth, à prova d\'água',
                'price': 699.00,
                'stock': 40,
                'category': categorias['Áudio'],
            },
            {
                'name': 'Apple Watch Series 9',
                'description': 'Apple Watch Series 9 GPS 45mm, caixa de alumínio',
                'price': 4299.00,
                'stock': 18,
                'category': categorias['Acessórios'],
            },
        ]

        for prod_data in produtos_data:
            prod, created = Product.objects.get_or_create(
                name=prod_data['name'],
                defaults=prod_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Produto {prod.name} criado'))

        self.stdout.write(self.style.SUCCESS('\n✅ Banco de dados populado com sucesso!'))
        self.stdout.write('\n📝 Credenciais criadas:')
        self.stdout.write('   Admin: admin / admin123')
        self.stdout.write('   Cliente: cliente / cliente123')
