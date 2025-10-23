from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


class Coupon(models.Model):
    """
    Cupons de desconto com validade e limite de uso
    """
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Porcentagem'),
        ('fixed', 'Valor Fixo'),
    ]
    
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Código do Cupom'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Descrição'
    )
    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default='percentage',
        verbose_name='Tipo de Desconto'
    )
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Valor do Desconto'
    )
    min_purchase = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Compra Mínima'
    )
    max_uses = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        verbose_name='Limite de Usos',
        help_text='Deixe em branco para uso ilimitado'
    )
    used_count = models.IntegerField(
        default=0,
        verbose_name='Vezes Usado'
    )
    valid_from = models.DateTimeField(
        verbose_name='Válido de'
    )
    valid_until = models.DateTimeField(
        verbose_name='Válido até'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Ativo'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Criado em'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Atualizado em'
    )
    
    class Meta:
        verbose_name = 'Cupom'
        verbose_name_plural = 'Cupons'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.get_discount_display()}"
    
    def is_valid(self):
        """Verifica se o cupom está válido"""
        now = timezone.now()
        
        # Verificar se está ativo
        if not self.is_active:
            return False, "Cupom inativo"
        
        # Verificar data de validade
        if now < self.valid_from:
            return False, "Cupom ainda não está válido"
        
        if now > self.valid_until:
            return False, "Cupom expirado"
        
        # Verificar limite de usos
        if self.max_uses and self.used_count >= self.max_uses:
            return False, "Limite de usos atingido"
        
        return True, "Cupom válido"
    
    def get_discount_display(self):
        """Retorna string formatada do desconto"""
        if self.discount_type == 'percentage':
            return f"{self.discount_value}% de desconto"
        else:
            return f"R$ {self.discount_value:.2f} de desconto"
    
    def calculate_discount(self, total_amount):
        """Calcula o valor do desconto para um total"""
        if self.discount_type == 'percentage':
            discount = (total_amount * self.discount_value) / 100
        else:
            discount = self.discount_value
        
        # Não permitir desconto maior que o total
        return min(discount, total_amount)
    
    def apply(self, total_amount):
        """Aplica o cupom e retorna o novo total"""
        is_valid, message = self.is_valid()
        
        if not is_valid:
            return None, message
        
        if total_amount < self.min_purchase:
            return None, f"Compra mínima de R$ {self.min_purchase:.2f} não atingida"
        
        discount = self.calculate_discount(total_amount)
        new_total = total_amount - discount
        
        return {
            'original_total': float(total_amount),
            'discount': float(discount),
            'new_total': float(new_total),
            'coupon_code': self.code
        }, "Cupom aplicado com sucesso"
    
    def increment_usage(self):
        """Incrementa o contador de usos"""
        self.used_count += 1
        self.save()
