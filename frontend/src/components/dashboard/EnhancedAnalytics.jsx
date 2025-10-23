import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const EnhancedAnalytics = ({ analytics }) => {
  // Prepare data for charts
  const priorityData = Object.entries(analytics.priority_distribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const categoryData = Object.entries(analytics.category_distribution || {}).map(([name, value]) => ({
    name,
    value
  }));

  const priorityColors = {
    'Critical': '#ef4444',
    'High': '#f97316', 
    'Medium': '#eab308',
    'Low': '#3b82f6'
  };

  const categoryColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#64748b'
  ];

  // Weekly trend data (mock - in real app this would come from API)
  const weeklyTrendData = [
    { day: 'Mon', incidents: 12, resolved: 8 },
    { day: 'Tue', incidents: 18, resolved: 14 },
    { day: 'Wed', incidents: 15, resolved: 12 },
    { day: 'Thu', incidents: 22, resolved: 18 },
    { day: 'Fri', incidents: 14, resolved: 11 },
    { day: 'Sat', incidents: 8, resolved: 6 },
    { day: 'Sun', incidents: 5, resolved: 4 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Priority Distribution Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Incidents">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={priorityColors[entry.name] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="card lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="incidents" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="New Incidents"
              />
              <Line 
                type="monotone" 
                dataKey="resolved" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Resolved"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;
