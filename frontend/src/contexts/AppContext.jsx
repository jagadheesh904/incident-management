import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { fixedAPI } from '../services/api_fixed';
import toast from 'react-hot-toast';

const AppContext = createContext();

// Initial state
const initialState = {
  user: {
    id: 1,
    username: 'demo_user',
    email: 'user@sigmoid.com',
    full_name: 'Demo User',
    department: 'IT',
    role: 'user'
  },
  incidents: [],
  currentIncident: null,
  incidentsLoading: false,
  chatSession: null,
  chatMessages: [],
  isChatLoading: false,
  analytics: {
    total_incidents: 0,
    open_incidents: 0,
    resolved_today: 0,
    priority_distribution: {},
    category_distribution: {},
    average_resolution_time: 0,
    ai_resolution_rate: 0,
    user_satisfaction_score: 0
  },
  activeView: 'dashboard',
  sidebarOpen: true,
  theme: 'light'
};

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_INCIDENTS: 'SET_INCIDENTS',
  SET_CURRENT_INCIDENT: 'SET_CURRENT_INCIDENT',
  SET_ANALYTICS: 'SET_ANALYTICS',
  SET_CHAT_SESSION: 'SET_CHAT_SESSION',
  SET_CHAT_MESSAGES: 'SET_CHAT_MESSAGES',
  SET_CHAT_LOADING: 'SET_CHAT_LOADING',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  ADD_INCIDENT: 'ADD_INCIDENT',
  UPDATE_INCIDENT: 'UPDATE_INCIDENT'
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        incidentsLoading: action.payload
      };
      
    case ACTION_TYPES.SET_INCIDENTS:
      return {
        ...state,
        incidents: action.payload,
        incidentsLoading: false
      };
      
    case ACTION_TYPES.SET_CURRENT_INCIDENT:
      return {
        ...state,
        currentIncident: action.payload
      };
      
    case ACTION_TYPES.SET_ANALYTICS:
      return {
        ...state,
        analytics: action.payload
      };
      
    case ACTION_TYPES.SET_CHAT_SESSION:
      return {
        ...state,
        chatSession: action.payload
      };
      
    case ACTION_TYPES.SET_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: action.payload
      };
      
    case ACTION_TYPES.SET_CHAT_LOADING:
      return {
        ...state,
        isChatLoading: action.payload
      };
      
    case ACTION_TYPES.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
      
    case ACTION_TYPES.SET_ACTIVE_VIEW:
      return {
        ...state,
        activeView: action.payload
      };
      
    case ACTION_TYPES.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
      
    case ACTION_TYPES.ADD_INCIDENT:
      return {
        ...state,
        incidents: [action.payload, ...state.incidents]
      };
      
    case ACTION_TYPES.UPDATE_INCIDENT:
      return {
        ...state,
        incidents: state.incidents.map(inc => 
          inc.incident_id === action.payload.incident_id ? action.payload : inc
        ),
        currentIncident: state.currentIncident?.incident_id === action.payload.incident_id 
          ? action.payload 
          : state.currentIncident
      };
      
    default:
      return state;
  }
}

// Context Provider
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    setLoading: (loading) => 
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading }),
    
    setIncidents: (incidents) => 
      dispatch({ type: ACTION_TYPES.SET_INCIDENTS, payload: incidents }),
    
    setCurrentIncident: (incident) => 
      dispatch({ type: ACTION_TYPES.SET_CURRENT_INCIDENT, payload: incident }),
    
    setAnalytics: (analytics) => 
      dispatch({ type: ACTION_TYPES.SET_ANALYTICS, payload: analytics }),
    
    setChatSession: (session) => 
      dispatch({ type: ACTION_TYPES.SET_CHAT_SESSION, payload: session }),
    
    setChatMessages: (messages) => 
      dispatch({ type: ACTION_TYPES.SET_CHAT_MESSAGES, payload: messages }),
    
    setChatLoading: (loading) => 
      dispatch({ type: ACTION_TYPES.SET_CHAT_LOADING, payload: loading }),
    
    addChatMessage: (message) => 
      dispatch({ type: ACTION_TYPES.ADD_CHAT_MESSAGE, payload: message }),
    
    setActiveView: (view) => 
      dispatch({ type: ACTION_TYPES.SET_ACTIVE_VIEW, payload: view }),
    
    toggleSidebar: () => 
      dispatch({ type: ACTION_TYPES.TOGGLE_SIDEBAR }),
    
    addIncident: (incident) => 
      dispatch({ type: ACTION_TYPES.ADD_INCIDENT, payload: incident }),
    
    updateIncident: (incident) => 
      dispatch({ type: ACTION_TYPES.UPDATE_INCIDENT, payload: incident })
  };

  // Data fetching functions
  const fetchIncidents = async (filters = {}) => {
    try {
      actions.setLoading(true);
      const response = await fixedAPI.getIncidents(filters);
      if (response.success) {
        actions.setIncidents(response.incidents);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      // Set mock data for demo
      actions.setIncidents([
        {
          incident_id: 'INC20250115001',
          title: 'Outlook not opening on Windows 11',
          description: 'Outlook application fails to start',
          category: 'Email',
          priority: 'High',
          status: 'Open',
          created_by: 'Demo User',
          created_at: new Date().toISOString()
        },
        {
          incident_id: 'INC20250115002', 
          title: 'VPN connection failure',
          description: 'Cannot connect to company VPN',
          category: 'Network',
          priority: 'Medium',
          status: 'In Progress',
          created_by: 'Demo User',
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fixedAPI.getAnalytics();
      if (response.success) {
        actions.setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock analytics
      actions.setAnalytics({
        total_incidents: 2,
        open_incidents: 1,
        resolved_today: 1,
        priority_distribution: { High: 1, Medium: 1 },
        category_distribution: { Email: 1, Network: 1 },
        average_resolution_time: 45,
        ai_resolution_rate: 0.87,
        user_satisfaction_score: 4.6
      });
    }
  };

  const createChatSession = async () => {
    try {
      const response = await fixedAPI.createSession({
        user_id: state.user.id
      });
      if (response.success) {
        actions.setChatSession(response.session);
        actions.setChatMessages([response.welcome_message]);
        return response.session_id;
      }
    } catch (error) {
      console.error('Error creating chat session:', error);
      // Create mock session
      const mockSession = {
        session_id: 'mock-' + Date.now(),
        user_id: state.user.id,
        status: 'active'
      };
      actions.setChatSession(mockSession);
      actions.setChatMessages([{
        id: 1,
        session_id: mockSession.session_id,
        message_type: 'bot',
        content: 'Hello! I\'m SigmaAI. How can I help you with IT issues today?',
        timestamp: new Date().toISOString()
      }]);
      return mockSession.session_id;
    }
  };

  const sendChatMessage = async (message) => {
    if (!state.chatSession) return;
    
    try {
      actions.setChatLoading(true);
      
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        session_id: state.chatSession.session_id,
        message_type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      actions.addChatMessage(userMessage);
      
      // Send to API
      const response = await fixedAPI.sendMessage(state.chatSession.session_id, message);
      if (response.success) {
        actions.addChatMessage(response.bot_response);
        actions.setChatSession(response.session_updated);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast.error('Failed to send message');
      
      // Add mock response
      const mockResponse = {
        id: Date.now(),
        session_id: state.chatSession.session_id,
        message_type: 'bot',
        content: 'I understand you\'re having an issue. To help you better, could you provide more details about what you\'re experiencing?',
        timestamp: new Date().toISOString(),
        message_metadata: { type: 'information', confidence: 0.8 }
      };
      actions.addChatMessage(mockResponse);
    } finally {
      actions.setChatLoading(false);
    }
  };

  const createIncident = async (incidentData) => {
    try {
      // For demo purposes, create a mock incident
      const mockIncident = {
        incident_id: `INC${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
        ...incidentData,
        created_by: state.user.full_name,
        status: 'Open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      actions.addIncident(mockIncident);
      fetchAnalytics(); // Refresh analytics
      toast.success(`Incident ${mockIncident.incident_id} created successfully!`);
      return mockIncident;
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Failed to create incident');
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    fetchIncidents();
    fetchAnalytics();
  }, []);

  const value = {
    ...state,
    ...actions,
    fetchIncidents,
    fetchAnalytics,
    createChatSession,
    sendChatMessage,
    createIncident
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use app context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
