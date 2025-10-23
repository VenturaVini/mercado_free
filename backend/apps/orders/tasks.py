"""
Tasks para execução automática periódica
Execute este comando a cada 1-5 minutos via cron ou scheduler:
  python manage.py cancel_expired_orders
"""
from django.utils import timezone
from .models import Order


def cancel_expired_orders():
    """
    Cancela pedidos pendentes que expiraram (>10 minutos)
    Retorna quantidade de pedidos cancelados
    """
    expired_orders = Order.objects.filter(
        status='pending',
        expires_at__lt=timezone.now()
    )
    
    count = 0
    for order in expired_orders:
        if order.cancel_if_expired():
            count += 1
    
    return count
