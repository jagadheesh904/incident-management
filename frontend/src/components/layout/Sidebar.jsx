import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  BookOpen, 
  BarChart3, 
  Settings, 
  MessageSquare,
  X
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const Sidebar = () => {
  const { activeView, setActiveView, sidebarOpen, toggleSidebar, user } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'create-incident', label: 'Create Incident', icon: PlusCircle, path: '/create-incident' },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare, path: '/chat' },
    { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, path: '/knowledge-base' },
    { id: 'reports', label: 'Admin Reports', icon: BarChart3, path: '/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleItemClick = (item) => {
    setActiveView(item.id);
    // In a real app, you'd use react-router navigation
    window.history.pushState(null, '', item.path);
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sigmoid-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Signod Services</h1>
            <p className="text-xs text-gray-500">GenAI Client Portal</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sigmoid-blue to-sigmoid-light rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.full_name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.department} • {user.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`
                w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200
                ${isActive 
                  ? 'bg-sigmoid-blue text-white shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-800 font-medium">Enterprise Admin Dashboard</p>
          <p className="text-xs text-blue-600 mt-1">v1.4.0 • Production</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
