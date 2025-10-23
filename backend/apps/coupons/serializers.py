from rest_framework import serializers
from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    discount_display = serializers.CharField(source='get_discount_display', read_only=True)
    is_valid_now = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'discount_display', 'min_purchase', 'max_uses', 'used_count',
            'valid_from', 'valid_until', 'is_active', 'is_valid_now',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'used_count', 'created_at', 'updated_at']
    
    def get_is_valid_now(self, obj):
        is_valid, _ = obj.is_valid()
        return is_valid


class ValidateCouponSerializer(serializers.Serializer):
    """Serializer para validar cupom"""
    code = serializers.CharField(max_length=50)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class ApplyCouponSerializer(serializers.Serializer):
    """Serializer para aplicar cupom"""
    code = serializers.CharField(max_length=50)
