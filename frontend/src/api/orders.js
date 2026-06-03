import client from './client';

export async function listOrders() {
  const { data } = await client.get('/orders');
  return data;
}

export async function getOrder(id) {
  const { data } = await client.get(`/orders/${id}`);
  return data;
}

export async function createOrder(payload) {
  const { data } = await client.post('/orders', payload);
  return data;
}

export async function updateOrderStatus(id, status) {
  const { data } = await client.patch(`/orders/${id}/status`, { status });
  return data;
}
