from django.contrib import admin
from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'used_count', 'max_uses', 'valid_until', 'is_active']
    list_filter = ['discount_type', 'is_active', 'valid_from', 'valid_until']
    search_fields = ['code', 'description']
    readonly_fields = ['used_count', 'created_at', 'updated_at']
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('code', 'description', 'is_active')
        }),
        ('Desconto', {
            'fields': ('discount_type', 'discount_value', 'min_purchase')
        }),
        ('Limite de Uso', {
            'fields': ('max_uses', 'used_count')
        }),
        ('Validade', {
            'fields': ('valid_from', 'valid_until')
        }),
        ('Metadados', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
