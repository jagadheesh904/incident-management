import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp,
  PieChart
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

const AdminReports = () => {
  const [analytics, setAnalytics] = useState({});
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await analyticsAPI.getDashboardAnalytics();
      if (response.success) {
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const reportSections = [
    {
      title: 'Incident Overview',
      icon: BarChart3,
      metrics: [
        { label: 'Total Incidents', value: analytics.total_incidents },
        { label: 'Open Incidents', value: analytics.open_incidents },
        { label: 'Resolved Today', value: analytics.resolved_today },
        { label: 'Avg Resolution Time', value: `${analytics.average_resolution_time}m` }
      ]
    },
    {
      title: 'AI Performance',
      icon: TrendingUp,
      metrics: [
        { label: 'AI Resolution Rate', value: `${(analytics.ai_resolution_rate * 100).toFixed(1)}%` },
        { label: 'User Satisfaction', value: `${analytics.user_satisfaction_score}/5` },
        { label: 'First Contact Resolution', value: '78%' },
        { label: 'Avg Response Time', value: '2.3m' }
      ]
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Reports</h1>
          <p className="text-gray-600">
            Comprehensive analytics and insights for your incident management system.
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field text-sm"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
          
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.total_incidents}</div>
          <div className="text-sm text-gray-500">Total Incidents</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.average_resolution_time}m</div>
          <div className="text-sm text-gray-500">Avg. Resolution</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{(analytics.ai_resolution_rate * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-500">AI Resolution Rate</div>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <PieChart className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{analytics.user_satisfaction_score}/5</div>
          <div className="text-sm text-gray-500">Satisfaction Score</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Sections */}
        {reportSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Icon className="w-5 h-5 text-sigmoid-blue" />
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {section.metrics.map((metric, metricIndex) => (
                  <div key={metricIndex} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {metric.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority Distribution */}
      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Priority Distribution</h2>
        
        <div className="space-y-4">
          {Object.entries(analytics.priority_distribution || {}).map(([priority, count]) => {
            const percentage = analytics.total_incidents > 0 
              ? (count / analytics.total_incidents) * 100 
              : 0;
            
            return (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    priority === 'Critical' ? 'bg-red-500' :
                    priority === 'High' ? 'bg-orange-500' :
                    priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="font-medium text-gray-700">{priority}</span>
                </div>
                
                <div className="flex items-center space-x-4 flex-1 max-w-md">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        priority === 'Critical' ? 'bg-red-500' :
                        priority === 'High' ? 'bg-orange-500' :
                        priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right w-20">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Category Distribution</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(analytics.category_distribution || {}).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <span className="font-medium text-gray-700">{category}</span>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{count}</span>
                <span className="text-sm text-gray-500 block">
                  {((count / analytics.total_incidents) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA Compliance */}
      <div className="card mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">SLA Compliance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-green-600">98%</div>
            <p className="text-green-700 text-sm">Service Level Agreement Compliance</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-600 font-medium">Excellent</div>
            <p className="text-green-700 text-xs">Exceeding target of 95%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
