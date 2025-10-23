from django.contrib import admin
from django.contrib import messages
from .models import Payment


def limpar_todos_pagamentos(modeladmin, request, queryset):
    """
    Limpa TODOS os pagamentos do sistema.
    Esta ação ignora a seleção e limpa tudo.
    """
    total_payments = Payment.objects.count()
    
    if total_payments == 0:
        messages.warning(request, '⚠️ Não há pagamentos para limpar.')
        return
    
    Payment.objects.all().delete()
    
    messages.success(
        request,
        f'✅ Limpeza concluída! {total_payments} pagamento(s) deletado(s).'
    )

limpar_todos_pagamentos.short_description = '🗑️ LIMPAR TODOS OS PAGAMENTOS'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'method', 'status', 'amount', 'created_at']
    list_filter = ['method', 'status', 'created_at']
    search_fields = ['order__id', 'transaction_id']
    readonly_fields = ['transaction_id', 'created_at', 'updated_at']
    actions = [limpar_todos_pagamentos]
