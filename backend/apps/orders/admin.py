from django.contrib import admin
from django.contrib import messages
from django.db.models import F
from .models import Order, OrderItem, OrderStatusHistory


def limpar_todos_pedidos(modeladmin, request, queryset):
    """
    Limpa TODOS os pedidos do sistema, devolvendo produtos ao estoque.
    Esta ação ignora a seleção e limpa tudo.
    """
    # Contar antes
    total_orders = Order.objects.count()
    total_items = OrderItem.objects.count()
    total_history = OrderStatusHistory.objects.count()
    
    if total_orders == 0:
        messages.warning(request, '⚠️ Não há pedidos para limpar.')
        return
    
    # Devolver produtos ao estoque
    products_updated = 0
    for order in Order.objects.prefetch_related('items__product').all():
        for item in order.items.all():
            item.product.stock = F('stock') + item.quantity
            item.product.save()
            products_updated += 1
    
    # Deletar histórico
    OrderStatusHistory.objects.all().delete()
    
    # Deletar itens e pedidos
    OrderItem.objects.all().delete()
    Order.objects.all().delete()
    
    messages.success(
        request,
        f'✅ Limpeza concluída! '
        f'{total_orders} pedidos, {total_items} itens e {total_history} históricos deletados. '
        f'{products_updated} produtos devolvidos ao estoque.'
    )

limpar_todos_pedidos.short_description = '🗑️ LIMPAR TODOS OS PEDIDOS (devolve ao estoque)'


def devolver_estoque_pedidos_selecionados(modeladmin, request, queryset):
    """
    Devolve produtos ao estoque e deleta apenas os pedidos selecionados.
    """
    count = queryset.count()
    products_updated = 0
    
    for order in queryset.prefetch_related('items__product'):
        for item in order.items.all():
            item.product.stock = F('stock') + item.quantity
            item.product.save()
            products_updated += 1
    
    queryset.delete()
    
    messages.success(
        request,
        f'✅ {count} pedido(s) deletado(s) e {products_updated} produto(s) devolvido(s) ao estoque.'
    )

devolver_estoque_pedidos_selecionados.short_description = '♻️ Deletar e devolver ao estoque'


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_amount', 'pickup_code', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__username', 'pickup_code']
    readonly_fields = ['pickup_code', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    actions = [limpar_todos_pedidos, devolver_estoque_pedidos_selecionados]
    
    def has_delete_permission(self, request, obj=None):
        return True  # Permitir delete agora que temos ações customizadas


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price', 'subtotal']
    readonly_fields = ['subtotal']
