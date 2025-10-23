import { useState, useEffect } from 'react';
import api from '../api/axios';
import Toast from '../components/Toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    // Atualizar a cada 30 segundos para verificar expirações
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/my_orders/');
      setOrders(response.data);
    } catch (err) {
      setError('Erro ao carregar pedidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Deseja realmente cancelar este pedido? Os produtos serão devolvidos ao estoque.')) {
      return;
    }

    try {
      await api.post(`/orders/${orderId}/cancel/`);
      showNotification('Pedido cancelado com sucesso!', 'success');
      fetchOrders();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Erro ao cancelar pedido', 'error');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`
    };
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return 'Expirado';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s restantes`;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'pix': '💰',
      'credit_card': '💳',
      'debit_card': '💳',
      'boleto': '📄'
    };
    return icons[method] || '💳';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'paid': 'bg-green-100 text-green-800 border-green-300',
      'approved': 'bg-green-100 text-green-800 border-green-300',
      'processing': 'bg-blue-100 text-blue-800 border-blue-300',
      'ready': 'bg-purple-100 text-purple-800 border-purple-300',
      'completed': 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-400',
      'cancelled': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const toggleItems = (orderId) => {
    setExpandedItems(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };
  
  const toggleHistory = async (orderId) => {
    if (!expandedHistory[orderId]) {
      // Buscar histórico completo
      try {
        const response = await api.get(`/orders/${orderId}/status_history/`);
        setExpandedHistory(prev => ({
          ...prev,
          [orderId]: response.data
        }));
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        showNotification('Erro ao carregar histórico', 'error');
      }
    } else {
      setExpandedHistory(prev => ({
        ...prev,
        [orderId]: null
      }));
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Pendente',
      'paid': 'Pago',
      'approved': 'Aprovado',
      'processing': 'Em Processamento',
      'ready': 'Pronto para Retirada',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pendente',
      'paid': 'Pago',
      'processing': 'Processando',
      'ready': 'Pronto para Retirada',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Carregando seus pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md">
          <p className="font-medium">❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Meus Pedidos
        </h1>
        <p className="text-gray-600">Acompanhe o status de seus pedidos e códigos de retirada</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h2>
          <p className="text-gray-500 mb-6">Você ainda não realizou nenhum pedido.</p>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Começar a Comprar
          </a>
        </div>
      ) : (
        <>
          {/* Status Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800">Filtrar por Status</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                  statusFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 Todos
              </button>
              
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                  statusFilter === 'pending'
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-2 border-yellow-200'
                }`}
              >
                ⏳ Pendentes
              </button>
              
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                  statusFilter === 'paid'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200'
                }`}
              >
                💰 Pagos
              </button>
              
              <button
                onClick={() => setStatusFilter('processing')}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                  statusFilter === 'processing'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200'
                }`}
              >
                ⚙️ Processando
              </button>
              
              <button
                onClick={() => setStatusFilter('ready')}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                  statusFilter === 'ready'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-2 border-purple-200'
                }`}
              >
                📦 Pronto
              </button>
              
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                  statusFilter === 'completed'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-200'
                }`}
              >
                ✅ Concluídos
              </button>
              
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                  statusFilter === 'cancelled'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-200'
                }`}
              >
                ❌ Cancelados
              </button>
            </div>
            
            {/* Counter */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <p className="text-sm text-gray-600 font-semibold">
                📊 {statusFilter === 'all' 
                  ? `Mostrando todos os ${orders.length} pedido(s)` 
                  : `Mostrando ${orders.filter(o => o.status === statusFilter).length} de ${orders.length} pedido(s)`
                }
              </p>
            </div>
          </div>

          {orders.filter(order => statusFilter === 'all' || order.status === statusFilter).length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h2>
              <p className="text-gray-500">
                Não há pedidos com status "{getStatusLabel(statusFilter)}"
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.filter(order => statusFilter === 'all' || order.status === statusFilter).map((order) => {
            const createdDateTime = formatDateTime(order.created_at);
            const updatedDateTime = formatDateTime(order.updated_at);
            
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition overflow-hidden border border-gray-200">
                {/* Cabeçalho do Pedido */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                        Pedido #{order.id}
                        {order.is_expired && (
                          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-300">
                            ⏰ EXPIRADO
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span><strong>Criado:</strong> {createdDateTime.date} às {createdDateTime.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span><strong>Atualizado:</strong> {updatedDateTime.date} às {updatedDateTime.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(order.payment_method)}
                          <span>
                            <strong>Pagamento:</strong> {order.payment_method_display}
                            {order.installments > 1 && (
                              <span className="ml-2 text-green-600 font-bold">
                                ({order.installments}x de R$ {parseFloat(order.installment_value).toFixed(2)})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <div className={`px-4 py-2 rounded-lg font-semibold border-2 ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </div>
                      {order.status === 'pending' && order.time_remaining > 0 && (
                        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTimeRemaining(order.time_remaining)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aviso de Expiração - APENAS para pedidos pendentes */}
                  {order.status === 'pending' && !order.is_expired && order.time_remaining > 0 && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded mb-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold text-yellow-800 mb-1">⏰ Atenção: Pedido Pendente</p>
                          <p className="text-sm text-yellow-700">
                            Complete o pagamento em até <strong>{formatTimeRemaining(order.time_remaining)}</strong> ou seu pedido será cancelado automaticamente e os produtos voltarão ao estoque.
                          </p>
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                          >
                            Cancelar Pedido Manualmente
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensagem de Sucesso - Para pedidos pagos/aprovados */}
                  {(order.status === 'paid' || order.status === 'approved' || order.status === 'processing' || order.status === 'ready') && (
                    <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded mb-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-green-800 mb-1">✅ Pagamento Confirmado!</p>
                          <p className="text-sm text-green-700">
                            Seu pedido foi aprovado com sucesso. Use o código de retirada abaixo para retirar seus produtos.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aviso de Cancelamento */}
                  {order.status === 'cancelled' && (
                    <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded mb-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-red-800">Pedido Cancelado</p>
                          <p className="text-sm text-red-700">
                            {order.is_expired 
                              ? 'Este pedido foi cancelado automaticamente por expiração (10 minutos sem pagamento).' 
                              : 'Este pedido foi cancelado. Os produtos foram devolvidos ao estoque.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Código de Retirada */}
                  {order.pickup_code && order.status !== 'cancelled' && (
                    <div className="bg-white rounded-lg p-4 border-2 border-blue-300 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600 text-white p-3 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium uppercase">Código de Retirada</p>
                            <p className="text-4xl font-black text-blue-700 tracking-wider font-mono">
                              {order.pickup_code}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Apresente este código</p>
                          <p className="text-sm text-gray-500">para retirar seu pedido</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Itens do Pedido - Collapsible */}
                <div className="p-6 border-t-2 border-gray-200">
                  <button
                    onClick={() => toggleItems(order.id)}
                    className="w-full flex items-center justify-between text-lg font-semibold text-gray-800 mb-4 hover:text-blue-600 transition"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>Itens do Pedido ({order.items?.length || 0})</span>
                    </div>
                    <svg 
                      className={`w-6 h-6 transition-transform ${expandedItems[order.id] ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Show first 3 items or all if expanded */}
                  <div className="space-y-3">
                    {(expandedItems[order.id] ? order.items : order.items?.slice(0, 3))?.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition">
                        {/* Imagem do Produto */}
                        <div className="flex-shrink-0">
                          {item.product_image ? (
                            <img 
                              src={`http://localhost:8000${item.product_image}`}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded-lg shadow-md border-2 border-gray-300"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center shadow-md border-2 border-gray-300">
                              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Informações do Produto */}
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800 mb-1">
                            {item.product_name}
                          </h5>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span><strong>Qtd:</strong> {item.quantity}</span>
                            <span><strong>Unit.:</strong> R$ {parseFloat(item.price).toFixed(2)}</span>
                            <span className="text-blue-600 font-bold">R$ {parseFloat(item.subtotal).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {!expandedItems[order.id] && order.items?.length > 3 && (
                      <button
                        onClick={() => toggleItems(order.id)}
                        className="w-full py-2 text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center gap-2 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Mostrar mais {order.items.length - 3} item(ns)
                      </button>
                    )}
                  </div>

                  {/* Total do Pedido */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-semibold text-gray-700">Total do Pedido:</span>
                      <span className="text-3xl font-bold text-blue-600">
                        R$ {parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    {order.installments > 1 && (
                      <div className="text-right">
                        <p className="text-green-600 font-semibold text-lg">
                          🎫 {order.installment_display}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Sem juros no cartão de crédito</p>
                      </div>
                    )}
                  </div>

                  {/* Status History */}
                  <div className="mt-6 pt-6 border-t-2 border-gray-200">
                    <button
                      onClick={() => toggleHistory(order.id)}
                      className="w-full flex items-center justify-between text-lg font-semibold text-gray-800 mb-4 hover:text-purple-600 transition"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Histórico de Status</span>
                      </div>
                      <svg 
                        className={`w-6 h-6 transition-transform ${expandedHistory[order.id] ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedHistory[order.id] && (
                      <div className="space-y-2">
                        {expandedHistory[order.id].map((history, index) => (
                          <div key={history.id} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                              {expandedHistory[order.id].length - index}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(history.status)}`}>
                                  {history.status_display}
                                </span>
                                <span className="text-xs text-gray-500">{formatDateTime(history.created_at).date} às {formatDateTime(history.created_at).time}</span>
                              </div>
                              {history.changed_by_name && (
                                <p className="text-xs text-gray-600">👤 Alterado por: {history.changed_by_name}</p>
                              )}
                              {history.note && (
                                <p className="text-sm text-purple-800 mt-1 italic bg-white bg-opacity-60 p-2 rounded">
                                  💬 {history.note}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyOrders;
