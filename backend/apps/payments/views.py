from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Payment
from apps.orders.models import Order
from .serializers import PaymentSerializer, CreatePaymentSerializer
import uuid
import random


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar pagamentos
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(order__user=user)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Cria um pagamento (simulado)
        """
        serializer = CreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order_id = serializer.validated_data['order_id']
        method = serializer.validated_data.get('method')
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Pedido não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar se o pedido não expirou
        if order.is_expired():
            order.cancel_if_expired()
            return Response(
                {'error': 'Este pedido expirou após 10 minutos sem pagamento. Os produtos foram devolvidos ao estoque.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se o usuário é o dono do pedido
        if order.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Você não tem permissão para pagar este pedido.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verificar se o pedido já foi pago
        if order.status != 'pending':
            return Response(
                {'error': f'Este pedido já está com status: {order.get_status_display()}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Usar o método de pagamento do pedido se não for especificado
        if not method:
            method = order.payment_method
        
        # Simular processamento de pagamento
        transaction_id = str(uuid.uuid4())
        
        # 90% de chance de aprovação (simulação)
        is_approved = random.random() > 0.1
        
        payment = Payment.objects.create(
            order=order,
            method=method,
            amount=order.total_amount,
            transaction_id=transaction_id,
            status='approved' if is_approved else 'rejected'
        )
        
        # Atualizar status do pedido
        if is_approved:
            order.status = 'paid'
            order.save()
        else:
            # Se rejeitado, devolver produtos ao estoque
            order.status = 'cancelled'
            order.save()
            from django.db.models import F
            from apps.products.models import Product
            for item in order.items.all():
                Product.objects.filter(id=item.product.id).update(
                    stock=F('stock') + item.quantity
                )
        
        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def simulate_approval(self, request, pk=None):
        """
        Simula aprovação de pagamento pendente
        """
        payment = self.get_object()
        
        if payment.status != 'pending':
            return Response(
                {'error': 'Pagamento não está pendente.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment.status = 'approved'
        payment.transaction_id = str(uuid.uuid4())
        payment.save()
        
        # Atualizar pedido
        payment.order.status = 'paid'
        payment.order.save()
        
        return Response(PaymentSerializer(payment).data)
