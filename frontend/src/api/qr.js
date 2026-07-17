import api from './axios';

export const getAllQrCodes = () => api.get('/api/qrcodes').then((res) => res.data.data);

export const getQrCodeById = (id) => api.get(`/api/qrcodes/${id}`).then((res) => res.data.data);

export const createQrCode = (payload) =>
  api.post('/api/qrcodes', payload).then((res) => res.data.data);

export const updateQrCode = (id, payload) =>
  api.put(`/api/qrcodes/${id}`, payload).then((res) => res.data.data);

export const deleteQrCode = (id) => api.delete(`/api/qrcodes/${id}`).then((res) => res.data);

export const getScanHistory = (id, page = 1, limit = 50) =>
  api.get(`/api/qrcodes/${id}/scans`, { params: { page, limit } }).then((res) => res.data);

export const toggleQrStatus = (id) =>
  api.patch(`/api/qrcodes/${id}/toggle`).then((res) => res.data.data);

export const exportQrScans = async (id, shortCode) => {
  const token = localStorage.getItem('qr_admin_token');
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const response = await fetch(`${baseURL}/api/qrcodes/${id}/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to export CSV');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scans-${shortCode || id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

