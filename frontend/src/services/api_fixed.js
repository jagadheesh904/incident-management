import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Call: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Fixed API services
export const fixedAPI = {
  // Health check
  checkHealth: () => api.get('/health').then(res => res.data),
  
  // Chat API
  createSession: (sessionData = {}) => 
    api.post('/chat/sessions', sessionData).then(res => res.data),
  
  sendMessage: (sessionId, message) => 
    api.post(`/chat/sessions/${sessionId}/messages`, { content: message }).then(res => res.data),
  
  getMessages: (sessionId, limit = 100) => 
    api.get(`/chat/sessions/${sessionId}/messages`, { params: { limit } }).then(res => res.data),
  
  // Incidents API
  getIncidents: (params = {}) => 
    api.get('/incidents', { params }).then(res => res.data),
  
  createIncident: (incidentData) => 
    api.post('/incidents', incidentData).then(res => res.data),
  
  // Knowledge Base API
  getKnowledgeBase: (params = {}) => 
    api.get('/knowledge-base', { params }).then(res => res.data),
  
  // Analytics API
  getAnalytics: () => 
    api.get('/analytics/dashboard').then(res => res.data),
  
  // AI Health
  checkAIHealth: () => 
    api.get('/ai/health').then(res => res.data),
};

export default api;
