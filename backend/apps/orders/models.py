from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Product
import random
import string

User = get_user_model()


def generate_pickup_code():
    """Gera código de retirada de 4 dígitos"""
    return ''.join(random.choices(string.digits, k=4))


class Order(models.Model):
    """
    Pedidos realizados pelos clientes
    Sistema de reserva: pedidos pendentes expiram em 10 minutos
    """
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('paid', 'Pago'),
        ('processing', 'Em Processamento'),
        ('ready', 'Pronto para Retirada'),
        ('completed', 'Concluído'),
        ('cancelled', 'Cancelado'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('pix', 'PIX'),
        ('credit_card', 'Cartão de Crédito'),
        ('debit_card', 'Cartão de Débito'),
        ('boleto', 'Boleto'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Cliente'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Status'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='pix',
        verbose_name='Método de Pagamento'
    )
    installments = models.IntegerField(
        default=1,
        verbose_name='Parcelas'
    )
    coupon = models.ForeignKey(
        'coupons.Coupon',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='Cupom Aplicado'
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Desconto Aplicado'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Valor Total'
    )
    pickup_code = models.CharField(
        max_length=4,
        unique=True,
        default=generate_pickup_code,
        verbose_name='Código de Retirada'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Observações')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='Expira em')
    
    # Manual release fields
    manual_release = models.BooleanField(
        default=False,
        verbose_name='Liberação Manual'
    )
    release_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name='Motivo da Liberação Manual'
    )
    release_image = models.ImageField(
        upload_to='orders/release_images/',
        blank=True,
        null=True,
        verbose_name='Comprovante da Liberação'
    )
    released_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='released_orders',
        verbose_name='Liberado por'
    )
    released_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Liberado em'
    )
    
    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pedido #{self.id} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        """
        Define data de expiração para pedidos pendentes (10 minutos)
        Cria histórico de status
        """
        is_new = not self.pk
        old_status = None
        
        if not is_new:
            try:
                old_status = Order.objects.get(pk=self.pk).status
            except Order.DoesNotExist:
                pass
        
        if is_new and self.status == 'pending':
            self.expires_at = timezone.now() + timedelta(minutes=10)
        
        super().save(*args, **kwargs)
        
        # Criar histórico de status
        if is_new or (old_status and old_status != self.status):
            OrderStatusHistory.objects.create(
                order=self,
                status=self.status,
                changed_by=None  # Será atualizado pela view quando necessário
            )
    
    def is_expired(self):
        """Verifica se o pedido pendente expirou"""
        if self.status == 'pending' and self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def cancel_if_expired(self):
        """Cancela o pedido se estiver expirado e devolve estoque"""
        if self.is_expired():
            self.status = 'cancelled'
            self.save()
            # Devolver produtos ao estoque
            for item in self.items.all():
                item.product.stock += item.quantity
                item.product.save()
            return True
        return False
    
    def get_installment_value(self):
        """Retorna o valor de cada parcela"""
        if self.installments > 1:
            return self.total_amount / self.installments
        return self.total_amount
    
    def get_installment_display(self):
        """Retorna string formatada das parcelas"""
        if self.installments == 1:
            return f"À vista: R$ {self.total_amount:.2f}"
        else:
            installment_value = self.get_installment_value()
            return f"{self.installments}x de R$ {installment_value:.2f}"


class OrderItem(models.Model):
    """
    Items de um pedido
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Pedido'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        verbose_name='Produto'
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name='Quantidade')
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Preço Unitário'
    )
    
    class Meta:
        verbose_name = 'Item do Pedido'
        verbose_name_plural = 'Itens do Pedido'
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    @property
    def subtotal(self):
        return self.quantity * self.price


class OrderStatusHistory(models.Model):
    """
    Histórico de mudanças de status do pedido
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='status_history',
        verbose_name='Pedido'
    )
    status = models.CharField(
        max_length=20,
        choices=Order.STATUS_CHOICES,
        verbose_name='Status'
    )
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Alterado por'
    )
    note = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observação'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data da mudança'
    )
    
    class Meta:
        verbose_name = 'Histórico de Status'
        verbose_name_plural = 'Históricos de Status'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pedido #{self.order.id} - {self.get_status_display()} em {self.created_at}"
