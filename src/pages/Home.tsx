import { useEffect, useState } from 'react';
import { usePayments } from '../context/PaymentContext';
import { useAuth } from '../context/AuthContext';
import { DataService, MerchantData } from '../services/dataService';

export function Home() {
  const [products, setProducts] = useState<MerchantData['inventory']>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = usePayments();
  const { userRole } = useAuth();

  // CRUD State
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<MerchantData['inventory'][0]>>({});

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await DataService.getMerchantData();
      setProducts(data.inventory);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProduct.productId) {
        await DataService.updateProduct(currentProduct.productId, currentProduct);
      } else {
        // Default image if none provided
        if (!currentProduct.image) {
          currentProduct.image = 'https://via.placeholder.com/150';
        }
        await DataService.addProduct(currentProduct as any);
      }
      await loadProducts();
      setIsEditing(false);
      setCurrentProduct({});
    } catch (e) {
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await DataService.deleteProduct(id);
      await loadProducts();
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Shop</h2>
        {userRole === 'merchant' && (
          <button
            onClick={() => { setCurrentProduct({}); setIsEditing(true); }}
            className="primary-button"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: '#242424', padding: '2rem', borderRadius: '12px', width: '400px', border: '1px solid #444'
          }}>
            <h3>{currentProduct.productId ? 'Edit Product' : 'Add Product'}</h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                placeholder="Product Name"
                value={currentProduct.name || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                required
                style={{ padding: '8px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
              />
              <input
                type="number" step="0.01" placeholder="Price (TON)"
                value={currentProduct.price || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                required
                style={{ padding: '8px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
              />
              <input
                type="number" placeholder="Stock"
                value={currentProduct.stock || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                required
                style={{ padding: '8px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
              />
              <input
                placeholder="Category"
                value={currentProduct.category || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                required
                style={{ padding: '8px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
              />
              <input
                placeholder="Image URL"
                value={currentProduct.image || ''}
                onChange={e => setCurrentProduct({ ...currentProduct, image: e.target.value })}
                style={{ padding: '8px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="primary-button" style={{ flex: 1 }}>Save</button>
                <button type="button" onClick={() => setIsEditing(false)} className="secondary-button" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="product-card skeleton">
              <div className="img" />
              <div className="line short" />
              <div className="line" />
            </div>
          ))}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid">
          {products.map((p) => (
            <div key={p.productId} className="product-card">
              <img src={p.image} alt={p.name} style={{ height: '200px', objectFit: 'contain', width: '100%', background: 'white', padding: '10px', borderRadius: '8px' }} />
              <div className="product-info">
                <div className="product-title">{p.name}</div>
                <div className="product-category" style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>{p.category}</div>
                <div className="product-footer">
                  <div className="price">{p.price.toFixed(2)} TON</div>

                  {userRole === 'merchant' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => { setCurrentProduct(p); setIsEditing(true); }}
                        style={{ background: '#646cff', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.productId)}
                        style={{ background: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      className="add-button"
                      onClick={() => addToCart({ id: parseInt(p.productId.split('_')[1]) || Date.now(), title: p.name, price: p.price, image: p.image })}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
                {userRole === 'merchant' && (
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: p.stock < 10 ? '#ef4444' : '#4ade80' }}>
                    Stock: {p.stock}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="empty-state">No products found.</div>
      )}
    </div>
  );
}

export default Home;
