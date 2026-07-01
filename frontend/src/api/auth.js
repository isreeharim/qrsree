import api from './axios';

export const login = (username, password) =>
  api.post('/api/auth/login', { username, password }).then((res) => res.data);

export const getMe = () => api.get('/api/auth/me').then((res) => res.data);
