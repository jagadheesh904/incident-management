import axios from 'axios';

const API_BASE_URL = '/api';

// Create enhanced axios instance
const enhancedApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 seconds for enhanced features
});

// Enhanced API services
export const enhancedAPI = {
  // Enhanced chat with better AI
  sendEnhancedMessage: (sessionId, message) => 
    enhancedApi.post(`/chat/sessions/${sessionId}/messages/enhanced`, { content: message }).then(res => res.data),
  
  // File upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return enhancedApi.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  
  // Export endpoints
  exportIncidentsCSV: (params = {}) => 
    enhancedApi.get('/export/incidents/csv', { params }).then(res => res.data),
  
  exportAnalyticsReport: () => 
    enhancedApi.get('/export/analytics/report').then(res => res.data),
  
  // Multi-language support
  getSupportedLanguages: () => 
    enhancedApi.get('/languages').then(res => res.data),
  
  // AI health check
  checkAIHealth: () => 
    enhancedApi.get('/ai/health').then(res => res.data),
  
  // Enhanced analytics
  getEnhancedAnalytics: () => 
    enhancedApi.get('/analytics/dashboard/enhanced').then(res => res.data),
};

export default enhancedApi;
