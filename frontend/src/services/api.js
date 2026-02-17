import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getMicrosoftAuthUrl: () => api.get('/auth/microsoft/login'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
};

export const teamsAPI = {
  getAll: () => api.get('/teams'),
  getOne: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  getMembers: (id) => api.get(`/teams/${id}/members`),
  addMember: (teamId, userId) => api.post(`/teams/${teamId}/members/${userId}`),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};

export const meetingsAPI = {
  getAll: (params) => api.get('/meetings', { params }),
  getOne: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
};

export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getShared: () => api.get('/notes/shared'),
  getOne: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  share: (id, userIds, teamIds) => api.post(`/notes/${id}/share`, { user_ids: userIds, team_ids: teamIds }),
  getFolders: () => api.get('/notes/folders/list'),
  createFolder: (data) => api.post('/notes/folders', data),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (id) => api.get(`/messages/conversations/${id}`),
  createConversation: (data) => api.post('/messages/conversations', data),
  getMessages: (conversationId, limit = 50) => api.get(`/messages/conversations/${conversationId}/messages`, { params: { limit } }),
  sendMessage: (conversationId, data) => api.post(`/messages/conversations/${conversationId}/messages`, data),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getStats: () => api.get('/expenses/stats'),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  approve: (id) => api.post(`/expenses/${id}/approve`),
  reject: (id, reason) => api.post(`/expenses/${id}/reject`, { reason }),
};

export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getStats: () => api.get('/tickets/stats'),
  getOne: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getComments: (ticketId) => api.get(`/tickets/${ticketId}/comments`),
  addComment: (ticketId, data) => api.post(`/tickets/${ticketId}/comments`, data),
};

export const filesAPI = {
  getAll: (params) => api.get('/files', { params }),
  getOne: (id) => api.get(`/files/${id}`),
  create: (data) => api.post('/files', data),
  update: (id, data) => api.put(`/files/${id}`, data),
  delete: (id) => api.delete(`/files/${id}`),
  share: (id, userIds, teamIds) => api.post(`/files/${id}/share`, { user_ids: userIds, team_ids: teamIds }),
  getFolders: (params) => api.get('/files/folders/list', { params }),
  createFolder: (data) => api.post('/files/folders', data),
};

export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const clientsAPI = {
  getAll: () => api.get('/clients'),
  create: (data) => api.post('/clients', data),
};

export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
};

export const prospectsAPI = {
  getAll: (params) => api.get('/prospects', { params }),
  create: (data) => api.post('/prospects', data),
  update: (id, data) => api.put(`/prospects/${id}`, data),
  delete: (id) => api.delete(`/prospects/${id}`),
};

export const sponsorsAPI = {
  getAll: (params) => api.get('/sponsors', { params }),
  getOne: (id) => api.get(`/sponsors/${id}`),
  create: (data) => api.post('/sponsors', data),
  update: (id, data) => api.put(`/sponsors/${id}`, data),
  delete: (id) => api.delete(`/sponsors/${id}`),
  getContacts: (sponsorId) => api.get(`/sponsors/${sponsorId}/contacts`),
  createContact: (data) => api.post('/sponsors/contacts', data),
};

export const applicationsAPI = {
  getAll: () => api.get('/applications'),
  getOne: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
};

export const bbbeeAPI = {
  getAll: () => api.get('/bbbee'),
  create: (data) => api.post('/bbbee', data),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  testSmtp: (email) => api.post('/settings/smtp/test', null, { params: { email } }),
  getRoles: () => api.get('/settings/roles'),
  createRole: (data) => api.post('/settings/roles', data),
  getFaqs: (params) => api.get('/settings/faqs', { params }),
  createFaq: (data) => api.post('/settings/faqs', data),
  updateFaq: (id, data) => api.put(`/settings/faqs/${id}`, data),
  deleteFaq: (id) => api.delete(`/settings/faqs/${id}`),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  export: (reportType, format = 'json') => api.get(`/reports/export/${reportType}`, { 
    params: { format },
    responseType: format === 'csv' ? 'blob' : 'json'
  }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
