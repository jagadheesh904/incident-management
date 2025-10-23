import React, { useState } from 'react';
import { PlusCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const CreateIncident = () => {
  const { createIncident } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    additional_info: {}
  });

  const categories = [
    'Email', 'Network', 'Hardware', 'Software', 'Security', 
    'File Services', 'Printing', 'Mobile', 'Other'
  ];

  const priorities = [
    { value: 'Low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'Medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createIncident(formData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        additional_info: {}
      });
    } catch (error) {
      console.error('Error creating incident:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Incident</h1>
        <p className="text-gray-600">
          Report a new issue or request assistance. Our AI will help categorize and prioritize your incident.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Details</h2>
              
              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Brief description of the issue..."
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Please provide as much detail as possible about the issue..."
                  rows={4}
                  className="input-field resize-vertical"
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="input-field"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <p className="text-gray-600 text-sm mb-4">
                Provide any additional details that might help us resolve your issue faster.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Operating System
                  </label>
                  <select className="input-field">
                    <option value="">Select OS</option>
                    <option value="Windows 10">Windows 10</option>
                    <option value="Windows 11">Windows 11</option>
                    <option value="macOS">macOS</option>
                    <option value="Linux">Linux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Code (if any)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 0x800, 404, etc."
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Creating Incident...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>Create Incident</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar - Help & Guidance */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-500 mr-2" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Be specific about the issue and error messages</li>
              <li>• Include steps to reproduce the problem</li>
              <li>• Mention when the issue started</li>
              <li>• Include relevant system information</li>
            </ul>
          </div>

          {/* Priority Guide */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Priority Guide</h3>
            <div className="space-y-3">
              {priorities.map(priority => (
                <div key={priority.value} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{priority.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                    {priority.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Assistance */}
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              AI-Powered Help
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Our AI will analyze your incident and suggest the best solution approach.
            </p>
            <button
              onClick={() => window.location.href = '/chat'}
              className="w-full bg-white text-sigmoid-blue border border-sigmoid-blue py-2 px-4 rounded-lg text-sm font-medium hover:bg-sigmoid-blue hover:text-white transition-colors"
            >
              Get AI Assistance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIncident;
