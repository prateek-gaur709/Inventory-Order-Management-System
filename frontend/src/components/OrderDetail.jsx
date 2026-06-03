import { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { ErrorBanner } from './Banner.jsx';

// Valid next statuses given the current one (mirrors backend rules).
const NEXT_STATUSES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: [],
  CANCELLED: [],
};

export default function OrderDetail({ order, productsById, onChangeStatus }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const nextOptions = NEXT_STATUSES[order.status] || [];

  const change = async (status) => {
    setError('');
    setBusy(true);
    try {
      await onChangeStatus(order.id, status);
    } catch (err) {
      setError(err.userMessage || 'Failed to update status.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="order-detail">
      <ErrorBanner message={error} />

      <div className="detail-meta">
        <div>
          <span className="detail-label">Order</span>
          <span className="detail-value">#{order.id}</span>
        </div>
        <div>
          <span className="detail-label">Customer</span>
          <span className="detail-value">
            {order.customer?.name}
            <small> ({order.customer?.email})</small>
          </span>
        </div>
        <div>
          <span className="detail-label">Status</span>
          <StatusBadge status={order.status} />
        </div>
        <div>
          <span className="detail-label">Placed</span>
          <span className="detail-value">
            {new Date(order.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      <table className="table compact">
        <thead>
          <tr>
            <th>Product</th>
            <th className="num">Unit price</th>
            <th className="num">Qty</th>
            <th className="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => {
            const product = productsById?.[item.product_id];
            const subtotal = Number(item.unit_price) * item.quantity;
            return (
              <tr key={item.id}>
                <td>{product ? product.name : `Product #${item.product_id}`}</td>
                <td className="num">${Number(item.unit_price).toFixed(2)}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">${subtotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="num">
              Total
            </td>
            <td className="num">
              <strong>${Number(order.total_amount).toFixed(2)}</strong>
            </td>
          </tr>
        </tfoot>
      </table>

      {nextOptions.length > 0 ? (
        <div className="status-actions">
          <span className="detail-label">Update status:</span>
          {nextOptions.map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${status === 'CANCELLED' ? 'btn-danger' : 'btn-primary'}`}
              disabled={busy}
              onClick={() => change(status)}
            >
              {status === 'CANCELLED' ? 'Cancel order' : `Mark ${status}`}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">No further status changes available.</p>
      )}
    </div>
  );
}
