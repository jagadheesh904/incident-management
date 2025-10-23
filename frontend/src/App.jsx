import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';

// Layout Components
import Layout from './components/layout/Layout';

// Page Components
import Dashboard from './pages/Dashboard';
import CreateIncident from './pages/CreateIncident';
import KnowledgeBase from './pages/KnowledgeBase';
import AdminReports from './pages/AdminReports';
import Settings from './pages/Settings';
import SimpleChat from './components/chat/SimpleChat';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-incident" element={<CreateIncident />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/reports" element={<AdminReports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chat" element={<SimpleChat />} />
            </Routes>
          </Layout>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '10px',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
