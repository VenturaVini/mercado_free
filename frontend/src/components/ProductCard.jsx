import { useState } from 'react';
import { useCart } from '../context/CartContext';
import Toast from './Toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, 1);
    setShowToast(true);
  };

  return (
    <>
      {showToast && (
        <Toast
          message={`${product.name} adicionado ao carrinho!`}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-8xl filter drop-shadow-lg">📱</div>
          )}
        </div>
        
        <div className="p-5">
          <div className="mb-2">
            {product.category_name && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                {product.category_name}
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>
          
          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-blue-600">
                R$ {parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="flex items-center gap-1 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold">{product.stock} disponíveis</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold">Indisponível</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              product.stock > 0
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {product.stock > 0 ? 'Adicionar ao Carrinho' : 'Indisponível'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProductCard;
