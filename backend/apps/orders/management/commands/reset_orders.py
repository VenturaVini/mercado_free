from django.core.management.base import BaseCommand
from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.payments.models import Payment


class Command(BaseCommand):
    help = 'Reseta todos os pedidos, devolvendo produtos ao estoque e limpando dados'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirma a ação de resetar todos os pedidos',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠️  ATENÇÃO: Este comando irá DELETAR TODOS OS PEDIDOS!\n'
                    'Os produtos serão devolvidos ao estoque.\n\n'
                    'Para confirmar, execute:\n'
                    'python manage.py reset_orders --confirm\n'
                )
            )
            return

        self.stdout.write(self.style.WARNING('\n🔄 Iniciando reset de pedidos...\n'))

        # Contar antes
        total_orders = Order.objects.count()
        total_payments = Payment.objects.count()
        total_history = OrderStatusHistory.objects.count()

        # Devolver produtos ao estoque
        orders_with_items = Order.objects.prefetch_related('items__product').all()
        products_updated = 0

        for order in orders_with_items:
            for item in order.items.all():
                # Devolver ao estoque
                item.product.stock += item.quantity
                item.product.save()
                products_updated += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✓ Devolvido {item.quantity}x {item.product.name} ao estoque'
                    )
                )

        # Deletar histórico de status
        OrderStatusHistory.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'\n✓ {total_history} registros de histórico deletados')
        )

        # Deletar pagamentos
        Payment.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'✓ {total_payments} pagamentos deletados')
        )

        # Deletar itens de pedidos (cascade)
        OrderItem.objects.all().delete()
        
        # Deletar pedidos
        Order.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'✓ {total_orders} pedidos deletados')
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Reset concluído com sucesso!\n'
                f'   • Pedidos deletados: {total_orders}\n'
                f'   • Pagamentos deletados: {total_payments}\n'
                f'   • Histórico deletado: {total_history}\n'
                f'   • Produtos atualizados: {products_updated}\n'
            )
        )
