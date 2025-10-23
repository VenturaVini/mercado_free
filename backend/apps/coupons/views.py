from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Coupon
from .serializers import CouponSerializer, ValidateCouponSerializer


class CouponViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar cupons de desconto
    """
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Apenas admins podem criar/editar cupons"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def validate_coupon(self, request):
        """
        Valida um cupom para um determinado valor de compra
        """
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code'].upper()
        total_amount = serializer.validated_data['total_amount']
        
        try:
            coupon = Coupon.objects.get(code__iexact=code)
        except Coupon.DoesNotExist:
            return Response(
                {'error': 'Cupom não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        result, message = coupon.apply(total_amount)
        
        if result is None:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'success': True,
            'message': message,
            'coupon': CouponSerializer(coupon).data,
            'discount_info': result
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def toggle_active(self, request, pk=None):
        """
        Ativa/desativa um cupom
        """
        coupon = self.get_object()
        coupon.is_active = not coupon.is_active
        coupon.save()
        
        return Response({
            'success': True,
            'is_active': coupon.is_active,
            'message': f"Cupom {'ativado' if coupon.is_active else 'desativado'} com sucesso"
        })
