import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, Users, CheckCheck, Eye, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvParam = searchParams.get('conversationId');

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeConvDetail, setActiveConvDetail] = useState(null);
  const [inputText, setInputText] = useState('');
  const [workers, setWorkers] = useState([]);
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  async function loadConversations() {
    try {
      const res = await api.get('/messages/conversations');
      const convs = res.conversations || [];
      setConversations(convs);

      if (!activeConvId) {
        if (activeConvParam) {
          setActiveConvId(activeConvParam);
        } else if (convs.length > 0) {
          setActiveConvId(convs[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId) {
    if (!convId) return;
    try {
      const res = await api.get(`/messages/conversations/${convId}/messages`);
      setMessages(res.messages || []);
      setActiveConvDetail(res.conversation || null);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadConversations();
    api.get('/users').then(res => setWorkers(res.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeConvParam && activeConvParam !== activeConvId) {
      setActiveConvId(activeConvParam);
    }
  }, [activeConvParam]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const interval = setInterval(() => loadMessages(activeConvId), 4000); // Poll every 4s
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const textToSend = inputText.trim();
    setInputText('');

    // Optimistic UI update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      text: textToSend,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id, fullName: user?.fullName || 'Me' },
      attachments: [],
      seenByCount: 1,
      seenByTotal: 1,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      try {
        await api.post(`/messages/conversations/${activeConvId}/messages`, { text: textToSend });
      } catch (firstErr) {
        // Fallback to /messages/send
        await api.post('/messages/send', { conversationId: activeConvId, text: textToSend });
      }
      loadMessages(activeConvId);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + (err.message || 'Please check your connection and try again.'));
      loadMessages(activeConvId);
    }
  };

  const handleStartDirectChat = async (targetUserId) => {
    try {
      const conv = await api.post('/messages/conversations/direct', { targetUserId });
      setShowDirectModal(false);
      await loadConversations();
      setActiveConvId(conv.id);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading chat platform...</div>;

  return (
    <div className="bg-white border border-brand-border rounded-3xl overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-3 h-[80vh]">
      {/* Left: Conversations Sidebar */}
      <div className="border-r border-brand-border flex flex-col bg-brand-soft">
        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-white">
          <div>
            <h2 className="font-extrabold text-base text-brand-dark">Internal Chat</h2>
            <span className="text-[10px] text-gray-400 font-bold">1-to-1, Group & Announcement Threads</span>
          </div>
          <button
            onClick={() => setShowDirectModal(true)}
            className="p-2 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark rounded-xl font-bold transition"
            title="New Private Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 no-scrollbar">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => { setActiveConvId(conv.id); setSearchParams({ conversationId: conv.id }); }}
              className={`w-full p-4 text-left flex items-start justify-between gap-2 transition ${activeConvId === conv.id ? 'bg-white border-l-4 border-brand-red shadow-sm' : 'hover:bg-gray-100'}`}
            >
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${conv.type === 'ANNOUNCEMENT' ? 'bg-brand-red text-white' : 'bg-brand-yellow text-brand-dark'}`}>
                    {conv.type}
                  </span>
                  <b className="text-xs font-bold text-brand-dark truncate block">{conv.title}</b>
                </div>
                <p className="text-[11px] text-gray-500 truncate mt-1">
                  {conv.lastMessage ? `${conv.lastMessage.sender?.fullName}: ${conv.lastMessage.text}` : 'No messages yet'}
                </p>
              </div>

              {conv.hasUnread && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-red flex-shrink-0 animate-pulse mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Messages Thread & Input */}
      <div className="md:col-span-2 flex flex-col h-full bg-white">
        {activeConvId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-brand-border bg-white flex justify-between items-center">
              <div>
                <b className="text-base font-extrabold text-brand-dark block">{activeConvDetail?.title || 'Chat Thread'}</b>
                <span className="text-[11px] text-gray-400 font-semibold">
                  {activeConvDetail?.members?.length || 0} Members in Conversation
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 no-scrollbar">
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="text-[10px] text-gray-400 font-bold mb-0.5">
                      {msg.sender?.fullName}
                    </div>
                    <div className={`max-w-md p-3.5 rounded-2xl text-xs shadow-sm ${isMe ? 'bg-brand-dark text-white rounded-br-none' : 'bg-white border border-brand-border text-brand-dark rounded-bl-none'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className="text-[9px] opacity-60 text-right mt-1 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* READ / SEEN TRACKING DISCLOSURE */}
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>{msg.seenSummary} Seen ({msg.seenUsers.map(u => u.name).join(', ') || 'Delivered'})</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-brand-border bg-white flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
              <button
                type="submit"
                className="bg-brand-red hover:bg-brand-redDark text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs font-bold text-gray-400">
            Select a conversation thread to start messaging
          </div>
        )}
      </div>

      {/* Direct Chat Modal */}
      {showDirectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-pop">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-brand-dark">Start Private Chat</h3>
              <button onClick={() => setShowDirectModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            <div className="space-y-2 text-xs max-h-60 overflow-y-auto no-scrollbar">
              {workers.filter(w => w.id !== user?.id).map(w => (
                <button
                  key={w.id}
                  onClick={() => handleStartDirectChat(w.id)}
                  className="w-full p-3 text-left bg-brand-soft hover:bg-brand-yellow rounded-xl font-bold flex justify-between items-center transition"
                >
                  <span>{w.fullName}</span>
                  <span className="text-[10px] text-gray-500">{w.role?.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
