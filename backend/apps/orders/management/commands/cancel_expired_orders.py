from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.orders.models import Order


class Command(BaseCommand):
    help = 'Cancela pedidos pendentes expirados (mais de 10 minutos) e devolve produtos ao estoque'

    def handle(self, *args, **kwargs):
        expired_orders = Order.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        )
        
        count = 0
        for order in expired_orders:
            if order.cancel_if_expired():
                count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'Pedido #{order.id} cancelado (expirado). Estoque devolvido.'
                    )
                )
        
        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ {count} pedido(s) expirado(s) cancelado(s) com sucesso!'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('✅ Nenhum pedido expirado encontrado.')
            )
