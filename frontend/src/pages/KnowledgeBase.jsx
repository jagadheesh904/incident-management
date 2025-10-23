import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Filter, Download, Share2 } from 'lucide-react';
import { kbAPI } from '../services/api';

const KnowledgeBase = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  useEffect(() => {
    filterEntries();
  }, [searchTerm, selectedCategory, entries]);

  const fetchKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      const response = await kbAPI.getKnowledgeBase();
      if (response.success) {
        setEntries(response.entries);
      }
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.use_case.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.solution_steps.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    setFilteredEntries(filtered);
  };

  const categories = ['All', ...new Set(entries.map(entry => entry.category))];

  const getPriorityColor = (successRate) => {
    if (successRate >= 0.9) return 'bg-green-100 text-green-800';
    if (successRate >= 0.7) return 'bg-blue-100 text-blue-800';
    if (successRate >= 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading knowledge base...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
        <p className="text-gray-600">
          Browse our collection of solutions and troubleshooting guides for common issues.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
        </p>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Knowledge Base Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntries.map((entry) => (
          <div key={entry.kb_id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-sigmoid-blue" />
                <span className="text-xs font-medium text-sigmoid-blue bg-blue-50 px-2 py-1 rounded">
                  {entry.category}
                </span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(entry.success_rate)}`}>
                {(entry.success_rate * 100).toFixed(0)}% Success
              </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {entry.use_case}
            </h3>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {entry.solution_steps.split('\n')[0]}
            </p>

            <div className="space-y-3">
              {/* Required Information */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Required Info
                </h4>
                <div className="flex flex-wrap gap-1">
                  {entry.required_info?.slice(0, 3).map((info, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {info.field.replace('_', ' ')}
                    </span>
                  ))}
                  {entry.required_info?.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      +{entry.required_info.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Est. {entry.resolution_time_estimate} min
                </div>
                <div className="flex space-x-2">
                  <button className="text-xs text-sigmoid-blue hover:text-sigmoid-dark font-medium">
                    View Details
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
