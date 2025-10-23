import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import Toast from '../components/Toast';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Pickup code validation states
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickupCode, setPickupCode] = useState('');
  const [pickupError, setPickupError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Manual release states
  const [showManualReleaseModal, setShowManualReleaseModal] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseImage, setReleaseImage] = useState(null);
  const [releaseImagePreview, setReleaseImagePreview] = useState(null);
  
  // Expanded states
  const [expandedItems, setExpandedItems] = useState({});
  const [expandedHistory, setExpandedHistory] = useState({});

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    stockStatus: 'all', // all, in_stock, out_of_stock
    activeStatus: 'all', // all, active, inactive
  });
  
  // Order status filter
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: null,
  });
  
  // Edit product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    is_active: true,
  });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editSelectedImage, setEditSelectedImage] = useState(null);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchCategories();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const showNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/');
      const productsData = response.data.results || response.data;
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showNotification('Erro ao carregar produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/');
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      showNotification('Erro ao carregar pedidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/');
      const categoriesData = response.data.results || response.data;
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('price', productForm.price);
      formData.append('stock', productForm.stock);
      formData.append('category', productForm.category);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      await api.post('/products/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showNotification('✅ Produto criado com sucesso!', 'success');
      setProductForm({ name: '', description: '', price: '', stock: '', category: '', image: null });
      setSelectedImage(null);
      setImagePreview(null);
      fetchProducts();
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      showNotification('❌ Erro ao criar produto', 'error');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      is_active: product.is_active,
    });
    setEditImagePreview(product.image ? `http://localhost:8000${product.image}` : null);
    setEditSelectedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      is_active: true,
    });
    setEditImagePreview(null);
    setEditSelectedImage(null);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('description', editForm.description);
      formData.append('price', editForm.price);
      formData.append('stock', editForm.stock);
      formData.append('category', editForm.category);
      formData.append('is_active', editForm.is_active);
      
      if (editSelectedImage) {
        formData.append('image', editSelectedImage);
      }

      await api.put(`/products/${editingProduct.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showNotification('✅ Produto atualizado com sucesso!', 'success');
      handleCancelEdit();
      fetchProducts();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      showNotification('❌ Erro ao atualizar produto', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.delete(`/products/${productId}/`);
      showNotification('✅ Produto excluído com sucesso!', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      showNotification('❌ Erro ao excluir produto', 'error');
    }
  };

  const handleToggleProductStatus = async (product) => {
    try {
      await api.patch(`/products/${product.id}/`, {
        is_active: !product.is_active
      });
      showNotification(`✅ Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso!`, 'success');
      fetchProducts();
    } catch (error) {
      console.error('Erro ao alterar status do produto:', error);
      showNotification('❌ Erro ao alterar status do produto', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.post(`/orders/${orderId}/update_status/`, { status: newStatus });
      showNotification('✅ Status atualizado com sucesso!', 'success');
      fetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showNotification('❌ Erro ao atualizar status', 'error');
    }
  };

  const handleOpenPickupModal = (order) => {
    setSelectedOrder(order);
    setPickupCode('');
    setPickupError('');
    setShowPassword(false);
    setShowPickupModal(true);
  };

  const handleClosePickupModal = () => {
    setShowPickupModal(false);
    setSelectedOrder(null);
    setPickupCode('');
    setPickupError('');
    setShowPassword(false);
  };

  const handleOpenManualReleaseModal = (order) => {
    setSelectedOrder(order);
    setReleaseReason('');
    setReleaseImage(null);
    setReleaseImagePreview(null);
    setShowPickupModal(false);
    setShowManualReleaseModal(true);
  };

  const handleCloseManualReleaseModal = () => {
    setShowManualReleaseModal(false);
    setSelectedOrder(null);
    setReleaseReason('');
    setReleaseImage(null);
    setReleaseImagePreview(null);
  };

  const handleReleaseImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReleaseImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReleaseImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleValidatePickupCode = async () => {
    if (!pickupCode.trim()) {
      setPickupError('Por favor, digite o código de retirada');
      return;
    }

    if (pickupCode.trim().toUpperCase() !== selectedOrder.pickup_code.toUpperCase()) {
      setPickupError('❌ Código incorreto! Tente novamente.');
      // Limpa o erro após 3 segundos para permitir nova tentativa
      setTimeout(() => setPickupError(''), 3000);
      return;
    }

    // Código correto, atualizar para completed
    try {
      await api.post(`/orders/${selectedOrder.id}/update_status/`, { status: 'completed' });
      showNotification('✅ Pedido concluído com sucesso!', 'success');
      handleClosePickupModal();
      fetchOrders();
    } catch (error) {
      console.error('Erro ao concluir pedido:', error);
      showNotification('❌ Erro ao concluir pedido', 'error');
    }
  };

  const handleManualRelease = async () => {
    if (!releaseReason.trim()) {
      showNotification('❌ Por favor, informe o motivo da liberação manual', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('status', 'completed');
      formData.append('release_reason', releaseReason);
      if (releaseImage) {
        formData.append('release_image', releaseImage);
      }

      await api.post(`/orders/${selectedOrder.id}/update_status/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showNotification('✅ Pedido liberado manualmente com sucesso!', 'success');
      handleCloseManualReleaseModal();
      fetchOrders();
    } catch (error) {
      console.error('Erro ao liberar pedido:', error);
      showNotification('❌ Erro ao liberar pedido', 'error');
    }
  };

  const handleCancelReadyOrder = async (orderId) => {
    if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
      try {
        await api.post(`/orders/${orderId}/update_status/`, { status: 'cancelled' });
        showNotification('✅ Pedido cancelado', 'success');
        fetchOrders();
      } catch (error) {
        console.error('Erro ao cancelar pedido:', error);
        showNotification('❌ Erro ao cancelar pedido', 'error');
      }
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
    
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'paid': 'bg-green-100 text-green-800 border-green-300',
      'processing': 'bg-blue-100 text-blue-800 border-blue-300',
      'ready': 'bg-purple-100 text-purple-800 border-purple-300',
      'completed': 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-400',
      'cancelled': 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'paid': '✅',
      'processing': '⚙️',
      'ready': '📦',
      'completed': '🎉',
      'cancelled': '❌'
    };
    return icons[status] || '📋';
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      stockStatus: 'all',
      activeStatus: 'all',
    });
    setCurrentPage(1);
  };

  // Memoize filtered and paginated products for performance
  const filteredProducts = useMemo(() => {
    console.log('🔄 Recalculando filteredProducts...', {
      totalProducts: products.length,
      filters: filters
    });
    
    const filtered = products.filter(product => {
      // Search filter
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category) {
        console.log('🔍 Testando produto:', {
          nome: product.name,
          categoria: product.category,
          tipo: typeof product.category,
          filtro: filters.category,
          filtroParsed: parseInt(filters.category),
          match: product.category === parseInt(filters.category)
        });
        if (product.category !== parseInt(filters.category)) {
          return false;
        }
      }

      // Price filters
      if (filters.minPrice && parseFloat(product.price) < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && parseFloat(product.price) > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Stock status filter
      if (filters.stockStatus === 'in_stock' && product.stock <= 0) {
        return false;
      }
      if (filters.stockStatus === 'out_of_stock' && product.stock > 0) {
        return false;
      }

      // Active status filter
      if (filters.activeStatus === 'active' && !product.is_active) {
        return false;
      }
      if (filters.activeStatus === 'inactive' && product.is_active) {
        return false;
      }

      return true;
    });
    
    console.log('✅ Produtos filtrados:', filtered.length);
    return filtered;
  }, [products, filters]);

  const paginatedProducts = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  }, [filteredProducts, itemsPerPage]);
  
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
      }
    } else {
      setExpandedHistory(prev => ({
        ...prev,
        [orderId]: null
      }));
    }
  };


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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Painel Administrativo
          </h1>
          <p className="text-gray-600">Gerencie produtos e pedidos da sua loja</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 bg-white rounded-lg shadow-md p-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Produtos
              </span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'orders'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Pedidos
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Create/Edit Product Form */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingProduct ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                    {editingProduct ? `Editar Produto: ${editingProduct.name}` : 'Adicionar Novo Produto'}
                  </h2>

                  {editingProduct && (
                    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <p className="text-blue-700 font-semibold">
                        ✏️ Você está editando um produto existente. Faça as alterações necessárias e clique em "Atualizar Produto" ou clique em "Cancelar" para voltar.
                      </p>
                    </div>
                  )}
                  
                  <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nome do Produto *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProduct ? editForm.name : productForm.name}
                          onChange={(e) => editingProduct ? setEditForm({ ...editForm, name: e.target.value }) : setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: iPhone 14 Pro"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Categoria *
                        </label>
                        <select
                          required
                          value={editingProduct ? editForm.category : productForm.category}
                          onChange={(e) => editingProduct ? setEditForm({ ...editForm, category: e.target.value }) : setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecione uma categoria</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Preço (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editingProduct ? editForm.price : productForm.price}
                          onChange={(e) => editingProduct ? setEditForm({ ...editForm, price: e.target.value }) : setProductForm({ ...productForm, price: e.target.value })}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Estoque *
                        </label>
                        <input
                          type="number"
                          required
                          value={editingProduct ? editForm.stock : productForm.stock}
                          onChange={(e) => editingProduct ? setEditForm({ ...editForm, stock: e.target.value }) : setProductForm({ ...productForm, stock: e.target.value })}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Descrição *
                      </label>
                      <textarea
                        required
                        rows="4"
                        value={editingProduct ? editForm.description : productForm.description}
                        onChange={(e) => editingProduct ? setEditForm({ ...editForm, description: e.target.value }) : setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Descreva o produto..."
                      />
                    </div>

                    {editingProduct && (
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editForm.is_active}
                            onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            Produto ativo (visível na loja)
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Imagem do Produto
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex flex-col items-center px-4 py-6 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
                          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600 font-medium">
                            {editingProduct 
                              ? (editSelectedImage ? editSelectedImage.name : 'Clique para alterar a imagem')
                              : (selectedImage ? selectedImage.name : 'Clique para selecionar uma imagem')
                            }
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={editingProduct ? handleEditImageChange : handleImageChange}
                            className="hidden"
                          />
                        </label>

                        {(editingProduct ? editImagePreview : imagePreview) && (
                          <div className="relative">
                            <img
                              src={editingProduct ? editImagePreview : imagePreview}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editingProduct) {
                                  setEditSelectedImage(null);
                                  setEditImagePreview(editingProduct.image ? `http://localhost:8000${editingProduct.image}` : null);
                                } else {
                                  setSelectedImage(null);
                                  setImagePreview(null);
                                }
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                        </button>
                      )}
                      
                      <button
                        type="submit"
                        className={`${editingProduct ? 'flex-1' : 'w-full'} bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingProduct ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                        </svg>
                        {editingProduct ? 'Atualizar Produto' : 'Adicionar Produto'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Products List */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Produtos Cadastrados</h2>
                  
                  {/* Filters Section */}
                  <div className="mb-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtros
                      </h3>
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Limpar Filtros
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Search */}
                      <div className="lg:col-span-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🔍 Buscar por nome
                        </label>
                        <input
                          type="text"
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                          placeholder="Digite o nome do produto..."
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📦 Categoria
                        </label>
                        <select
                          value={filters.category}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Todas as categorias</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Stock Status Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📊 Estoque
                        </label>
                        <select
                          value={filters.stockStatus}
                          onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">Todos</option>
                          <option value="in_stock">Com estoque</option>
                          <option value="out_of_stock">Sem estoque</option>
                        </select>
                      </div>

                      {/* Active Status Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          ⚡ Status
                        </label>
                        <select
                          value={filters.activeStatus}
                          onChange={(e) => handleFilterChange('activeStatus', e.target.value)}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">Todos</option>
                          <option value="active">Ativos</option>
                          <option value="inactive">Inativos</option>
                        </select>
                      </div>

                      {/* Min Price Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          💰 Preço Mínimo (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={filters.minPrice}
                          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Max Price Filter */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          💰 Preço Máximo (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={filters.maxPrice}
                          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          placeholder="9999.99"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Results Counter */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <p className="text-sm text-gray-600 font-semibold">
                        📊 Mostrando {paginatedProducts.length} de {filteredProducts.length} produto(s) 
                        {filteredProducts.length !== products.length && ` (${products.length} no total)`}
                      </p>
                    </div>
                  </div>
                  
                  {paginatedProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-600">
                        {filteredProducts.length === 0 ? 'Nenhum produto encontrado com os filtros aplicados' : 'Nenhum produto cadastrado'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Imagem</th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Nome</th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Categoria</th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Preço</th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Estoque</th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProducts.map((product) => (
                              <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                <td className="px-4 py-4">
                                  {product.image ? (
                                    <img
                                      src={`http://localhost:8000${product.image}`}
                                      alt={product.name}
                                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4 font-semibold text-gray-800">{product.name}</td>
                                <td className="px-4 py-4 text-gray-600">{product.category_name}</td>
                                <td className="px-4 py-4 font-bold text-green-600">R$ {parseFloat(product.price).toFixed(2)}</td>
                                <td className="px-4 py-4">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    product.stock > 10 ? 'bg-green-100 text-green-800' :
                                    product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {product.stock} un.
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {product.is_active ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => handleEditProduct(product)}
                                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all transform hover:scale-110"
                                      title="Editar produto"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    
                                    {/* Toggle Status Button */}
                                    <button
                                      onClick={() => handleToggleProductStatus(product)}
                                      className={`p-2 ${product.is_active ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-all transform hover:scale-110`}
                                      title={product.is_active ? 'Desativar produto' : 'Ativar produto'}
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={product.is_active ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                                      </svg>
                                    </button>
                                    
                                    {/* Delete Button */}
                                    <button
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all transform hover:scale-110"
                                      title="Excluir produto"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-6 flex justify-center items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              currentPage === 1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            ← Anterior
                          </button>

                          <div className="flex gap-2">
                            {[...Array(totalPages)].map((_, index) => {
                              const pageNumber = index + 1;
                              // Show first page, last page, current page, and pages around current
                              if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                                      currentPage === pageNumber
                                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                                  >
                                    {pageNumber}
                                  </button>
                                );
                              } else if (
                                pageNumber === currentPage - 2 ||
                                pageNumber === currentPage + 2
                              ) {
                                return (
                                  <span key={pageNumber} className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            })}
                          </div>

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              currentPage === totalPages
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            Próxima →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Order Status Filter */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-800">Filtrar Pedidos por Status</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <button
                      onClick={() => setOrderStatusFilter('all')}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                        orderStatusFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📋 Todos
                    </button>
                    
                    <button
                      onClick={() => setOrderStatusFilter('pending')}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                        orderStatusFilter === 'pending'
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg'
                          : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-2 border-yellow-200'
                      }`}
                    >
                      ⏳ Pendentes
                    </button>
                    
                    <button
                      onClick={() => setOrderStatusFilter('paid')}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                        orderStatusFilter === 'paid'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-200'
                      }`}
                    >
                      💰 Pagos
                    </button>
                    
                    <button
                      onClick={() => setOrderStatusFilter('processing')}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                        orderStatusFilter === 'processing'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-2 border-blue-200'
                      }`}
                    >
                      ⚙️ Processando
                    </button>
                    
                    <button
                      onClick={() => setOrderStatusFilter('ready')}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                        orderStatusFilter === 'ready'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-2 border-purple-200'
                      }`}
                    >
                      📦 Pronto
                    </button>
                    
                    <button
                      onClick={() => setOrderStatusFilter('completed')}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                        orderStatusFilter === 'completed'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-2 border-emerald-200'
                      }`}
                    >
                      ✅ Concluídos
                    </button>
                    
                    <button
                      onClick={() => setOrderStatusFilter('cancelled')}
                      className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                        orderStatusFilter === 'cancelled'
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
                      📊 {orderStatusFilter === 'all' 
                        ? `Mostrando todos os ${orders.length} pedido(s)` 
                        : `Mostrando ${orders.filter(o => o.status === orderStatusFilter).length} de ${orders.length} pedido(s)`
                      }
                    </p>
                  </div>
                </div>

                {orders.filter(order => orderStatusFilter === 'all' || order.status === orderStatusFilter).length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-600 text-lg">
                      {orderStatusFilter === 'all' 
                        ? 'Nenhum pedido encontrado' 
                        : `Nenhum pedido com status "${getStatusLabel(orderStatusFilter)}" encontrado`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.filter(order => orderStatusFilter === 'all' || order.status === orderStatusFilter).map((order) => (
                      <div key={order.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition">
                        {/* Order Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                {getStatusIcon(order.status)} Pedido #{order.id}
                              </h3>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span><strong>Cliente:</strong> {order.user_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span><strong>Data:</strong> {formatDateTime(order.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">💳</span>
                                  <span><strong>Pagamento:</strong> {order.payment_method_display}</span>
                                </div>
                                {order.installments > 1 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">💰</span>
                                    <span><strong>Parcelas:</strong> {order.installment_display}</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Manual Release Info */}
                              {order.manual_release && (
                                <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-400 rounded-xl shadow-md">
                                  <div className="flex items-center gap-2 mb-3 pb-3 border-b-2 border-orange-200">
                                    <div className="p-2 bg-orange-500 rounded-lg">
                                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <h4 className="text-lg font-bold text-orange-900">🔓 Liberação Manual</h4>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex items-start gap-2">
                                      <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Liberado por</p>
                                        <p className="text-sm text-orange-900 font-bold">{order.released_by_name}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                      <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Data</p>
                                        <p className="text-sm text-orange-900 font-bold">{formatDateTime(order.released_at)}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                      <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Motivo</p>
                                        <p className="text-sm text-orange-900 font-medium italic bg-white bg-opacity-60 p-2 rounded-md mt-1 border border-orange-200">
                                          "{order.release_reason}"
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {order.release_image && (
                                      <div className="pt-2 mt-2 border-t border-orange-200">
                                        <a
                                          href={`http://localhost:8000${order.release_image}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all transform hover:scale-105"
                                        >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          Ver Comprovante
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right min-w-[280px]">
                              <div className={`px-6 py-3 rounded-xl font-bold border-2 mb-4 text-center shadow-md ${getStatusColor(order.status)}`}>
                                <div className="text-sm uppercase tracking-wide opacity-75 mb-1">Status</div>
                                <div className="text-xl">{order.status_display}</div>
                              </div>
                              
                              {/* Status Management */}
                              {order.status === 'ready' ? (
                                <div className="space-y-2">
                                  <button
                                    onClick={() => handleOpenPickupModal(order)}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Validar Código
                                  </button>
                                  <button
                                    onClick={() => handleCancelReadyOrder(order.id)}
                                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                  disabled={order.status === 'completed' || order.status === 'cancelled'}
                                >
                                  <option value="pending">Pendente</option>
                                  <option value="paid">Pago</option>
                                  <option value="processing">Em Processamento</option>
                                  <option value="ready">Pronto para Retirada</option>
                                  <option value="completed">Concluído</option>
                                  <option value="cancelled">Cancelado</option>
                                </select>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items - Collapsible */}
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
                                {item.product_image ? (
                                  <img
                                    src={`http://localhost:8000${item.product_image}`}
                                    alt={item.product_name}
                                    className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-800">{item.product_name}</h5>
                                  <div className="flex gap-3 text-sm text-gray-600 mt-1">
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

                          <div className="mt-6 pt-6 border-t-2 border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-semibold text-gray-700">Total do Pedido:</span>
                              <span className="text-3xl font-bold text-blue-600">
                                R$ {parseFloat(order.total_amount).toFixed(2)}
                              </span>
                            </div>
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
                                        <span className="text-xs text-gray-500">{formatDateTime(history.created_at)}</span>
                                      </div>
                                      {history.changed_by_name && (
                                        <p className="text-xs text-gray-600">👤 {history.changed_by_name}</p>
                                      )}
                                      {history.note && (
                                        <p className="text-sm text-purple-800 mt-1 italic">💬 {history.note}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pickup Code Validation Modal */}
      {showPickupModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Validar Código de Retirada
              </h2>
              <p className="text-gray-600">
                Pedido #{selectedOrder.id} - Cliente: <strong>{selectedOrder.user_name}</strong>
              </p>
            </div>

            {/* Code Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Digite o código fornecido pelo cliente:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={pickupCode}
                  onChange={(e) => {
                    setPickupCode(e.target.value.toUpperCase());
                    setPickupError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleValidatePickupCode();
                    }
                  }}
                  placeholder="******"
                  className="w-full px-4 py-4 pr-12 bg-gray-50 border-2 border-gray-300 rounded-lg text-gray-900 font-bold text-center text-2xl tracking-widest uppercase placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  maxLength={6}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Error Message */}
              {pickupError && (
                <div className="mt-3 p-3 bg-red-100 border-2 border-red-300 rounded-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 font-semibold">{pickupError}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleClosePickupModal}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleValidatePickupCode}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Validar e Concluir
                </button>
              </div>

              {/* Manual Release Button */}
              <button
                onClick={() => handleOpenManualReleaseModal(selectedOrder)}
                className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Liberar Manualmente
              </button>
            </div>

            {/* Info Footer */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Você pode tentar quantas vezes for necessário até acertar o código
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Release Modal */}
      {showManualReleaseModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Liberação Manual do Pedido
              </h2>
              <p className="text-gray-600">
                Pedido #{selectedOrder.id} - Cliente: <strong>{selectedOrder.user_name}</strong>
              </p>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span><strong>Atenção:</strong> Esta ação liberará o pedido sem validação de código.</span>
              </p>
            </div>

            {/* Reason Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo da liberação manual: *
              </label>
              <textarea
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value)}
                placeholder="Ex: Cliente não recebeu o código por SMS, cliente esqueceu o código, autorização do gerente, etc."
                rows="4"
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Este motivo será registrado no histórico do pedido.
              </p>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Anexar comprovante (opcional):
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center px-4 py-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition">
                  <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium text-center">
                    {releaseImage ? releaseImage.name : 'Clique para anexar foto/documento'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReleaseImageChange}
                    className="hidden"
                  />
                </label>

                {releaseImagePreview && (
                  <div className="relative">
                    <img
                      src={releaseImagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReleaseImage(null);
                        setReleaseImagePreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                📸 Foto de documento, autorização escrita, screenshot de conversa, etc.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseManualReleaseModal}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleManualRelease}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirmar Liberação
              </button>
            </div>

            {/* Warning Footer */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                ⚠️ Esta ação não pode ser desfeita. Certifique-se de que está liberando o pedido correto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
