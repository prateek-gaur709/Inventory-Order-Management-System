import client from './client';

export async function listCustomers() {
  const { data } = await client.get('/customers');
  return data;
}

export async function getCustomer(id) {
  const { data } = await client.get(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload) {
  const { data } = await client.post('/customers', payload);
  return data;
}

export async function updateCustomer(id, payload) {
  const { data } = await client.put(`/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id) {
  await client.delete(`/customers/${id}`);
}
