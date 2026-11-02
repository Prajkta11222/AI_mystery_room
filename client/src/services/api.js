async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error?.message || 'Something went wrong. Please try again.');
    error.code = body.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    throw error;
  }
  return body;
}
export const api = {
  create: (data, idempotencyKey) => request('/cases', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}, body: JSON.stringify(data) }),
  list: () => request('/cases'),
  get: (id, language) => request(`/cases/${id}${language ? `?language=${encodeURIComponent(language)}` : ''}`),
  hint: (id, level, language) => request(`/cases/${id}/hints`, { method: 'POST', body: JSON.stringify({ level, language }) }),
  progress: (id, data) => request(`/cases/${id}/progress`, { method: 'PATCH', body: JSON.stringify(data) }),
  accuse: (id, suspectId, language = 'en') => request(`/cases/${id}/accusation`, { method: 'POST', body: JSON.stringify({ suspectId, language }) }),
  delete: (id) => request(`/cases/${id}`, { method: 'DELETE' }),
};
