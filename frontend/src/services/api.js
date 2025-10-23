import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.error('Server error - please check backend logs');
    }
    
    return Promise.reject(error);
  }
);

// Incident API
export const incidentAPI = {
  // Get all incidents with optional filters
  getIncidents: (params = {}) => 
    api.get('/incidents', { params }).then(res => res.data),
  
  // Get specific incident
  getIncident: (incidentId) => 
    api.get(`/incidents/${incidentId}`).then(res => res.data),
  
  // Create new incident
  createIncident: (incidentData) => 
    api.post('/incidents', incidentData).then(res => res.data),
  
  // Update incident
  updateIncident: (incidentId, updateData) => 
    api.put(`/incidents/${incidentId}`, updateData).then(res => res.data),
  
  // Resolve incident
  resolveIncident: (incidentId, resolutionData) => 
    api.post(`/incidents/${incidentId}/resolve`, resolutionData).then(res => res.data),
  
  // Get categories
  getCategories: () => 
    api.get('/categories').then(res => res.data),
};

// Chat API
export const chatAPI = {
  // Create new chat session
  createSession: (sessionData = {}) => 
    api.post('/chat/sessions', sessionData).then(res => res.data),
  
  // Send message
  sendMessage: (sessionId, message) => 
    api.post(`/chat/sessions/${sessionId}/messages`, { content: message }).then(res => res.data),
  
  // Get chat history
  getMessages: (sessionId, limit = 100) => 
    api.get(`/chat/sessions/${sessionId}/messages`, { params: { limit } }).then(res => res.data),
};

// Knowledge Base API
export const kbAPI = {
  // Get knowledge base entries
  getKnowledgeBase: (params = {}) => 
    api.get('/knowledge-base', { params }).then(res => res.data),
};

// Analytics API
export const analyticsAPI = {
  // Get dashboard analytics
  getDashboardAnalytics: () => 
    api.get('/analytics/dashboard').then(res => res.data),
};

// Health check
export const healthAPI = {
  checkHealth: () => 
    api.get('/health').then(res => res.data),
};

export default api;
