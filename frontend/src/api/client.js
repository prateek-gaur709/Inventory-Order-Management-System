import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Normalize any axios error into a human-readable message.
 * Prefers the backend's `{ detail: "..." }` shape, then falls back
 * sensibly for network / unexpected errors. The normalized message is
 * attached as `error.userMessage` and also stored on `error.status`.
 */
function extractMessage(error) {
  const data = error?.response?.data;

  if (data) {
    // FastAPI / our contract: { detail: "message" }
    if (typeof data.detail === 'string') return data.detail;

    // Pydantic 422 validation: { detail: [{ loc, msg, ... }] }
    if (Array.isArray(data.detail)) {
      const msgs = data.detail
        .map((d) => {
          const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
          return field ? `${field}: ${d.msg}` : d.msg;
        })
        .filter(Boolean);
      if (msgs.length) return msgs.join('; ');
    }

    if (typeof data.message === 'string') return data.message;
    if (typeof data === 'string') return data;
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check that the API is running and VITE_API_URL is correct.';
  }

  return error?.message || 'Something went wrong. Please try again.';
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = extractMessage(error);
    error.status = error?.response?.status ?? null;
    return Promise.reject(error);
  }
);

export default client;
