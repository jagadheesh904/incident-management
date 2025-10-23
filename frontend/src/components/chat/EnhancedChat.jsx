import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, ThumbsUp, ThumbsDown, Copy, Download, 
  Paperclip, Clock, Zap, Shield, Languages 
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { enhancedAPI } from '../../services/enhanced_api';

const EnhancedChat = () => {
  const { 
    chatSession, 
    chatMessages, 
    isChatLoading, 
    createChatSession, 
    sendChatMessage,
    addChatMessage,
    setChatLoading
  } = useApp();
  
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (!chatSession) {
      createChatSession();
    }
    checkAIHealth();
    loadSupportedLanguages();
  }, []);

  const checkAIHealth = async () => {
    try {
      const health = await enhancedAPI.checkAIHealth();
      setAiHealth(health);
    } catch (error) {
      console.error('Error checking AI health:', error);
    }
  };

  const loadSupportedLanguages = async () => {
    try {
      const response = await enhancedAPI.getSupportedLanguages();
      if (response.success) {
        setSupportedLanguages(response.languages);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    
    // Use enhanced API for better responses
    await sendEnhancedMessage(message);
  };

  const sendEnhancedMessage = async (message) => {
    if (!chatSession) return;

    try {
      setChatLoading(true);
      
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        session_id: chatSession.session_id,
        message_type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        message_metadata: {
          language: selectedLanguage,
          has_attachment: !!selectedFile
        }
      };
      addChatMessage(userMessage);

      // Upload file if selected
      let fileInfo = null;
      if (selectedFile) {
        try {
          fileInfo = await enhancedAPI.uploadFile(selectedFile);
          // Add file info to message metadata
          userMessage.message_metadata.file_info = fileInfo;
        } catch (error) {
          console.error('Error uploading file:', error);
        }
        setSelectedFile(null);
      }

      // Send to enhanced API
      const response = await enhancedAPI.sendEnhancedMessage(chatSession.session_id, message);
      if (response.success) {
        addChatMessage(response.bot_response);
      }
    } catch (error) {
      console.error('Error sending enhanced message:', error);
      
      // Fallback to regular API
      await sendChatMessage(message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setInputMessage(prev => prev + ` [Attached: ${file.name}]`);
    }
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className={line === '' ? 'mb-2' : ''}>
        {line}
      </p>
    ));
  };

  const quickActions = [
    'My Outlook is not opening on Windows 11',
    'I need to reset my Office 365 password',
    'VPN connection keeps failing with error code',
    'My laptop is running extremely slow',
    'I need access to the shared project folder',
    'Software installation request for Adobe Creative Cloud'
  ];

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'bg-green-100 text-green-800';
    if (confidence > 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const exportChat = () => {
    const chatData = {
      session_id: chatSession?.session_id,
      messages: chatMessages,
      exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${chatSession?.session_id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Enhanced Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Bot className="w-8 h-8 text-purple-500 mr-3" />
              SigmaAI Assistant
              {aiHealth && (
                <span className={`ml-3 text-sm font-normal px-2 py-1 rounded-full ${
                  aiHealth.status === 'operational' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {aiHealth.status === 'operational' ? 'AI Enhanced' : 'Basic Mode'}
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Powered by Google Gemini. Get intelligent, context-aware assistance for all your IT needs.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sigmoid-blue"
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.native_name}
                </option>
              ))}
            </select>
            
            <button
              onClick={exportChat}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to SigmaAI!</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                I'm your intelligent IT assistant. I can help you with technical issues, 
                create incidents, provide solutions, and answer your questions.
              </p>
              
              {/* AI Status */}
              {aiHealth && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-900">AI Status</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      aiHealth.status === 'operational' 
                        ? 'bg-green-100 text-green-800' 
                        : aiHealth.status === 'mock_mode'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {aiHealth.status === 'operational' ? 'Enhanced' : 
                       aiHealth.status === 'mock_mode' ? 'Basic' : 'Offline'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 chat-message ${
                  message.message_type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.message_type === 'user' 
                    ? 'bg-sigmoid-blue' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }`}>
                  {message.message_type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.message_type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[85%] p-4 rounded-2xl ${
                    message.message_type === 'user'
                      ? 'bg-sigmoid-blue text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}>
                    <div className="text-sm">
                      {formatMessage(message.content)}
                    </div>
                  </div>

                  {/* Enhanced Message Metadata */}
                  <div className={`flex items-center mt-2 text-xs text-gray-500 ${
                    message.message_type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    
                    {message.message_type === 'bot' && message.message_metadata && (
                      <div className="flex items-center space-x-3 ml-3">
                        {/* Confidence Score */}
                        {message.message_metadata.confidence && (
                          <span className={`px-2 py-1 rounded-full ${getConfidenceColor(message.message_metadata.confidence)}`}>
                            {Math.round(message.message_metadata.confidence * 100)}% confident
                          </span>
                        )}
                        
                        {/* Estimated Time */}
                        {message.message_metadata.estimated_resolution_time && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>~{message.message_metadata.estimated_resolution_time}m</span>
                          </span>
                        )}
                        
                        {/* Enhanced Features Badge */}
                        {message.message_metadata.enhanced_features && (
                          <span className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            <Zap className="w-3 h-3" />
                            <span>Enhanced</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggested Actions */}
                  {message.message_type === 'bot' && 
                   message.message_metadata?.suggested_actions &&
                   message.message_metadata.suggested_actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.message_metadata.suggested_actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action)}
                          className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback Buttons */}
                  {message.message_type === 'bot' && (
                    <div className="flex items-center space-x-3 mt-3">
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                        <span>Helpful</span>
                      </button>
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600 transition-colors">
                        <ThumbsDown className="w-3 h-3" />
                        <span>Not helpful</span>
                      </button>
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Enhanced Loading Indicator */}
          {isChatLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 text-gray-900 p-4 rounded-2xl rounded-bl-none max-w-md">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">SigmaAI is thinking...</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Analyzing context and preparing best response
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {chatMessages.length <= 2 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Start - Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors hover:border-sigmoid-blue hover:text-sigmoid-blue"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Input Area */}
        <div className="border-t border-gray-200 p-4">
          {/* File Attachment Preview */}
          {selectedFile && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700">{selectedFile.name}</span>
                <span className="text-xs text-blue-500">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                ×
              </button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            {/* File Upload */}
            <label className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
              />
              <Paperclip className="w-5 h-5 text-gray-500" />
            </label>
            
            {/* Message Input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your issue or ask a question..."
              className="flex-1 input-field"
              disabled={isChatLoading}
            />
            
            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isChatLoading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-20 justify-center"
            >
              {isChatLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Enhanced Chat Info Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Session: {chatSession?.session_id?.slice(0, 8)}...</span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Enterprise Secure</span>
          </span>
          <span>•</span>
          <span>AI Powered by Google Gemini Pro</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Languages className="w-3 h-3" />
            <span>{supportedLanguages.find(lang => lang.code === selectedLanguage)?.native_name}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChat;
