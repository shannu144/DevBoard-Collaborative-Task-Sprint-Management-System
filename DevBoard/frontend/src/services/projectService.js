import api from './api';

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data.data.projects;
};

export const getProjectDetails = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data.data.project;
};

export const createProject = async (projectData) => {
  const response = await api.post('/projects', projectData);
  return response.data.data.project;
};

export const updateProject = async (id, projectData) => {
  const response = await api.put(`/projects/${id}`, projectData);
  return response.data.data.project;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};

export const getProjectSprints = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/sprints`);
  return response.data.data.sprints;
};

export const createSprint = async (projectId, sprintData) => {
  const response = await api.post(`/projects/${projectId}/sprints`, sprintData);
  return response.data.data.sprint;
};

export const updateSprint = async (sprintId, sprintData) => {
  const response = await api.put(`/projects/sprints/${sprintId}`, sprintData);
  return response.data.data.sprint;
};

export const seedDemoWorkspace = async () => {
  const response = await api.post('/projects/seed');
  return response.data.data;
};
