import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Mail, Phone, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [customerKey, setCustomerKey] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [isBusinessHours, setIsBusinessHours] = useState(true);
  const [showYesNoButtons, setShowYesNoButtons] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Restore customer key and session ID from localStorage on component mount
  useEffect(() => {
    const storedCustomerKey = localStorage.getItem('customer-key');
    const storedSessionId = localStorage.getItem('session-id');
    const storedContactInfo = localStorage.getItem('customer-contact-info');
    
    if (storedCustomerKey && storedSessionId) {
      setCustomerKey(storedCustomerKey);
      setSessionId(storedSessionId);
      setIsRegistered(true);
      console.log('Restored customer session:', { customerKey: storedCustomerKey, sessionId: storedSessionId });
      
      // Also restore contact information if available
      if (storedContactInfo) {
        const contactInfo = JSON.parse(storedContactInfo);
        setRegistrationData(prev => ({
          ...prev,
          customerName: contactInfo.firstName || '',
          customerEmail: contactInfo.email || '',
          customerPhone: contactInfo.phone || ''
        }));
        console.log('Restored contact info:', contactInfo);
      }
    }
  }, []);
  
  // Environment-based configuration
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://autos-direct-copy-dw3pes44v-amielclementes-projects.vercel.app' 
    : 'http://localhost:3000';

  const SOCKET_URL = process.env.NODE_ENV === 'production'
    ? 'https://autos-direct-copy-dw3pes44v-amielclementes-projects.vercel.app'
    : 'http://localhost:3000';

  const COMPLAINTS_URL = process.env.NODE_ENV === 'production'
    ? 'https://autos-direct-copy-dw3pes44v-amielclementes-projects.vercel.app/complaints'
    : 'http://localhost:5173/complaints';

  // Quick action buttons with predefined messages
  const quickActions = [
    {
      id: 'technical',
      label: 'Technical Assistance',
      message: 'I need technical assistance with my vehicle',
      icon: '🔧',
      color: 'bg-black hover:bg-gray-800'
    },
    {
      id: 'complaint',
      label: 'File a Complaint',
      message: 'I would like to file a complaint',
      icon: '📝',
      color: 'bg-black hover:bg-gray-800'
    },
    {
      id: 'vehicle',
      label: 'Vehicle Information',
      message: 'I need information about vehicles',
      icon: '🚗',
      color: 'bg-black hover:bg-gray-800'
    },
    {
      id: 'financing',
      label: 'Financing Options',
      message: 'I want to know about financing options',
      icon: '💰',
      color: 'bg-black hover:bg-gray-800'
    },
    {
      id: 'test-drive',
      label: 'Schedule Test Drive',
      message: 'I would like to schedule a test drive',
      icon: '🚙',
      color: 'bg-black hover:bg-gray-800'
    }
  ];

  // Check business hours on component mount
  useEffect(() => {
    checkBusinessHours();
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (isOpen && sessionId) {
      socketRef.current = io(SOCKET_URL);
      
      socketRef.current.on('connect', () => {
        console.log('Customer Socket.IO connected');
        toast.success('Connected to support team');
      });
      
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        toast.error('Connection failed. Please refresh the page.');
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        toast.error('Connection lost. Please refresh the page.');
      });
      
      socketRef.current.on('agent_reply', (data) => {
        console.log('Received agent reply:', data);
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'agent',
          message: data.message,
          timestamp: new Date().toISOString()
        }]);
        setIsTyping(false);
      });
      
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [isOpen, sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkBusinessHours = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/business-hours`);
      const data = await response.json();
      setIsBusinessHours(data.isBusinessHours);
    } catch (error) {
      console.error('Error checking business hours:', error);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      if (response.ok) {
        setSessionId(data.sessionId);
        setCustomerKey(data.customerKey);
        // Store customer key in localStorage for persistence across page navigation
        localStorage.setItem('customer-key', data.customerKey);
        localStorage.setItem('session-id', data.sessionId);
        // Store contact information for the customer inquiries page
        localStorage.setItem('customer-contact-info', JSON.stringify({
          firstName: registrationData.customerName,
          email: registrationData.customerEmail,
          phone: registrationData.customerPhone
        }));
        setIsRegistered(true);
        setShowRegistration(false);
        
        // Add welcome message
        setMessages([{
          id: Date.now(),
          sender: 'ai',
          message: `Hello ${registrationData.customerName || 'there'}! Welcome to Auto Direct. I'm here to help you with information about our vehicles, services, and more. How can I assist you today?`,
          timestamp: new Date().toISOString()
        }]);
        toast.success('Registration successful! Welcome to Auto Direct.');
      } else {
        toast.error('Registration failed: ' + data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    }
  };

  const generateCustomResponse = (messageText) => {
    const lowerMessage = messageText.toLowerCase();
    
    // Technical assistance
    if (lowerMessage.includes('technical assistance')) {
      if (isBusinessHours) {
        return "I'll connect you with our customer service team for technical assistance. Please hold on while I transfer you.";
      } else {
        return "Our technical support team is currently unavailable as we're outside business hours. Please visit our website during business hours (Monday-Friday, 9 AM-5 PM) or fill out our contact form if you need urgent assistance.";
      }
    }
    
    // Vehicle information
    if (lowerMessage.includes('vehicle information') || lowerMessage.includes('information about vehicles')) {
      setShowYesNoButtons(true);
      return "To get detailed information about our vehicles, please click on the car that interests you. You should see all the information there. Did that help?";
    }
    
    // Test drive
    if (lowerMessage.includes('test drive') || lowerMessage.includes('schedule test drive')) {
      setShowYesNoButtons(true);
      return "Great! To schedule a test drive, simply browse our vehicles and click on the car you're interested in. You'll find a 'Test Drive' button right there! It's that easy! Did that help?";
    }
    
    // File a complaint
    if (lowerMessage.includes('complaint') || lowerMessage.includes('file a complaint')) {
      return "To file a complaint, please visit our complaints page which can be found in the footer of our website. Here's the direct link: <a href='" + COMPLAINTS_URL + "' target='_blank' class='text-blue-600 underline hover:text-blue-800'>" + COMPLAINTS_URL + "</a>";
    }
    
    // Financing options
    if (lowerMessage.includes('financing') || lowerMessage.includes('financing options')) {
      return "We offer various financing options including: 1) Traditional auto loans, 2) Lease options, 3) Special financing programs, 4) Trade-in assistance. Please visit our website or contact our finance department during business hours for detailed information.";
    }
    
    // Handle yes/no responses
    if (lowerMessage.includes('yes') && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai' && lastMessage.message.includes('Did that help?')) {
        return "Great! I'm glad I could help. Is there anything else you need assistance with?";
      }
    }
    
    if (lowerMessage.includes('no') && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai' && lastMessage.message.includes('Did that help?')) {
        return "I understand. Let me connect you with our customer service team for more detailed assistance.";
      }
    }
    
    // Default response
    return "I understand you're looking for help with that. For more detailed assistance, I'll connect you with our customer service team who can provide personalized support. Please hold on while I transfer you.";
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      message: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Generate custom response first
    const customResponse = generateCustomResponse(messageText);
    
    // Add custom AI response immediately
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        message: customResponse,
        timestamp: new Date().toISOString()
      }]);
      setIsTyping(false);
    }, 1000);

    // Also send to backend for logging
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          customerKey,
          message: messageText,
          sender: 'user',
          customerEmail: registrationData.customerEmail,
          customerName: registrationData.customerName,
          customerPhone: registrationData.customerPhone
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Error sending message:', data.error);
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('Connection error. Please check your internet connection.');
    }
  };

  const handleQuickAction = (action) => {
    sendMessage(action.message);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    } else {
      toast.error('Please enter a message');
    }
  };

  const toggleChatbot = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      // Always show registration form to allow users to provide contact info
      setShowRegistration(true);
      toast.success('Welcome! You can provide your contact details (optional) or skip to start chatting.');
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  const closeChatbot = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setMessages([]);
    setIsRegistered(false);
    setSessionId(null);
    setCustomerKey(null);
    setShowRegistration(false);
    setShowYesNoButtons(false);
    toast.success('Chat session ended. Thank you for contacting us!');
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={toggleChatbot}
        className="fixed bottom-6 right-6 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-50 flex items-center gap-2"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden sm:block">Chat Support</span>
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-black text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Auto Direct Support</span>
              {!isBusinessHours && (
                <span className="text-xs bg-orange-500 px-2 py-1 rounded">After Hours</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-200"
              >
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button
                onClick={closeChatbot}
                className="text-white hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Registration Form */}
              {showRegistration && (
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900 mb-3">Get Started</h3>
                  <form onSubmit={handleRegistration} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name (Optional)"
                      value={registrationData.customerName}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={registrationData.customerEmail}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (optional)"
                      value={registrationData.customerPhone}
                      onChange={(e) => setRegistrationData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={async () => {
                          // Skip registration - register with empty contact info
                          try {
                            const response = await fetch(`${API_BASE_URL}/api/chatbot/register`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                customerName: '',
                                customerEmail: '',
                                customerPhone: ''
                              }),
                            });

                            const data = await response.json();

                            if (response.ok) {
                              setSessionId(data.sessionId);
                              setCustomerKey(data.customerKey);
                              // Store customer key in localStorage for persistence across page navigation
                              localStorage.setItem('customer-key', data.customerKey);
                              localStorage.setItem('session-id', data.sessionId);
                              // Store empty contact information
                              localStorage.setItem('customer-contact-info', JSON.stringify({
                                firstName: '',
                                email: '',
                                phone: ''
                              }));
                              setRegistrationData({
                                customerName: '',
                                customerEmail: '',
                                customerPhone: ''
                              });
                              setIsRegistered(true);
                              setShowRegistration(false);
                              
                              // Add welcome message
                              setMessages([{
                                id: Date.now(),
                                sender: 'ai',
                                message: `Hello there! Welcome to Auto Direct. I'm here to help you with information about our vehicles, services, and more. How can I assist you today?`,
                                timestamp: new Date().toISOString()
                              }]);
                              toast.success('Chat started! You can provide contact info later if needed.');
                            } else {
                              toast.error('Failed to start chat: ' + data.error);
                            }
                          } catch (error) {
                            console.error('Error skipping registration:', error);
                            toast.error('Failed to start chat. Please try again.');
                          }
                        }}
                        className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 text-sm"
                      >
                        Skip
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-black text-white py-2 rounded-md hover:bg-gray-800 text-sm"
                      >
                        Start Chat
                      </button>
                    </div>
                  </form>
                </div>
              )}


              {/* Yes/No Buttons */}
              {showYesNoButtons && (
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Did that help?</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowYesNoButtons(false);
                        sendMessage('Yes');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md flex-1"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => {
                        setShowYesNoButtons(false);
                        sendMessage('No');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md flex-1"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-black text-white'
                          : message.sender === 'agent'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p dangerouslySetInnerHTML={{ __html: message.message }}></p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm">
                      <div className="flex items-center gap-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="ml-2">Typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Buttons */}
              {isRegistered && (
                <div className="px-4 pt-3 pb-2 border-t bg-gray-50">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action)}
                        className={`${action.color} text-white text-xs p-2 rounded-md hover:shadow-md transition-all flex items-center gap-1`}
                      >
                        <span>{action.icon}</span>
                        <span className="truncate">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              {isRegistered && (
                <div className="px-4 pt-10 pb-6">
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-black text-white p-2 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Business Hours Notice */}
              {!isBusinessHours && (
                <div className="p-3 bg-orange-50 border-t border-orange-200">
                  <div className="flex items-center gap-2 text-orange-800 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>We're currently closed. Responses may be delayed until business hours.</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

export default Chatbot;