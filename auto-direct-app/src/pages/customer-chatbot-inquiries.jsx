import React, { useEffect, useState, useRef } from "react";
import { MessageCircle, User, Mail, Phone, Clock, Eye, Send } from "lucide-react";
import { io } from 'socket.io-client';
import { useUser } from "../contexts/UserContext";

function CustomerChatbotInquiries() {
  const { user } = useUser();
  
  // Environment-based configuration
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://autos-direct-copy.vercel.app' 
    : 'http://localhost:3000';

  const SOCKET_URL = process.env.NODE_ENV === 'production'
    ? 'https://autos-direct-copy.vercel.app'
    : 'http://localhost:3000';

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const socketRef = useRef(null);
  const [customerKey, setCustomerKey] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    email: "",
    phone: ""
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      console.log('Customer Socket.IO connected with ID:', socketRef.current.id);
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Customer Socket.IO disconnected');
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Customer Socket.IO connection error:', error);
    });
    
      return () => {
        if (socketRef.current) {
          // Only leave the room when component unmounts (user navigates away)
          if (isInRoom && sessionId) {
            socketRef.current.emit('leave', sessionId);
            console.log('Left session room on component unmount:', sessionId);
          }
          socketRef.current.disconnect();
        }
      };
  }, [isInRoom, sessionId]);

  // Listen for new messages
  useEffect(() => {
    if (socketRef.current) {
      // Listen for agent replies
      socketRef.current.on('agent_reply', (data) => {
        console.log('Customer received agent reply:', data);
        console.log('Current inquiry ID:', selectedInquiry?.id);
        console.log('Reply inquiry ID:', data.inquiryId);
        
        // Refresh messages if viewing the same inquiry
        if (showMessages && selectedInquiry && data.inquiryId === selectedInquiry.id) {
          console.log('Refreshing messages for current inquiry');
          fetchMessages(selectedInquiry.id);
        }
        // Always refresh inquiries list to update status and message counts
        console.log('Refreshing inquiries list');
        fetchInquiries();
      });
      
      // Listen for customer messages (to update the list when customer sends a message)
      socketRef.current.on('customer_message', (data) => {
        console.log('Customer received customer message update:', data);
        fetchInquiries();
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.off('agent_reply');
        socketRef.current.off('customer_message');
      }
    };
  }, [showMessages, selectedInquiry]);

  // Get customer key and session ID from localStorage
  useEffect(() => {
    // Get the customer key and session ID from localStorage (set by chatbot component)
    const storedCustomerKey = localStorage.getItem('customer-key');
    const storedSessionId = localStorage.getItem('session-id');
    const storedContactInfo = localStorage.getItem('customer-contact-info');
    
    if (storedCustomerKey) {
      setCustomerKey(storedCustomerKey);
      console.log('Customer inquiries using customer key:', storedCustomerKey);
    } else {
      // Generate a key if none exists (for testing purposes)
      const key = 'customer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('customer-key', key);
      setCustomerKey(key);
      console.log('Generated new customer key:', key);
    }
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
      console.log('Customer inquiries using session ID:', storedSessionId);
    }
    
    // Check if contact info is available
    if (storedContactInfo) {
      setContactInfo(JSON.parse(storedContactInfo));
      console.log('Loaded contact info:', JSON.parse(storedContactInfo));
    } else {
      // Show contact form if no contact info is stored
      setShowContactForm(true);
    }
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    
    // All fields are now optional - no validation required
    // Store contact info in localStorage (even if empty)
    localStorage.setItem('customer-contact-info', JSON.stringify(contactInfo));
    setShowContactForm(false);
    setError('');
    
    // Now fetch inquiries
    if (customerKey) {
      fetchInquiries();
    }
  };

  const fetchInquiries = async () => {
    if (!customerKey) return;
    
    setLoading(true);
    setError("");
    try {
      console.log('Fetching inquiries with customer key:', customerKey);
      const res = await fetch(`${API_BASE_URL}/api/chatbot/my-inquiries?customerKey=${customerKey}`);
      const data = await res.json();
      console.log('Inquiries response:', data);
      if (!res.ok) throw new Error(data?.error || "Failed to fetch inquiries");
      setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : []);
    } catch (e) {
      console.error('Error fetching inquiries:', e);
      setError(e.message || "Network error");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerKey && !showContactForm) {
      fetchInquiries();
    }
  }, [customerKey, showContactForm]);

  const fetchMessages = async (inquiryId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/messages/${inquiryId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch messages");
      setMessages(data.messages || []);
    } catch (e) {
      console.error("Error fetching messages:", e);
      setMessages([]);
    }
  };

  const viewMessages = async (inquiry) => {
    // No longer require contact info - allow access to conversations
    setSelectedInquiry(inquiry);
    await fetchMessages(inquiry.id);
    setShowMessages(true);
    
    // Join the session room for real-time updates using the stored session ID
    // Only join if not already in the room to avoid duplicate joins
    if (socketRef.current && !isInRoom) {
      if (sessionId) {
        socketRef.current.emit('join', sessionId);
        console.log('Joined session room:', sessionId);
        setIsInRoom(true);
      } else if (inquiry.session_id) {
        // Fallback to inquiry's session ID if stored session ID is not available
        socketRef.current.emit('join', inquiry.session_id);
        console.log('Joined session room (fallback):', inquiry.session_id);
        setIsInRoom(true);
      }
    } else if (isInRoom) {
      console.log('Already in session room, skipping join');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedInquiry || isSending) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId || selectedInquiry.session_id,
          customerKey: customerKey,
          message: newMessage.trim(),
          sender: 'user',
          customerEmail: contactInfo.email,
          customerName: contactInfo.firstName,
          customerPhone: contactInfo.phone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send message");
      
      setNewMessage("");
      // Refresh messages
      await fetchMessages(selectedInquiry.id);
      // Refresh inquiries list
      await fetchInquiries();
    } catch (e) {
      console.error("Error sending message:", e);
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const formatDateTime = (s) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-black rounded-lg p-3">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Support Inquiries</h1>
                <p className="text-gray-600 mt-1">View and manage your chatbot conversations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Contact Information Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information (Optional)</h3>
                <p className="text-sm text-gray-600 mt-1">You can provide your contact details for better support, or skip to continue</p>
              </div>
              
              <form onSubmit={handleContactSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={contactInfo.firstName}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      // Skip contact form - store empty contact info
                      localStorage.setItem('customer-contact-info', JSON.stringify({
                        firstName: '',
                        email: '',
                        phone: ''
                      }));
                      setShowContactForm(false);
                      setError('');
                      if (customerKey) {
                        fetchInquiries();
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries yet</h3>
              <p className="text-gray-600">Start a conversation with our chatbot to see your inquiries here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Initial Message</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Messages</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Activity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {inquiry.customer_message || 'No initial message'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {inquiry.customer_email && (
                            <div className="mb-1">
                              <span className="font-medium">Email:</span> {inquiry.customer_email}
                            </div>
                          )}
                          {inquiry.customer_phone && (
                            <div>
                              <span className="font-medium">Phone:</span> {inquiry.customer_phone}
                            </div>
                          )}
                          {!inquiry.customer_email && !inquiry.customer_phone && (
                            <span className="text-gray-400 italic">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {inquiry.message_count || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {inquiry.last_message_time ? formatDateTime(inquiry.last_message_time) : formatDateTime(inquiry.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewMessages(inquiry)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Conversation
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Messages Modal */}
        {showMessages && selectedInquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Conversation</h3>
                  <p className="text-sm text-gray-600">Status: <span className={`font-medium ${getStatusColor(selectedInquiry.status).replace('bg-', 'text-').replace('-100', '-800')}`}>{selectedInquiry.status}</span></p>
                  
                  {/* Customer Contact Information */}
                  <div className="mt-2 text-sm text-gray-600">
                    {selectedInquiry.customer_email && (
                      <div className="flex items-center mb-1">
                        <span className="font-medium mr-2">Email:</span>
                        <span>{selectedInquiry.customer_email}</span>
                      </div>
                    )}
                    {selectedInquiry.customer_phone && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Phone:</span>
                        <span>{selectedInquiry.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Don't leave the session room to maintain real-time connection
                    // The connection will stay active for receiving updates
                    console.log('Closing conversation modal - keeping Socket.IO connection active');
                    setShowMessages(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.sender === 'agent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDateTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Message Input */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    disabled={isSending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerChatbotInquiries;
