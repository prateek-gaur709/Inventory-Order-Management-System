import { useEffect, useState } from 'react';
import * as api from '../api/products.js';
import Modal from '../components/Modal.jsx';
import ProductForm from '../components/ProductForm.jsx';
import { ErrorBanner, Loading, Empty } from '../components/Banner.jsx';

const LOW_STOCK = 10;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // product object or {} for new
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await api.listProducts());
    } catch (err) {
      setError(err.userMessage || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (product) => {
    setEditing(product);
    setShowForm(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) {
      await api.updateProduct(editing.id, payload);
    } else {
      await api.createProduct(payload);
    }
    setShowForm(false);
    await load();
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await api.deleteProduct(product.id);
      await load();
    } catch (err) {
      setError(err.userMessage || 'Failed to delete product.');
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Products</h1>
          <p className="muted">Manage your catalog and stock levels.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + Add product
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Loading label="Loading products…" />
      ) : products.length === 0 ? (
        <Empty label="No products yet. Add your first product." />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th className="num">Price</th>
                <th className="num">Stock</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.sku}</td>
                  <td>
                    <div className="cell-title">{p.name}</div>
                    {p.description && <div className="cell-sub">{p.description}</div>}
                  </td>
                  <td className="num">${Number(p.price).toFixed(2)}</td>
                  <td className="num">
                    <span className={p.stock_quantity < LOW_STOCK ? 'stock-low' : ''}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="actions-col">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-danger-text"
                      onClick={() => handleDelete(p)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal
          title={editing ? 'Edit product' : 'New product'}
          onClose={() => setShowForm(false)}
        >
          <ProductForm
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </section>
  );
}
