import api from './api';

export const getTasks = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.projectId) params.append('projectId', filters.projectId);
  if (filters.sprintId) params.append('sprintId', filters.sprintId);
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);

  const response = await api.get(`/tasks?${params.toString()}`);
  return response.data.data.tasks;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data.data.task;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data.data.task;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};
