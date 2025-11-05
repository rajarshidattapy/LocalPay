import { useEffect, useState } from 'react';
import { usePayments } from '../context/PaymentContext';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

export function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToCart } = usePayments();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('https://fakestoreapi.com/products')
      .then(r => r.json())
      .then((data) => {
        if (!mounted) return;
        setProducts(data);
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  return (
    <div className="page-container">
      <h2 className="page-title">Products</h2>
      {loading && (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card skeleton">
              <div className="img" />
              <div className="line short" />
              <div className="line" />
            </div>
          ))}
        </div>
      )}

      {!loading && products && (
        <div className="grid">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <img src={p.image} alt={p.title} />
              <div className="product-info">
                <div className="product-title">{p.title}</div>
                <div className="product-footer">
                  <div className="price">{p.price.toFixed(2)} $</div>
                  <button
                    className="add-button"
                    onClick={() => addToCart({ id: p.id, title: p.title, price: p.price, image: p.image })}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products && products.length === 0 && (
        <div className="empty-state">Unable to load products</div>
      )}
    </div>
  );
}

export default Home;
