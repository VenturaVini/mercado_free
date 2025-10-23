from django.contrib import admin
from django.contrib import messages
from .models import Category, Product


def limpar_todos_produtos(modeladmin, request, queryset):
    """
    Limpa TODOS os produtos do sistema.
    Esta ação ignora a seleção e limpa tudo.
    """
    total_products = Product.objects.count()
    
    if total_products == 0:
        messages.warning(request, '⚠️ Não há produtos para limpar.')
        return
    
    Product.objects.all().delete()
    
    messages.success(
        request,
        f'✅ Limpeza concluída! {total_products} produto(s) deletado(s).'
    )

limpar_todos_produtos.short_description = '🗑️ LIMPAR TODOS OS PRODUTOS'


def resetar_estoque_produtos(modeladmin, request, queryset):
    """
    Reseta o estoque dos produtos selecionados para zero.
    """
    count = queryset.update(stock=0)
    
    messages.success(
        request,
        f'✅ Estoque de {count} produto(s) resetado para zero.'
    )

resetar_estoque_produtos.short_description = '📦 Resetar estoque para 0'


def ativar_produtos_selecionados(modeladmin, request, queryset):
    """
    Ativa os produtos selecionados.
    """
    count = queryset.update(is_active=True)
    
    messages.success(
        request,
        f'✅ {count} produto(s) ativado(s).'
    )

ativar_produtos_selecionados.short_description = '✅ Ativar produtos'


def desativar_produtos_selecionados(modeladmin, request, queryset):
    """
    Desativa os produtos selecionados.
    """
    count = queryset.update(is_active=False)
    
    messages.success(
        request,
        f'✅ {count} produto(s) desativado(s).'
    )

desativar_produtos_selecionados.short_description = '❌ Desativar produtos'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name', 'description']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['price', 'stock', 'is_active']
    actions = [
        limpar_todos_produtos,
        resetar_estoque_produtos,
        ativar_produtos_selecionados,
        desativar_produtos_selecionados
    ]
