import api from './axios';

export const getAllQrCodes = () => api.get('/api/qrcodes').then((res) => res.data.data);

export const getQrCodeById = (id) => api.get(`/api/qrcodes/${id}`).then((res) => res.data.data);

export const createQrCode = (payload) =>
  api.post('/api/qrcodes', payload).then((res) => res.data.data);

export const updateQrCode = (id, payload) =>
  api.put(`/api/qrcodes/${id}`, payload).then((res) => res.data.data);

export const deleteQrCode = (id) => api.delete(`/api/qrcodes/${id}`).then((res) => res.data);

export const getScanHistory = (id) =>
  api.get(`/api/qrcodes/${id}/scans`).then((res) => res.data.data);
