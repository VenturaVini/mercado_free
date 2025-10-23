from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import messages
from .models import User


def limpar_usuarios_clientes(modeladmin, request, queryset):
    """
    Limpa TODOS os usuários com role='cliente'.
    Esta ação ignora a seleção e limpa todos os clientes.
    MANTÉM usuários admin e staff.
    """
    total_clientes = User.objects.filter(role='cliente').count()
    
    if total_clientes == 0:
        messages.warning(request, '⚠️ Não há clientes para limpar.')
        return
    
    User.objects.filter(role='cliente').delete()
    
    messages.success(
        request,
        f'✅ Limpeza concluída! {total_clientes} cliente(s) deletado(s). '
        f'Usuários admin/staff foram preservados.'
    )

limpar_usuarios_clientes.short_description = '🗑️ LIMPAR TODOS OS CLIENTES (mantém admins)'


def limpar_usuarios_inativos(modeladmin, request, queryset):
    """
    Limpa TODOS os usuários inativos (is_active=False).
    """
    total_inativos = User.objects.filter(is_active=False).count()
    
    if total_inativos == 0:
        messages.warning(request, '⚠️ Não há usuários inativos para limpar.')
        return
    
    User.objects.filter(is_active=False).delete()
    
    messages.success(
        request,
        f'✅ Limpeza concluída! {total_inativos} usuário(s) inativo(s) deletado(s).'
    )

limpar_usuarios_inativos.short_description = '🗑️ LIMPAR USUÁRIOS INATIVOS'


def ativar_usuarios_selecionados(modeladmin, request, queryset):
    """
    Ativa os usuários selecionados.
    """
    count = queryset.update(is_active=True)
    
    messages.success(
        request,
        f'✅ {count} usuário(s) ativado(s).'
    )

ativar_usuarios_selecionados.short_description = '✅ Ativar usuários'


def desativar_usuarios_selecionados(modeladmin, request, queryset):
    """
    Desativa os usuários selecionados.
    """
    # Não permitir desativar superusers
    if queryset.filter(is_superuser=True).exists():
        messages.error(
            request,
            '❌ Não é possível desativar superusuários.'
        )
        return
    
    count = queryset.update(is_active=False)
    
    messages.success(
        request,
        f'✅ {count} usuário(s) desativado(s).'
    )

desativar_usuarios_selecionados.short_description = '❌ Desativar usuários'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informações Adicionais', {'fields': ('role', 'telefone')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informações Adicionais', {'fields': ('role', 'telefone')}),
    )
    actions = [
        limpar_usuarios_clientes,
        limpar_usuarios_inativos,
        ativar_usuarios_selecionados,
        desativar_usuarios_selecionados
    ]
