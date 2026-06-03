const STATUS_CLASS = {
  PENDING: 'badge badge-pending',
  CONFIRMED: 'badge badge-confirmed',
  SHIPPED: 'badge badge-shipped',
  CANCELLED: 'badge badge-cancelled',
};

export default function StatusBadge({ status }) {
  return <span className={STATUS_CLASS[status] || 'badge'}>{status}</span>;
}
