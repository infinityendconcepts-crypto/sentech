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

export const applicationsAPI = {
  getAll: () => api.get('/applications'),
  getOne: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
};

export const sponsorsAPI = {
  getAll: () => api.get('/sponsors'),
  create: (data) => api.post('/sponsors', data),
};

export const bbbeeAPI = {
  getAll: () => api.get('/bbbee'),
  create: (data) => api.post('/bbbee', data),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
};

export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
};

export const leadsAPI = {
  getAll: () => api.get('/leads'),
  create: (data) => api.post('/leads', data),
};

export const notesAPI = {
  getAll: () => api.get('/notes'),
  create: (data) => api.post('/notes', data),
};

export const messagesAPI = {
  getAll: () => api.get('/messages'),
  create: (data) => api.post('/messages', data),
};

export const ticketsAPI = {
  getAll: () => api.get('/tickets'),
  create: (data) => api.post('/tickets', data),
};

export const expensesAPI = {
  getAll: () => api.get('/expenses'),
  create: (data) => api.post('/expenses', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;