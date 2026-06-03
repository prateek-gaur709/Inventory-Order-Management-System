import { useState } from 'react';
import { ErrorBanner } from './Banner.jsx';

const empty = { sku: '', name: '', description: '', price: '', stock_quantity: '' };

export default function ProductForm({ initial, onSubmit, onCancel }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(
    initial
      ? {
          sku: initial.sku,
          name: initial.name,
          description: initial.description || '',
          price: String(initial.price),
          stock_quantity: String(initial.stock_quantity),
        }
      : empty
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    if (!isEdit && !form.sku.trim()) return 'SKU is required.';
    if (!form.name.trim()) return 'Name is required.';
    if (form.price === '' || Number(form.price) < 0) return 'Price must be 0 or more.';
    if (form.stock_quantity === '' || Number(form.stock_quantity) < 0)
      return 'Stock must be 0 or more.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
      };
      if (!isEdit) payload.sku = form.sku.trim();
      await onSubmit(payload);
    } catch (err) {
      setError(err.userMessage || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ErrorBanner message={error} />
      <label className="field">
        <span>SKU</span>
        <input
          value={form.sku}
          onChange={set('sku')}
          disabled={isEdit}
          placeholder="e.g. SKU-1001"
        />
      </label>
      <label className="field">
        <span>Name</span>
        <input value={form.name} onChange={set('name')} placeholder="Product name" />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          value={form.description}
          onChange={set('description')}
          rows={2}
          placeholder="Optional"
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Price</span>
          <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} />
        </label>
        <label className="field">
          <span>Stock quantity</span>
          <input
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={set('stock_quantity')}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}
