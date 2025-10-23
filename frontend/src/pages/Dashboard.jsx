import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageSquare,
  Zap,
  Download
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { enhancedAPI } from '../services/enhanced_api';
import EnhancedAnalytics from '../components/dashboard/EnhancedAnalytics';

const Dashboard = () => {
  const { analytics, incidents, fetchAnalytics } = useApp();
  const [enhancedAnalytics, setEnhancedAnalytics] = useState(null);
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);

  useEffect(() => {
    fetchEnhancedAnalytics();
  }, []);

  const fetchEnhancedAnalytics = async () => {
    try {
      const response = await enhancedAPI.getEnhancedAnalytics();
      if (response.success) {
        setEnhancedAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Error fetching enhanced analytics:', error);
    }
  };

  const exportDashboardData = async () => {
    try {
      const response = await enhancedAPI.exportAnalyticsReport();
      if (response.success) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(response.report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
    }
  };

  const stats = [
    {
      label: 'Total Incidents',
      value: analytics.total_incidents,
      icon: AlertCircle,
      color: 'bg-blue-500',
      change: '+12%',
      trend: 'up',
      description: 'All time incidents'
    },
    {
      label: 'Open Incidents',
      value: analytics.open_incidents,
      icon: Clock,
      color: 'bg-orange-500',
      change: '-5%',
      trend: 'down',
      description: 'Currently active'
    },
    {
      label: 'Resolved Today',
      value: analytics.resolved_today,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+8%',
      trend: 'up',
      description: 'Completed today'
    },
    {
      label: 'AI Resolution Rate',
      value: `${(analytics.ai_resolution_rate * 100).toFixed(1)}%`,
      icon: MessageSquare,
      color: 'bg-purple-500',
      change: '+3%',
      trend: 'up',
      description: 'AI-assisted solutions'
    }
  ];

  const recentIncidents = incidents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Banner */}
      <div className="bg-gradient-to-r from-sigmoid-blue to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="w-8 h-8 text-yellow-300" />
              <h2 className="text-2xl font-bold">Welcome to Sigmoid Services</h2>
            </div>
            <p className="text-blue-100 text-lg">
              Your AI-powered incident management system with enhanced analytics and intelligent assistance.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-sm font-medium">Enhanced Features</p>
              <div className="flex space-x-3 mt-2">
                <button 
                  onClick={() => window.location.href = '/chat'}
                  className="bg-white text-sigmoid-blue px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>AI Assistant</span>
                </button>
                <button 
                  onClick={exportDashboardData}
                  className="border border-white text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:bg-opacity-10 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  <div className={`flex items-center mt-2 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{stat.change} from last week</span>
                  </div>
                </div>
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Analytics Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics</h3>
        <button
          onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
          className="flex items-center space-x-2 text-sm text-sigmoid-blue hover:text-sigmoid-dark font-medium"
        >
          <Zap className="w-4 h-4" />
          <span>{showAdvancedCharts ? 'Hide Charts' : 'Show Advanced Charts'}</span>
        </button>
      </div>

      {/* Enhanced Analytics Charts */}
      {showAdvancedCharts && enhancedAnalytics && (
        <EnhancedAnalytics analytics={enhancedAnalytics} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
            <button className="text-sm text-sigmoid-blue hover:text-sigmoid-dark font-medium">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentIncidents.length > 0 ? (
              recentIncidents.map((incident) => (
                <div key={incident.incident_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-sigmoid-blue transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{incident.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{incident.incident_id}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(incident.created_at).toLocaleDateString()} • {incident.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.status === 'Open' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : incident.status === 'Resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {incident.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      {incident.priority?.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No incidents found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Create your first incident to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">System Performance</h3>
          
          <div className="space-y-6">
            {/* AI Performance */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">AI Assistant Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {enhancedAnalytics?.ai_resolution_rate ? (enhancedAnalytics.ai_resolution_rate * 100).toFixed(1) : '87.5'}%
                  </div>
                  <div className="text-xs text-blue-600">Resolution Rate</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {enhancedAnalytics?.user_satisfaction_score || '4.6'}/5
                  </div>
                  <div className="text-xs text-green-600">Satisfaction</div>
                </div>
              </div>
            </div>

            {/* SLA Compliance */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">SLA Compliance</h4>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full h-3 relative">
                <div 
                  className="absolute inset-0 bg-green-400 rounded-full"
                  style={{ width: `${enhancedAnalytics?.sla_compliance || 98}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Current: {enhancedAnalytics?.sla_compliance || 98}%</span>
                <span>Target: 95%</span>
              </div>
            </div>

            {/* Response Times */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Response Times</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">First Response</span>
                  <span className="text-sm font-medium text-gray-900">2.3 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Resolution</span>
                  <span className="text-sm font-medium text-gray-900">
                    {analytics.average_resolution_time || 45} min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Response</span>
                  <span className="text-sm font-medium text-gray-900">1.8 sec</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center hover:shadow-md transition-shadow">
          <Users className="w-8 h-8 text-sigmoid-blue mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">{enhancedAnalytics?.sla_compliance || 98}%</div>
          <div className="text-sm text-gray-500">SLA Compliance</div>
        </div>
        
        <div className="card text-center hover:shadow-md transition-shadow">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">{enhancedAnalytics?.first_contact_resolution || 87}%</div>
          <div className="text-sm text-gray-500">First Contact Resolution</div>
        </div>
        
        <div className="card text-center hover:shadow-md transition-shadow">
          <MessageSquare className="w-8 h-8 text-purple-500 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">24/7</div>
          <div className="text-sm text-gray-500">AI Support Available</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
