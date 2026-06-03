import { useEffect, useState } from 'react';
import * as ordersApi from '../api/orders.js';
import { listCustomers } from '../api/customers.js';
import { listProducts } from '../api/products.js';
import Modal from '../components/Modal.jsx';
import OrderForm from '../components/OrderForm.jsx';
import OrderDetail from '../components/OrderDetail.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { ErrorBanner, Loading, Empty } from '../components/Banner.jsx';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const productsById = Object.fromEntries(products.map((p) => [p.id, p]));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [o, c, p] = await Promise.all([
        ordersApi.listOrders(),
        listCustomers(),
        listProducts(),
      ]);
      setOrders(o);
      setCustomers(c);
      setProducts(p);
    } catch (err) {
      setError(err.userMessage || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (payload) => {
    const created = await ordersApi.createOrder(payload);
    setShowForm(false);
    await load();
    setDetailOrder(created);
  };

  const handleChangeStatus = async (orderId, status) => {
    const updated = await ordersApi.updateOrderStatus(orderId, status);
    setDetailOrder(updated);
    await load();
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">Place orders and track their status.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          disabled={customers.length === 0 || products.length === 0}
          title={
            customers.length === 0 || products.length === 0
              ? 'Add at least one customer and product first'
              : ''
          }
        >
          + New order
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Loading label="Loading orders…" />
      ) : orders.length === 0 ? (
        <Empty label="No orders yet. Place your first order." />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th className="num">Items</th>
                <th className="num">Total</th>
                <th>Placed</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="mono">#{o.id}</td>
                  <td className="cell-title">{o.customer?.name || `#${o.customer_id}`}</td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="num">{o.items.length}</td>
                  <td className="num">${Number(o.total_amount).toFixed(2)}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="actions-col">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDetailOrder(o)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title="New order" onClose={() => setShowForm(false)} width={640}>
          <OrderForm
            customers={customers}
            products={products}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {detailOrder && (
        <Modal
          title={`Order #${detailOrder.id}`}
          onClose={() => setDetailOrder(null)}
          width={640}
        >
          <OrderDetail
            order={detailOrder}
            productsById={productsById}
            onChangeStatus={handleChangeStatus}
          />
        </Modal>
      )}
    </section>
  );
}
