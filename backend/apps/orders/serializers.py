from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory
from apps.products.serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price', 'subtotal']
        read_only_fields = ['id', 'price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    installment_value = serializers.SerializerMethodField()
    installment_display = serializers.CharField(source='get_installment_display', read_only=True)
    released_by_name = serializers.CharField(source='released_by.username', read_only=True)
    status_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_name', 'status', 'status_display', 'payment_method', 
            'payment_method_display', 'installments', 'installment_value', 'installment_display',
            'total_amount', 'pickup_code', 'notes', 'items', 
            'created_at', 'updated_at', 'expires_at', 'is_expired', 'time_remaining',
            'manual_release', 'release_reason', 'release_image', 'released_by', 
            'released_by_name', 'released_at', 'status_history'
        ]
        read_only_fields = ['id', 'user', 'pickup_code', 'created_at', 'updated_at', 
                            'expires_at', 'released_by', 'released_at']
    
    def get_is_expired(self, obj):
        """Verifica se o pedido está expirado"""
        return obj.is_expired()
    
    def get_time_remaining(self, obj):
        """Retorna tempo restante em segundos (apenas para pedidos pendentes)"""
        if obj.status == 'pending' and obj.expires_at:
            from django.utils import timezone
            remaining = (obj.expires_at - timezone.now()).total_seconds()
            return max(0, int(remaining))
        return None
    
    def get_installment_value(self, obj):
        """Retorna o valor de cada parcela"""
        return float(obj.get_installment_value())
    
    def get_status_history(self, obj):
        """Retorna apenas os últimos 3 registros do histórico"""
        history = obj.status_history.all()[:3]
        return OrderStatusHistorySerializer(history, many=True).data


class CreateOrderSerializer(serializers.Serializer):
    """
    Serializer para criação de pedido
    """
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        )
    )
    notes = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(
        choices=Order.PAYMENT_METHOD_CHOICES,
        default='pix'
    )
    installments = serializers.IntegerField(default=1, min_value=1, max_value=12)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("O pedido deve conter pelo menos um item.")
        
        for item in value:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError(
                    "Cada item deve ter 'product_id' e 'quantity'."
                )
            if item['quantity'] <= 0:
                raise serializers.ValidationError("A quantidade deve ser maior que zero.")
        
        return value


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'status_display', 'changed_by', 'changed_by_name', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']
