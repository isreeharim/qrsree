import api from './axios';

export const getAllUsers = () => api.get('/api/users').then((res) => res.data.data);

export const getUserById = (id) => api.get(`/api/users/${id}`).then((res) => res.data.data);

export const deleteUser = (id) => api.delete(`/api/users/${id}`).then((res) => res.data);

export const updateUserRole = (id, role) =>
  api.patch(`/api/users/${id}/role`, { role }).then((res) => res.data.data);

export const getSystemSettings = () => api.get('/api/users/settings').then((res) => res.data.data);
export const updateSystemSettings = (payload) => api.patch('/api/users/settings', payload).then((res) => res.data.data);

