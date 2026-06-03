import { useState } from 'react';
import { ErrorBanner } from './Banner.jsx';

const EMPTY = { name: '', email: '', phone: '', address: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CustomerForm({ initial, onSubmit, onCancel }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          email: initial.email,
          phone: initial.phone || '',
          address: initial.address || '',
        }
      : EMPTY
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (!EMAIL_RE.test(form.email.trim())) return 'A valid email is required.';
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
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      });
    } catch (err) {
      setError(err.userMessage || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ErrorBanner message={error} />
      <label className="field">
        <span>Name</span>
        <input value={form.name} onChange={set('name')} placeholder="Full name" />
      </label>
      <label className="field">
        <span>Email</span>
        <input value={form.email} onChange={set('email')} placeholder="name@example.com" />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Phone</span>
          <input value={form.phone} onChange={set('phone')} placeholder="Optional" />
        </label>
        <label className="field">
          <span>Address</span>
          <input value={form.address} onChange={set('address')} placeholder="Optional" />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
        </button>
      </div>
    </form>
  );
}
