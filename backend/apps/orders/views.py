from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from .models import Order, OrderItem
from apps.products.models import Product
from .serializers import OrderSerializer, CreateOrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar pedidos com controle de concorrência e expiração
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna pedidos e cancela automaticamente os expirados"""
        user = self.request.user
        
        # Cancelar pedidos pendentes expirados
        expired_orders = Order.objects.filter(
            status='pending',
            expires_at__lt=timezone.now()
        )
        for order in expired_orders:
            order.cancel_if_expired()
        
        if user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=user)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Cria um novo pedido com controle de concorrência
        Sistema: Quem compra primeiro leva o produto
        """
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        items_data = serializer.validated_data['items']
        notes = serializer.validated_data.get('notes', '')
        payment_method = serializer.validated_data.get('payment_method', 'pix')
        installments = serializer.validated_data.get('installments', 1)
        
        # Calcular total e validar estoque COM LOCK (evita race condition)
        total_amount = 0
        order_items = []
        unavailable_products = []
        
        for item_data in items_data:
            try:
                # SELECT FOR UPDATE: bloqueia o produto durante a transação
                product = Product.objects.select_for_update().get(
                    id=item_data['product_id'],
                    is_active=True
                )
            except Product.DoesNotExist:
                return Response(
                    {'error': f"Produto {item_data['product_id']} não encontrado ou inativo."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            quantity = item_data['quantity']
            
            # Verificação atômica de estoque
            if product.stock < quantity:
                unavailable_products.append({
                    'name': product.name,
                    'requested': quantity,
                    'available': product.stock
                })
                continue
            
            subtotal = product.price * quantity
            total_amount += subtotal
            order_items.append({
                'product': product,
                'quantity': quantity,
                'price': product.price
            })
        
        # Se algum produto não está disponível, retorna erro detalhado
        if unavailable_products:
            error_msg = "Produtos indisponíveis:\n"
            for item in unavailable_products:
                if item['available'] == 0:
                    error_msg += f"• {item['name']}: ESGOTADO (outra pessoa comprou antes)\n"
                else:
                    error_msg += f"• {item['name']}: Solicitado {item['requested']}, disponível {item['available']}\n"
            
            return Response(
                {'error': error_msg.strip()},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Criar pedido
        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            notes=notes,
            payment_method=payment_method,
            installments=installments,
            status='pending'  # Inicia como pendente
        )
        
        # Criar items e RESERVAR estoque (diminuir)
        for item_data in order_items:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                quantity=item_data['quantity'],
                price=item_data['price']
            )
            # Atualizar estoque atomicamente
            Product.objects.filter(id=item_data['product'].id).update(
                stock=F('stock') - item_data['quantity']
            )
        
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def update_status(self, request, pk=None):
        """
        Atualiza o status de um pedido (apenas admin)
        Suporta liberação manual com justificativa e imagem
        Inclui validações de transição de status
        """
        order = self.get_object()
        new_status = request.data.get('status')
        current_status = order.status
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'error': 'Status inválido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validações de transição de status
        invalid_transitions = {
            'paid': ['pending'],  # Não pode voltar para pendente após pago
            'processing': ['pending', 'paid'],  # Não pode voltar
            'ready': ['pending', 'paid', 'processing'],  # Não pode voltar
            'completed': ['pending', 'paid', 'processing', 'ready'],  # Não pode voltar
        }
        
        if current_status in invalid_transitions:
            if new_status in invalid_transitions[current_status]:
                return Response(
                    {'error': f'Não é possível mudar de {order.get_status_display()} para {dict(Order.STATUS_CHOICES)[new_status]}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Verificar se é liberação manual
        release_reason = request.data.get('release_reason')
        release_image = request.FILES.get('release_image')
        
        if release_reason:
            # Liberação manual
            order.manual_release = True
            order.release_reason = release_reason
            order.released_by = request.user
            order.released_at = timezone.now()
            
            if release_image:
                order.release_image = release_image
        
        # Se cancelar após pagamento, adicionar nota de reembolso
        note = None
        if new_status == 'cancelled' and current_status in ['paid', 'processing', 'ready']:
            note = f'Pedido cancelado. Reembolso emitido em {timezone.now().strftime("%d/%m/%Y às %H:%M:%S")}'
        
        order.status = new_status
        order.save()
        
        # Atualizar histórico com usuário e nota
        latest_history = order.status_history.first()
        if latest_history:
            latest_history.changed_by = request.user
            if note:
                latest_history.note = note
            latest_history.save()
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancela um pedido e devolve produtos ao estoque
        Usuário pode cancelar apenas pedidos pendentes
        """
        order = self.get_object()
        
        # Verificar se é o dono ou admin
        if order.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Você não tem permissão para cancelar este pedido.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Só pode cancelar se estiver pendente
        if order.status != 'pending':
            return Response(
                {'error': 'Apenas pedidos pendentes podem ser cancelados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancelar e devolver estoque
        with transaction.atomic():
            order.status = 'cancelled'
            order.save()
            
            for item in order.items.all():
                Product.objects.filter(id=item.product.id).update(
                    stock=F('stock') + item.quantity
                )
        
        return Response(
            {'message': 'Pedido cancelado com sucesso. Estoque devolvido.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """
        Retorna os pedidos do usuário autenticado
        """
        orders = Order.objects.filter(user=request.user)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def auto_process(self, request, pk=None):
        """
        Auto-transição de paid para processing após pagamento
        Pode ser chamado pelo frontend ou webhook de pagamento
        """
        order = self.get_object()
        
        if order.status == 'paid':
            order.status = 'processing'
            order.save()
            
            # Atualizar histórico
            latest_history = order.status_history.first()
            if latest_history:
                latest_history.note = 'Transição automática após confirmação de pagamento'
                latest_history.save()
            
            return Response({'message': 'Pedido movido para processamento'})
        
        return Response({'message': 'Pedido não elegível para auto-processamento'})
    
    @action(detail=True, methods=['get'])
    def status_history(self, request, pk=None):
        """
        Retorna o histórico de status do pedido
        """
        order = self.get_object()
        
        # Verificar permissão: dono do pedido ou admin
        if order.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Você não tem permissão para ver este histórico.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from .serializers import OrderStatusHistorySerializer
        history = order.status_history.all()
        serializer = OrderStatusHistorySerializer(history, many=True)
        return Response(serializer.data)
