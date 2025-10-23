from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, CustomTokenObtainPairSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Endpoint para registro de novos usuários
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Endpoint customizado para login com informações adicionais do usuário
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint para visualizar e atualizar perfil do usuário autenticado
    """
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
