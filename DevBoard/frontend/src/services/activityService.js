import api from './api';

export const getActivityLogs = async (projectId, page = 1, limit = 15) => {
  const response = await api.get(`/activity?projectId=${projectId}&page=${page}&limit=${limit}`);
  return response.data.data;
};
