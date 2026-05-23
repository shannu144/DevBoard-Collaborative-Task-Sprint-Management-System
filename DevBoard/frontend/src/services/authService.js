import api, { setAccessToken } from './api';

export const registerUser = async (name, email, password, role) => {
  const response = await api.post('/auth/register', { name, email, password, role });
  const { user, accessToken } = response.data.data;
  setAccessToken(accessToken);
  return { user, accessToken };
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { user, accessToken } = response.data.data;
  setAccessToken(accessToken);
  return { user, accessToken };
};

export const refreshSession = async () => {
  const response = await api.post('/auth/refresh');
  const { accessToken } = response.data.data;
  setAccessToken(accessToken);
  return accessToken;
};

export const logoutUser = async () => {
  await api.post('/auth/logout');
  setAccessToken('');
};

export const getAllUsers = async () => {
  const response = await api.get('/auth/users');
  return response.data.data.users;
};
