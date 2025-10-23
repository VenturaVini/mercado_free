import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Toast from '../components/Toast';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [installments, setInstallments] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // Criar pedido com método de pagamento e parcelas
      const orderData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        installments: paymentMethod === 'credit_card' ? installments : 1,
      };

      const orderResponse = await api.post('/orders/', orderData);
      const order = orderResponse.data;

      // Criar pagamento com o método de pagamento
      const paymentData = {
        order_id: order.id,
        method: paymentMethod,
      };

      const paymentResponse = await api.post('/payments/', paymentData);
      const payment = paymentResponse.data;

      if (payment.status === 'approved') {
        showNotification('🎉 Pagamento aprovado com sucesso!', 'success');
        setOrderDetails(order);
        setShowSuccessModal(true);
      } else {
        showNotification('❌ Pagamento rejeitado. Produtos devolvidos ao estoque. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      const errorMsg = error.response?.data?.error || 'Erro ao processar pedido';
      showNotification(errorMsg, 'error');
      
      // Se foi erro de estoque, atualizar a página
      if (errorMsg.includes('indisponível') || errorMsg.includes('ESGOTADO')) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (item) => {
    removeFromCart(item.id);
    showNotification(`${item.name} removido do carrinho`, 'success');
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    clearCart();
    navigate('/my-orders');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-8 text-lg">Adicione produtos incríveis ao seu carrinho!</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg transition shadow-lg inline-flex items-center gap-3 text-lg font-semibold"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Continuar Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Carrinho de Compras
          </h1>
          <p className="text-gray-600 text-lg mt-2">{cart.length} {cart.length === 1 ? 'item' : 'itens'} no seu carrinho</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Produtos */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col md:flex-row items-center gap-6"
              >
                {/* Imagem do Produto */}
                <div className="w-32 h-32 flex-shrink-0">
                  {item.image ? (
                    <img 
                      src={`http://localhost:8000${item.image}`}
                      alt={item.name} 
                      className="w-full h-full object-cover rounded-lg shadow-md border-2 border-gray-200" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center shadow-md border-2 border-gray-300">
                      <span className="text-5xl">📱</span>
                    </div>
                  )}
                </div>

                {/* Informações do Produto */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl text-gray-800 mb-2">{item.name}</h3>
                  <p className="text-blue-600 font-bold text-2xl mb-1">
                    R$ {parseFloat(item.price).toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-sm">Preço unitário</p>
                </div>

                {/* Controles de Quantidade */}
                <div className="flex flex-col items-center gap-3">
                  <label className="text-sm font-medium text-gray-600">Quantidade</label>
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="bg-white hover:bg-blue-600 hover:text-white text-gray-800 font-bold w-10 h-10 rounded-lg transition shadow-sm border border-gray-300"
                    >
                      −
                    </button>
                    <span className="px-6 py-2 font-bold text-lg text-gray-800 min-w-[60px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="bg-white hover:bg-blue-600 hover:text-white text-gray-800 font-bold w-10 h-10 rounded-lg transition shadow-sm border border-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Subtotal e Remover */}
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                  <p className="font-bold text-2xl text-gray-800 mb-3">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleRemove(item)}
                    className="text-red-600 hover:text-white hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition border border-red-600 inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Resumo do Pedido
              </h2>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Método de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      if (e.target.value !== 'credit_card') {
                        setInstallments(1);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white font-medium"
                  >
                    <option value="pix">💰 PIX</option>
                    <option value="credit_card">💳 Cartão de Crédito</option>
                    <option value="debit_card">💳 Cartão de Débito</option>
                    <option value="boleto">📄 Boleto</option>
                  </select>
                </div>

                {/* Seleção de Parcelas - Apenas para Cartão de Crédito */}
                {paymentMethod === 'credit_card' && (
                  <div>
                    <label className="block text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Número de Parcelas
                    </label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 bg-green-50 font-medium"
                    >
                      <option value={1}>1x de R$ {getTotal().toFixed(2)} (à vista)</option>
                      <option value={2}>2x de R$ {(getTotal() / 2).toFixed(2)}</option>
                      <option value={3}>3x de R$ {(getTotal() / 3).toFixed(2)}</option>
                      <option value={6}>6x de R$ {(getTotal() / 6).toFixed(2)}</option>
                      <option value={12}>12x de R$ {(getTotal() / 12).toFixed(2)}</option>
                    </select>
                    {installments > 1 && (
                      <p className="mt-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                        💡 <strong>Total parcelado:</strong> R$ {getTotal().toFixed(2)} em {installments}x sem juros
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-200 pt-4 mb-6 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span className="font-medium">Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>
                  <span className="font-semibold">R$ {getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">Frete</span>
                  <span className="font-semibold">GRÁTIS</span>
                </div>
                <div className="border-t-2 border-gray-200 pt-3 flex justify-between text-2xl font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-blue-600">R$ {getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Finalizar Compra
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Pagamento seguro e protegido
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && orderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
            {/* Header com gradiente */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white rounded-full p-4 shadow-lg">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center mb-2">Pagamento Confirmado!</h2>
              <p className="text-center text-green-100">Seu pedido foi processado com sucesso</p>
            </div>

            {/* Corpo com informações */}
            <div className="p-6 space-y-4">
              {/* Pedido */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-500 rounded-lg p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-semibold uppercase">Número do Pedido</p>
                    <p className="text-2xl font-bold text-blue-900">#{orderDetails.id}</p>
                  </div>
                </div>
              </div>

              {/* Código de Retirada */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-500 rounded-lg p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 font-semibold uppercase">Código de Retirada</p>
                    <p className="text-4xl font-bold text-amber-900 tracking-wider">{orderDetails.pickup_code}</p>
                  </div>
                </div>
                <div className="bg-amber-100 rounded-lg p-3 border border-amber-300">
                  <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Guarde este código! Você precisará dele para retirar seu pedido.
                  </p>
                </div>
              </div>

              {/* Detalhes do Pagamento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">💳 Método</p>
                  <p className="text-sm font-bold text-gray-800">{orderDetails.payment_method_display}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">💰 Total</p>
                  <p className="text-sm font-bold text-gray-800">R$ {parseFloat(orderDetails.total_amount).toFixed(2)}</p>
                </div>
              </div>

              {/* Parcelas */}
              {orderDetails.installments > 1 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {orderDetails.installment_display}
                  </p>
                </div>
              )}

              {/* Mensagem de acompanhamento */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Você pode acompanhar seu pedido na aba "Meus Pedidos"
                </p>
              </div>
            </div>

            {/* Footer com botão */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleCloseSuccessModal}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg flex items-center justify-center gap-2 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Ver Meus Pedidos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
