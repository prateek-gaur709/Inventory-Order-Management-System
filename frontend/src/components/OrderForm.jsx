import { useState } from 'react';
import { ErrorBanner } from './Banner.jsx';

const newLine = () => ({ product_id: '', quantity: '1' });

export default function OrderForm({ customers, products, onSubmit, onCancel }) {
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([newLine()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const productById = Object.fromEntries(products.map((p) => [String(p.id), p]));

  const updateLine = (index, key, value) => {
    setLines(lines.map((line, i) => (i === index ? { ...line, [key]: value } : line)));
  };
  const addLine = () => setLines([...lines, newLine()]);
  const removeLine = (index) => setLines(lines.filter((_, i) => i !== index));

  const total = lines.reduce((sum, line) => {
    const product = productById[line.product_id];
    const qty = Number(line.quantity);
    if (!product || !qty) return sum;
    return sum + Number(product.price) * qty;
  }, 0);

  const validate = () => {
    if (!customerId) return 'Select a customer.';
    if (!lines.length) return 'Add at least one product.';
    for (const line of lines) {
      if (!line.product_id) return 'Every line must have a product selected.';
      if (!Number(line.quantity) || Number(line.quantity) < 1)
        return 'Every quantity must be at least 1.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        customer_id: Number(customerId),
        items: lines.map((line) => ({
          product_id: Number(line.product_id),
          quantity: Number(line.quantity),
        })),
      });
    } catch (err) {
      setError(err.userMessage || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ErrorBanner message={error} />

      <label className="field">
        <span>Customer</span>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.email}
            </option>
          ))}
        </select>
      </label>

      <div className="lines">
        <div className="lines-head">
          <span>Line items</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addLine}>
            + Add item
          </button>
        </div>

        {lines.map((line, index) => {
          const product = productById[line.product_id];
          return (
            <div className="line-row" key={index}>
              <select
                value={line.product_id}
                onChange={(e) => updateLine(index, 'product_id', e.target.value)}
              >
                <option value="">Select product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${Number(p.price).toFixed(2)} ({p.stock_quantity} in stock)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="qty-input"
                value={line.quantity}
                onChange={(e) => updateLine(index, 'quantity', e.target.value)}
              />
              <span className="line-subtotal">
                {product ? `$${(Number(product.price) * Number(line.quantity || 0)).toFixed(2)}` : '—'}
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => removeLine(index)}
                disabled={lines.length === 1}
                aria-label="Remove line"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="order-total">
        <span>Total</span>
        <strong>${total.toFixed(2)}</strong>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Placing…' : 'Place order'}
        </button>
      </div>
    </form>
  );
}
