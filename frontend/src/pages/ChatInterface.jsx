import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Copy, Download } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const ChatInterface = () => {
  const { 
    chatSession, 
    chatMessages, 
    isChatLoading, 
    createChatSession, 
    sendChatMessage 
  } = useApp();
  
  const [inputMessage, setInputMessage] = useState('');
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
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendChatMessage(message);
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const quickActions = [
    'My Outlook is not opening',
    'I need to reset my password',
    'VPN connection is failing',
    'My computer is running slow',
    'I need access to a shared folder'
  ];

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className={line === '' ? 'mb-2' : ''}>
        {line}
      </p>
    ));
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Assistant</h1>
        <p className="text-gray-600">
          Get instant help with our intelligent AI assistant. Describe your issue and get solutions.
        </p>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Ask me anything about IT issues, incident reporting, or get help with troubleshooting.
              </p>
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
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.message_type === 'user' 
                    ? 'bg-sigmoid-blue' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }`}>
                  {message.message_type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${message.message_type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${
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
                      <div className="flex items-center space-x-2 ml-3">
                        {message.message_metadata.confidence && (
                          <span className={`px-2 py-1 rounded-full ${
                            message.message_metadata.confidence > 0.8 
                              ? 'bg-green-100 text-green-800'
                              : message.message_metadata.confidence > 0.6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(message.message_metadata.confidence * 100)}% confident
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
                    <div className="flex items-center space-x-2 mt-3">
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-green-600">
                        <ThumbsUp className="w-3 h-3" />
                        <span>Helpful</span>
                      </button>
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600">
                        <ThumbsDown className="w-3 h-3" />
                        <span>Not helpful</span>
                      </button>
                      <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600">
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isChatLoading && (
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 text-gray-900 p-4 rounded-2xl rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {chatMessages.length <= 2 && (
          <div className="border-t border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Describe your issue or ask a question..."
              className="flex-1 input-field"
              disabled={isChatLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isChatLoading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Chat Info Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Session: {chatSession?.session_id?.slice(0, 8)}...</span>
          <span>•</span>
          <span>AI Powered by Google Gemini</span>
        </div>
        <button className="flex items-center space-x-1 hover:text-gray-700">
          <Download className="w-4 h-4" />
          <span>Export Chat</span>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
