from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_id', 'method', 'status',
            'amount', 'transaction_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'transaction_id', 'created_at', 'updated_at']


class CreatePaymentSerializer(serializers.Serializer):
    """
    Serializer para criar um pagamento (simulado)
    """
    order_id = serializers.IntegerField()
    method = serializers.ChoiceField(choices=Payment.METHOD_CHOICES)
    
    def validate_order_id(self, value):
        from apps.orders.models import Order
        try:
            order = Order.objects.get(id=value)
            if hasattr(order, 'payment'):
                raise serializers.ValidationError("Este pedido já possui um pagamento.")
            if order.status != 'pending':
                raise serializers.ValidationError("Este pedido não está pendente.")
        except Order.DoesNotExist:
            raise serializers.ValidationError("Pedido não encontrado.")
        return value
