import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Clock, Zap } from 'lucide-react';
import { fixedAPI } from '../../services/api_fixed';

const SimpleChat = () => {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiHealth, setAiHealth] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    initializeChat();
    checkAIHealth();
  }, []);

  const initializeChat = async () => {
    try {
      const response = await fixedAPI.createSession();
      if (response.success) {
        setSession(response.session);
        setMessages([response.welcome_message]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Fallback: create a mock session
      const mockSession = {
        session_id: 'mock-' + Date.now(),
        user_id: 1,
        status: 'active'
      };
      setSession(mockSession);
      setMessages([{
        id: 1,
        session_id: mockSession.session_id,
        message_type: 'bot',
        content: 'Hello! I\'m SigmaAI. I\'m here to help with IT issues. What can I assist you with today?',
        timestamp: new Date().toISOString(),
        message_metadata: {
          type: 'welcome',
          confidence: 1.0
        }
      }]);
    }
  };

  const checkAIHealth = async () => {
    try {
      const health = await fixedAPI.checkAIHealth();
      setAiHealth(health);
    } catch (error) {
      console.error('Error checking AI health:', error);
      setAiHealth({ status: 'mock_mode', success: true });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !session || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        session_id: session.session_id,
        message_type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await fixedAPI.sendMessage(session.session_id, message);
      
      if (response.success) {
        setMessages(prev => [...prev, response.bot_response]);
        setSession(response.session_updated);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback: show mock response
      const mockResponse = {
        id: Date.now() + 1,
        session_id: session.session_id,
        message_type: 'bot',
        content: getMockResponse(message),
        timestamp: new Date().toISOString(),
        message_metadata: {
          type: 'information',
          confidence: 0.8,
          estimated_resolution_time: 15
        }
      };
      setMessages(prev => [...prev, mockResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('outlook') || message.includes('email')) {
      return "I can help with Outlook issues! Common solutions include:\n\n1. Check your internet connection\n2. Restart Outlook in safe mode\n3. Clear the Outlook cache\n\nCould you tell me what specific error you're seeing?";
    } else if (message.includes('vpn')) {
      return "For VPN connection issues, try these steps:\n\n1. Verify your network connection\n2. Restart the VPN client\n3. Check if you're using the correct server address\n\nAre you connecting from office or home network?";
    } else if (message.includes('password')) {
      return "I can help with password resets! For security, I'll need to verify your identity first.\n\nPlease provide your employee ID and which system requires the reset (Windows, Email, VPN, etc.)";
    } else if (message.includes('slow') || message.includes('performance')) {
      return "For performance issues, here are some quick fixes:\n\n1. Close unused applications\n2. Restart your computer\n3. Check for system updates\n\nWhich applications are running slow?";
    } else {
      return "Thank you for your message! I understand you're experiencing an issue. To help you better, could you provide more details about:\n\n• What exactly is happening?\n• When did it start?\n• Any error messages you're seeing?\n\nI'm here to help resolve this quickly!";
    }
  };

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className={line === '' ? 'mb-2' : ''}>
        {line}
      </p>
    ));
  };

  const quickActions = [
    'Outlook not opening',
    'VPN connection failed',
    'Reset my password',
    'Computer running slow',
    'Need software installed'
  ];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
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
              Get instant help with IT issues and incident reporting.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.message_type === 'user' ? 'flex-row-reverse' : ''}`}
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

                {/* Message Metadata */}
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
                      {message.message_metadata.confidence && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {Math.round(message.message_metadata.confidence * 100)}% confident
                        </span>
                      )}
                      {message.message_metadata.estimated_resolution_time && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>~{message.message_metadata.estimated_resolution_time}m</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
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
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Start - Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(action)}
                  className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors hover:border-sigmoid-blue hover:text-sigmoid-blue"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your issue or ask a question..."
              className="flex-1 input-field"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || !session}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-20 justify-center"
            >
              {isLoading ? (
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

      {/* Chat Info Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Session: {session?.session_id?.slice(0, 8)}...</span>
          <span>•</span>
          <span>AI Powered by Google Gemini</span>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Real-time Support</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleChat;
