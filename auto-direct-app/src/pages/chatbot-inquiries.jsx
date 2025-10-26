import React, { useEffect, useState, useRef } from "react";
import { MessageCircle, User, Mail, Phone, Clock, Eye, Trash2, XCircle } from "lucide-react";
import { io } from 'socket.io-client';
import { useUser } from "../contexts/UserContext";

function ChatbotInquiries() {
  const { user } = useUser();
  
  // Environment-based configuration
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://autos-direct-copy.vercel.app/api' 
    : 'http://localhost:3000';

  const SOCKET_URL = process.env.NODE_ENV === 'production'
    ? 'https://autos-direct-copy.vercel.app/api'
    : 'http://localhost:3000';
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [replyMap, setReplyMap] = useState({});
  const [agent, setAgent] = useState(() => {
    // Use logged-in user's name if available, otherwise fallback to localStorage
    const storedAgent = localStorage.getItem('agent-id');
    return storedAgent || (user?.firstName ? user.firstName : 'Agent-1');
  });
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const socketRef = useRef(null);
  const [availableAgents, setAvailableAgents] = useState([]);

  // Update agent name when user context loads
  useEffect(() => {
    if (user?.firstName) {
      const agentName = user.firstName;
      setAgent(agentName);
      localStorage.setItem('agent-id', agentName);
    }
  }, [user]);

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      console.log('Admin Socket.IO connected');
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Admin Socket.IO disconnected');
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Listen for new messages and inquiries updates
  useEffect(() => {
    if (socketRef.current) {
      // Listen for new messages in any inquiry
      socketRef.current.on('agent_reply', (data) => {
        console.log('Admin received agent reply:', data);
        // Refresh inquiries list to update message counts
        fetchInquiries();
        // If the message modal is open, refresh messages
        if (showMessages && selectedInquiry) {
          fetchMessages(selectedInquiry.id);
        }
      });

      // Listen for new customer messages
      socketRef.current.on('customer_message', (data) => {
        console.log('Admin received customer message:', data);
        // Refresh inquiries list
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

  const fetchInquiries = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/inquiries`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch inquiries");
      setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : []);
    } catch (e) {
      setError(e.message || "Network error");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    fetchAvailableAgents();
  }, []);

  const fetchAvailableAgents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      const data = await res.json();
      if (res.ok && data.users) {
        // Filter for administrators and format agent names
        const agents = data.users
          .filter(u => u.roles && u.roles.includes('Administrator'))
          .map(u => u.firstName);
        setAvailableAgents(agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const filtered = inquiries.filter((q) => {
    const matchesSearch = (q.customer_message || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || q.status === statusFilter;
    const matchesAssigned = assignedFilter === 'All' || (assignedFilter === 'Unassigned' ? (!q.assigned_to || q.assigned_to === '') : q.assigned_to === agent);
    return matchesSearch && matchesStatus && matchesAssigned;
  });

  const formatDateTime = (s) => {
    try {
      return new Date(s).toLocaleString();
    } catch {
      return s;
    }
  };

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
    setSelectedInquiry(inquiry);
    await fetchMessages(inquiry.id);
    setShowMessages(true);
  };

  const sendReply = async (inq) => {
    const text = replyMap[inq.id]?.trim();
    if (!text) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inq.id, sessionId: inq.session_id, replyText: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send reply');
      setReplyMap(prev => ({ ...prev, [inq.id]: '' }));
      
      // Refresh messages if modal is open
      if (showMessages && selectedInquiry && selectedInquiry.id === inq.id) {
        await fetchMessages(inq.id);
      }
      
      // Refresh inquiries list to update message counts
      await fetchInquiries();
    } catch (e) {
      alert(e.message || 'Network error');
    }
  };

  const claimInquiry = async (inq) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inq.id, agent })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to assign');
      // refresh list
      await fetchInquiries();
    } catch (e) {
      alert(e.message || 'Network error');
    }
  };

  const unassignInquiry = async (inq) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/unassign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inq.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to unassign');
      await fetchInquiries();
    } catch (e) {
      alert(e.message || 'Network error');
    }
  };


  const deleteMessage = async (messageId) => {
    console.log('Delete message called with ID:', messageId);
    
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      console.log('Sending DELETE request to:', `${API_BASE_URL}/api/chatbot/messages/${messageId}`);
      
      const res = await fetch(`${API_BASE_URL}/api/chatbot/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      
      if (!res.ok) throw new Error(data?.error || 'Failed to delete message');
      
      console.log('Message deleted successfully, refreshing...');
      
      // Refresh messages if modal is open
      if (showMessages && selectedInquiry) {
        await fetchMessages(selectedInquiry.id);
      }
      
      // Refresh inquiries list to update message counts
      await fetchInquiries();
      
      console.log('Refresh completed');
    } catch (e) {
      console.error('Delete error:', e);
      alert(e.message || 'Network error');
    }
  };

  const deleteAllMessages = async () => {
    if (!selectedInquiry || !messages.length) return;
    
    if (!window.confirm(`Are you sure you want to delete all ${messages.length} messages in this conversation? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete all messages for this inquiry
      const deletePromises = messages.map(message => 
        fetch(`${API_BASE_URL}/api/chatbot/messages/${message.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      await Promise.all(deletePromises);
      
      // Refresh messages and inquiries
      await fetchMessages(selectedInquiry.id);
      await fetchInquiries();
    } catch (e) {
      alert(e.message || 'Network error');
    }
  };

  const endSession = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to end this session? This will send a closing message to the customer and mark the conversation as closed.')) {
      return;
    }

    try {
      // First, send a closing message to the customer
      const closingMessage = "Thank you for contacting us. This conversation has been closed. If you have any further questions, please start a new conversation. Have a great day!";
      
      const messageRes = await fetch(`${API_BASE_URL}/api/chatbot/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: inquiryId, 
          sessionId: inquiries.find(inq => inq.id === inquiryId)?.session_id, 
          replyText: closingMessage 
        })
      });
      
      if (!messageRes.ok) {
        const messageData = await messageRes.json();
        throw new Error(messageData?.error || 'Failed to send closing message');
      }

      // Then update the status to closed
      const statusRes = await fetch(`${API_BASE_URL}/api/chatbot/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inquiryId, status: 'closed' })
      });
      const statusData = await statusRes.json();
      if (!statusRes.ok) throw new Error(statusData?.error || 'Failed to end session');
      
      // Refresh inquiries list and messages if modal is open
      await fetchInquiries();
      if (showMessages && selectedInquiry && selectedInquiry.id === inquiryId) {
        await fetchMessages(inquiryId);
      }
    } catch (e) {
      alert(e.message || 'Network error');
    }
  };

  const deleteInquiry = async (inquiryId) => {
    if (!window.confirm('Are you sure you want to delete this entire conversation? This will permanently delete the inquiry and all its messages. This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/chatbot/inquiries/${inquiryId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to delete inquiry');
      
      // Close modal if it's open for this inquiry
      if (showMessages && selectedInquiry && selectedInquiry.id === inquiryId) {
        setShowMessages(false);
      }
      
      // Refresh inquiries list
      await fetchInquiries();
    } catch (e) {
      alert(e.message || 'Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="bg-black rounded-lg p-3">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black">Customer Support Dashboard</h1>
                  <p className="text-gray-600 mt-1">Manage chatbot inquiries and customer conversations</p>
                  {availableAgents.length > 0 && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Active Agents:</span>
                      <div className="flex space-x-1">
                        {availableAgents.map((agentName, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-black">
                            {agentName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Controls Section */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-64 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <select
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white shadow-sm min-w-[120px]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  <option value="pending">Pending</option>
                  <option value="ai_handled">AI Handled</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                </select>
                
                <select
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white shadow-sm min-w-[120px]"
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                >
                  <option value="All">All Agents</option>
                  <option value="Unassigned">Unassigned</option>
                  <option value="Mine">My Tickets</option>
                </select>
                
                <div className="flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{agent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-gray-300 bg-gray-50 text-black flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Messages</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        <span className="text-gray-500 font-medium">Loading conversations...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <MessageCircle className="h-12 w-12 text-gray-300" />
                        <span className="text-gray-500 font-medium">No conversations found</span>
                        <span className="text-gray-400 text-sm">Try adjusting your filters or search terms</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors duration-150 align-top">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {q.customer_email ? q.customer_email.split('@')[0] : 'Anonymous'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                              {q.customer_email && (
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {q.customer_email}
                                </span>
                              )}
                              {q.customer_phone && (
                                <span className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {q.customer_phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
                          q.status === 'pending' ? 'bg-gray-200 text-black border border-gray-300' :
                          q.status === 'ai_handled' ? 'bg-gray-300 text-black border border-gray-400' :
                          q.status === 'responded' ? 'bg-gray-300 text-black border border-gray-400' :
                          q.status === 'closed' ? 'bg-gray-400 text-white border border-gray-500' : 'bg-gray-200 text-black border border-gray-300'
                        }`}>
                          {q.status === 'closed' ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              Closed
                            </>
                          ) : (
                            q.status.charAt(0).toUpperCase() + q.status.slice(1).replace('_', ' ')
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4 text-gray-400" />
                          <span>{q.message_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{formatDateTime(q.last_message_time || q.updated_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{q.assigned_to || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => viewMessages(q)} 
                              className="px-3 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 flex items-center space-x-1 text-xs font-medium shadow-sm transition-colors"
                            >
                              <Eye className="h-3 w-3" />
                              <span>View</span>
                            </button>
                            {(!q.assigned_to || q.assigned_to === '') ? (
                              <button onClick={() => claimInquiry(q)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-xs font-medium shadow-sm transition-colors">Claim</button>
                            ) : q.assigned_to === agent ? (
                              <button onClick={() => unassignInquiry(q)} className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium shadow-sm transition-colors">Unassign</button>
                            ) : (
                              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                                {q.assigned_to}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {q.status !== 'closed' && (
                              <button 
                                onClick={() => endSession(q.id)} 
                                className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 flex items-center space-x-1 text-xs font-medium shadow-sm transition-colors"
                                title="End session and mark as closed"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>End</span>
                              </button>
                            )}
                            <button 
                              onClick={() => deleteInquiry(q.id)} 
                              className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-1 text-xs font-medium shadow-sm transition-colors"
                              title="Delete entire conversation"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Messages Modal */}
        {showMessages && selectedInquiry && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-40 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{backdropFilter: 'blur(8px)'}}>
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="bg-black rounded-lg p-2">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Conversation Details</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{selectedInquiry.customer_email || 'Anonymous'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{messages.length} messages</span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedInquiry.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          selectedInquiry.status === 'ai_handled' ? 'bg-indigo-100 text-indigo-800' :
                          selectedInquiry.status === 'responded' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedInquiry.status.charAt(0).toUpperCase() + selectedInquiry.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedInquiry.status !== 'closed' && (
                      <button
                        onClick={() => endSession(selectedInquiry.id)}
                        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1"
                        title="End session and mark as closed"
                      >
                        <XCircle className="h-3 w-3" />
                        End Session
                      </button>
                    )}
                    {messages.length > 0 && (
                      <button
                        onClick={deleteAllMessages}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                        title="Delete all messages"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete All
                      </button>
                    )}
                    <button
                      onClick={() => setShowMessages(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-black text-white'
                              : message.sender === 'agent'
                              ? 'bg-gray-300 text-black'
                              : 'bg-gray-200 text-black'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for message:', message.id);
                            deleteMessage(message.id);
                          }}
                          className="opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-red-300"
                          title="Delete message"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-6 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="Type a reply..."
                    value={replyMap[selectedInquiry.id] || ''}
                    onChange={(e) => setReplyMap(prev => ({ ...prev, [selectedInquiry.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => sendReply(selectedInquiry)}
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    Send Reply
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

export default ChatbotInquiries;


