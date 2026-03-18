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
  requestOtp: (email) => api.post('/auth/request-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  checkPasswordSetup: (email) => api.post('/auth/check-password-setup', { email }),
  setupPassword: (email, newPassword) => api.post('/auth/setup-password', { email, new_password: newPassword }),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  getMe: () => api.get('/users/me'),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateMe: (data) => api.put('/users/me', data),
  changePassword: (data) => api.post('/users/me/change-password', data),
  create: (data) => api.post('/users', data),
  invite: (data) => api.post('/users/invite', data),
  deactivate: (id) => api.put(`/users/${id}/status`, { is_active: false }),
  bulkImport: (users) => api.post('/users/bulk-import', users),
  activate: (id) => api.put(`/users/${id}/status`, { is_active: true }),
  changeRole: (id, roles) => api.put(`/users/${id}/role`, { roles }),
  delete: (id) => api.delete(`/users/${id}`),
  downloadImportTemplate: () => api.get('/users/import-template', { responseType: 'blob' }),
};

export const divisionsAPI = {
  getAll: () => api.get('/divisions'),
  create: (data) => api.post('/divisions', data),
  update: (id, data) => api.put(`/divisions/${id}`, data),
  delete: (id) => api.delete(`/divisions/${id}`),
};

export const departmentsAPI = {
  getAll: (divisionId) => api.get('/departments', { params: { division_id: divisionId } }),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
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

export const divisionGroupsAPI = {
  getAll: () => api.get('/division-groups'),
  getOne: (name) => api.get(`/division-groups/${encodeURIComponent(name)}`),
  setLeader: (name, leaderId) => api.put(`/division-groups/${encodeURIComponent(name)}/leader`, { leader_id: leaderId }),
  addMember: (name, userId) => api.post(`/division-groups/${encodeURIComponent(name)}/members/${userId}`),
  removeMember: (name, userId) => api.delete(`/division-groups/${encodeURIComponent(name)}/members/${userId}`),
  getSubgroups: (name) => api.get(`/division-groups/${encodeURIComponent(name)}/subgroups`),
  createSubgroup: (name, data) => api.post(`/division-groups/${encodeURIComponent(name)}/subgroups`, data),
};

export const subgroupsAPI = {
  update: (id, data) => api.put(`/subgroups/${id}`, data),
  delete: (id) => api.delete(`/subgroups/${id}`),
  addMember: (id, userId) => api.post(`/subgroups/${id}/members/${userId}`),
  removeMember: (id, userId) => api.delete(`/subgroups/${id}/members/${userId}`),
  assignTempLeader: (id, data) => api.post(`/subgroups/${id}/temp-leader`, data),
  revokeTempLeader: (id) => api.delete(`/subgroups/${id}/temp-leader`),
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
  getApplicationExpenses: () => api.get('/expenses/application-expenses'),
  exportExcel: (params) => api.get('/expenses/export/excel', { params, responseType: 'blob' }),
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
  exportExcel: (params) => api.get('/tasks/export/excel', { params, responseType: 'blob' }),
  exportPdf: (params) => api.get('/tasks/export/pdf', { params, responseType: 'blob' }),
  assignUsers: (id, userIds) => api.post(`/tasks/${id}/assign`, { user_ids: userIds }),
  unassignUser: (id, userId) => api.delete(`/tasks/${id}/assign/${userId}`),
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
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  requestReEdit: (id, reason) => api.post(`/applications/${id}/request-re-edit`, { reason }),
  allowReEdit: (id, approved) => api.put(`/applications/${id}/allow-re-edit`, { approved }),
  addExpenses: (id, data) => api.post(`/applications/${id}/expenses`, data),
};

export const trainingApplicationsAPI = {
  getAll: () => api.get('/training-applications'),
  getOne: (id) => api.get(`/training-applications/${id}`),
  create: (data) => api.post('/training-applications', data),
  update: (id, data) => api.put(`/training-applications/${id}`, data),
  updateStatus: (id, data) => api.put(`/training-applications/${id}/status`, data),
  requestReEdit: (id, reason) => api.post(`/training-applications/${id}/request-re-edit`, { reason }),
  allowReEdit: (id, approved) => api.put(`/training-applications/${id}/allow-re-edit`, { approved }),
  addExpenses: (id, data) => api.post(`/training-applications/${id}/expenses`, data),
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
  updateRole: (id, data) => api.put(`/settings/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/settings/roles/${id}`),
  getDashboardPrefs: () => api.get('/settings/dashboard-preferences'),
  updateDashboardPrefs: (data) => api.put('/settings/dashboard-preferences', data),
  getFaqs: (params) => api.get('/settings/faqs', { params }),
  createFaq: (data) => api.post('/settings/faqs', data),
  updateFaq: (id, data) => api.put(`/settings/faqs/${id}`, data),
  deleteFaq: (id) => api.delete(`/settings/faqs/${id}`),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  export: (reportType, format = 'json', params = {}) => api.get(`/reports/export/${reportType}`, { 
    params: { format, ...params },
    responseType: ['excel', 'pdf', 'csv'].includes(format) ? 'blob' : 'json'
  }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getReportSummary: () => api.get('/dashboard/report-summary'),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const groupMessagesAPI = {
  createConversation: (data) => api.post('/messages/group-conversation', data),
};

export const pdpAPI = {
  getAll: (params) => api.get('/pdp', { params }),
  getById: (id) => api.get(`/pdp/${id}`),
  create: (data) => api.post('/pdp', data),
  update: (id, data) => api.put(`/pdp/${id}`, data),
  delete: (id) => api.delete(`/pdp/${id}`),
};

export const eventsAPI = {  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

export const documentsAPI = {
  getAll: (userId) => api.get(`/users/${userId}/documents`),
  upload: (userId, data) => api.post(`/users/${userId}/documents`, data),
  updateStatus: (userId, docId, data) => api.put(`/users/${userId}/documents/${docId}`, data),
  delete: (userId, docId) => api.delete(`/users/${userId}/documents/${docId}`),
};

export default api;
