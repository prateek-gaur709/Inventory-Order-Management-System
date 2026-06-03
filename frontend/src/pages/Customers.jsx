import { useEffect, useState } from 'react';
import * as api from '../api/customers.js';
import Modal from '../components/Modal.jsx';
import CustomerForm from '../components/CustomerForm.jsx';
import { ErrorBanner, Loading, Empty } from '../components/Banner.jsx';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setCustomers(await api.listCustomers());
    } catch (err) {
      setError(err.userMessage || 'Failed to load customers.');
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
  const openEdit = (customer) => {
    setEditing(customer);
    setShowForm(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) {
      await api.updateCustomer(editing.id, payload);
    } else {
      await api.createCustomer(payload);
    }
    setShowForm(false);
    await load();
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.name}"?`)) return;
    try {
      await api.deleteCustomer(customer.id);
      await load();
    } catch (err) {
      setError(err.userMessage || 'Failed to delete customer.');
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <p className="muted">People who place orders.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          + Add customer
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Loading label="Loading customers…" />
      ) : customers.length === 0 ? (
        <Empty label="No customers yet. Add your first customer." />
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="cell-title">{c.name}</td>
                  <td className="mono">{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td className="actions-col">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-danger-text"
                      onClick={() => handleDelete(c)}
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
          title={editing ? 'Edit customer' : 'New customer'}
          onClose={() => setShowForm(false)}
        >
          <CustomerForm
            initial={editing}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </section>
  );
}
