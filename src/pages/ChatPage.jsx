import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MessageSquare, Send, Users, CheckCheck, Eye, Plus, 
  ArrowLeft, UserPlus, Search, Calendar, ChevronDown, Check
} from 'lucide-react';
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
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [groupTitle, setGroupTitle] = useState('');

  // Auto-scroll management (prevents jumping when user scrolls up)
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const userJustSentRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  const handleContainerScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanceFromBottom < 80;
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  async function loadConversations(autoSelectFirst = false) {
    try {
      const res = await api.get('/messages/conversations');
      const convs = res.conversations || [];
      setConversations(convs);

      if (autoSelectFirst && !activeConvId) {
        if (activeConvParam) {
          setActiveConvId(activeConvParam);
        } else if (convs.length > 0 && window.innerWidth >= 768) {
          // On desktop auto-select first conversation, on mobile leave list visible
          setActiveConvId(convs[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId, isManualSend = false) {
    if (!convId) return;
    try {
      const res = await api.get(`/messages/conversations/${convId}/messages`);
      const newMessages = res.messages || [];
      
      const countChanged = newMessages.length !== prevMessagesLengthRef.current;
      prevMessagesLengthRef.current = newMessages.length;

      setMessages(newMessages);
      setActiveConvDetail(res.conversation || null);

      // Only auto-scroll down if user just sent a message OR was already at the bottom
      if (isManualSend || (countChanged && isAtBottomRef.current)) {
        setTimeout(() => {
          scrollToBottom(true);
        }, 60);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadConversations(true);
    api.get('/users').then(res => setWorkers(res.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeConvParam && activeConvParam !== activeConvId) {
      setActiveConvId(activeConvParam);
    }
  }, [activeConvParam]);

  useEffect(() => {
    if (activeConvId) {
      // Reset scroll tracking on conversation switch
      isAtBottomRef.current = true;
      loadMessages(activeConvId, true);
      const interval = setInterval(() => loadMessages(activeConvId, false), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const textToSend = inputText.trim();
    setInputText('');
    userJustSentRef.current = true;
    isAtBottomRef.current = true;

    // Optimistic UI update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      text: textToSend,
      createdAt: new Date().toISOString(),
      senderId: user?.id,
      sender: { id: user?.id, fullName: user?.fullName || 'Me' },
      attachments: [],
      seenByCount: 1,
      seenByTotal: 1,
      seenSummary: '1/1',
      seenUsers: [{ id: user?.id, name: user?.fullName || 'Me' }],
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => {
      scrollToBottom(true);
    }, 40);

    try {
      try {
        await api.post(`/messages/conversations/${activeConvId}/messages`, { text: textToSend });
      } catch {
        await api.post('/messages/send', { conversationId: activeConvId, text: textToSend });
      }
      loadMessages(activeConvId, true);
      loadConversations(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + (err.message || 'Please check your connection'));
      loadMessages(activeConvId, false);
    }
  };

  // Toggle selection for multi-receiver new chat
  const toggleReceiver = (workerId) => {
    if (selectedReceivers.includes(workerId)) {
      setSelectedReceivers(selectedReceivers.filter(id => id !== workerId));
    } else {
      setSelectedReceivers([...selectedReceivers, workerId]);
    }
  };

  // Start 1-to-1 or group chat
  const handleStartChat = async (targetSingleId = null) => {
    try {
      const ids = targetSingleId ? [targetSingleId] : selectedReceivers;
      if (ids.length === 0) return alert('Please select at least one recipient');

      let conv;
      if (ids.length === 1) {
        // Direct chat
        conv = await api.post('/messages/conversations/direct', { targetUserId: ids[0] });
      } else {
        // Group chat
        conv = await api.post('/messages/conversations/group', {
          title: groupTitle || `Group (${ids.length + 1} members)`,
          userIds: ids
        });
      }

      setShowNewChatModal(false);
      setSelectedReceivers([]);
      setGroupTitle('');
      await loadConversations(false);
      setActiveConvId(conv.id);
      setSearchParams({ conversationId: conv.id });
    } catch (err) {
      alert(err.message || 'Failed to start conversation');
    }
  };

  // Add more receivers/members to existing conversation
  const handleAddMembersToChat = async () => {
    if (selectedReceivers.length === 0) return alert('Please select members to add');
    try {
      await api.post(`/messages/conversations/${activeConvId}/members`, {
        userIds: selectedReceivers
      });
      setShowAddMembersModal(false);
      setSelectedReceivers([]);
      await loadMessages(activeConvId, true);
      await loadConversations(false);
    } catch (err) {
      alert(err.message || 'Failed to add members');
    }
  };

  const filteredWorkers = workers.filter(w => {
    if (w.id === user?.id) return false;
    const q = contactSearch.toLowerCase();
    return (w.fullName || '').toLowerCase().includes(q) || (w.email || '').toLowerCase().includes(q) || (w.role?.name || '').toLowerCase().includes(q);
  });

  const existingMemberIds = (activeConvDetail?.members || []).map(m => m.userId);
  const eligibleMembersToAdd = workers.filter(w => w.id !== user?.id && !existingMemberIds.includes(w.id));

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400">Loading chat platform...</div>;

  return (
    <>
      <div className="bg-white border border-brand-border rounded-2xl md:rounded-3xl overflow-hidden shadow-lg flex flex-col h-[calc(100dvh-5.5rem)] md:h-[calc(100dvh-6rem)]">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0 h-full overflow-hidden">
        
        {/* ============================================================== */}
        {/* LEFT: Conversations & Contacts List (Hidden on mobile if chat open) */}
        {/* ============================================================== */}
        <div className={`border-r border-brand-border flex flex-col bg-brand-soft h-full min-h-0 overflow-hidden ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-white flex-shrink-0">
          <div>
            <h2 className="font-extrabold text-base text-brand-dark flex items-center gap-1.5">
              <MessageSquare className="w-5 h-5 text-brand-red" />
              <span>Internal Chat</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-bold">1-to-1, Group & Event Channels</span>
          </div>

          <button
            onClick={() => {
              setSelectedReceivers([]);
              setGroupTitle('');
              setContactSearch('');
              setShowNewChatModal(true);
            }}
            className="px-3 py-2 bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-sm transition"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 no-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Users className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-500">No conversations yet</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="text-xs font-black text-brand-red hover:underline"
              >
                + Choose who to chat with
              </button>
            </div>
          ) : (
            conversations.map(conv => {
              const isEvent = conv.type === 'EVENT';
              const isAnnouncement = conv.type === 'ANNOUNCEMENT';

              return (
                <button
                  key={conv.id}
                  onClick={() => { 
                    setActiveConvId(conv.id); 
                    setSearchParams({ conversationId: conv.id }); 
                  }}
                  className={`w-full p-4 text-left flex items-start justify-between gap-2 transition ${activeConvId === conv.id ? 'bg-white border-l-4 border-brand-red shadow-sm' : 'hover:bg-gray-100'}`}
                >
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isEvent ? 'bg-emerald-600 text-white' : 
                        isAnnouncement ? 'bg-brand-red text-white' : 
                        conv.type === 'GROUP' ? 'bg-indigo-600 text-white' : 'bg-brand-yellow text-brand-dark'
                      }`}>
                        {isEvent ? '🎉 Event' : conv.type}
                      </span>
                      <b className="text-xs font-bold text-brand-dark truncate block">{conv.title}</b>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {conv.lastMessage ? `${conv.lastMessage.sender?.fullName || 'User'}: ${conv.lastMessage.text}` : 'No messages yet'}
                    </p>
                  </div>

                  {conv.hasUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-red flex-shrink-0 animate-pulse mt-1" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT: Active Chat Thread (Full view on mobile when open) */}
      {/* ============================================================== */}
      <div className={`md:col-span-2 flex flex-col h-full min-h-0 overflow-hidden bg-white ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
        {activeConvId ? (
          <>
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-brand-border bg-white flex justify-between items-center shadow-xs flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* Mobile Back Button: Switches back to user/thread list */}
                <button
                  onClick={() => {
                    setActiveConvId(null);
                    setSearchParams({});
                  }}
                  className="md:hidden flex items-center gap-1 text-xs font-black text-brand-dark px-2.5 py-1.5 rounded-xl bg-brand-soft hover:bg-brand-yellow transition mr-1 flex-shrink-0"
                  title="Back to conversation list"
                >
                  <ArrowLeft className="w-4 h-4 text-brand-red" />
                  <span>Chats</span>
                </button>

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <b className="text-sm sm:text-base font-extrabold text-brand-dark truncate block">
                      {activeConvDetail?.title || 'Chat Thread'}
                    </b>
                    {activeConvDetail?.type === 'EVENT' && (
                      <span className="hidden sm:inline-block bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                        🎉 Event Room
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 font-semibold block truncate">
                    {activeConvDetail?.members?.length || 0} Members: {activeConvDetail?.members?.map(m => m.user?.fullName).filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Add Receivers / Event Command Center */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {activeConvDetail?.type === 'EVENT' && activeConvDetail.relatedEntityId && (
                  <Link
                    to={`/events/${activeConvDetail.relatedEntityId}`}
                    className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-black text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                    title="View Event Command Center"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Command Center</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setSelectedReceivers([]);
                    setContactSearch('');
                    setShowAddMembersModal(true);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-brand-dark font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                  title="Add more receivers to chat"
                >
                  <UserPlus className="w-3.5 h-3.5 text-brand-red" />
                  <span className="hidden sm:inline">Add Receivers</span>
                </button>
              </div>
            </div>

            {/* Event Header Banner (if EVENT room) */}
            {activeConvDetail?.type === 'EVENT' && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900 flex-shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">🎉</span>
                  <span className="font-black text-emerald-800">Official Event Coordination Channel</span>
                  <span className="text-gray-400 hidden sm:inline">&bull; Real-time duty coordination for event crew</span>
                </div>
                {activeConvDetail.relatedEntityId && (
                  <Link
                    to={`/events/${activeConvDetail.relatedEntityId}`}
                    className="text-[11px] font-extrabold text-emerald-700 hover:underline flex-shrink-0 ml-2"
                  >
                    View Status &rarr;
                  </Link>
                )}
              </div>
            )}

            {/* Messages Scroll Area */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleContainerScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60 no-scrollbar"
            >
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-6 text-gray-400 text-xs">
                  No messages in this chat yet. Send the first message below!
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="text-[10px] text-gray-400 font-bold mb-0.5">
                        {isMe ? 'You' : (msg.sender?.fullName || 'User')}
                      </div>
                      <div className={`max-w-md p-3.5 rounded-2xl text-xs shadow-sm ${
                        isMe 
                          ? 'bg-brand-dark text-white rounded-br-none' 
                          : 'bg-white border border-brand-border text-brand-dark rounded-bl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className="text-[9px] opacity-60 text-right mt-1 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Read / Seen Tracking */}
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                        <Eye className="w-3 h-3 text-emerald-600" />
                        <span>{msg.seenSummary || 'Delivered'}</span>
                        {Array.isArray(msg.seenUsers) && msg.seenUsers.length > 0 && (
                          <span className="hidden sm:inline text-gray-400 font-normal">
                            ({msg.seenUsers.map(u => u?.name || u?.fullName).filter(Boolean).join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-brand-border bg-white flex gap-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-brand-red hover:bg-brand-redDark disabled:opacity-40 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition flex items-center gap-1 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 text-gray-400">
            <MessageSquare className="w-12 h-12 text-gray-300" />
            <h3 className="text-base font-bold text-brand-dark">Select a Conversation</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Pick a chat from the left panel or click "New Chat" to connect with staff, event teams, or start a group room.
            </p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="bg-brand-yellow hover:bg-brand-yellowDark text-brand-dark font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition"
            >
              + Start New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

      {/* ============================================================== */}
      {/* MODAL 1: Choose Who To Chat With (1-to-1 or Multi-Recipient) */}
      {/* ============================================================== */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-pop max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
              <div>
                <h3 className="text-base font-black text-brand-dark">Choose Who To Chat With</h3>
                <p className="text-xs text-gray-400">Select one for private chat or multiple to create a group</p>
              </div>
              <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {/* Search Input */}
            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff by name or role..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
            </div>

            {/* Optional Group Title if multi-selected */}
            {selectedReceivers.length > 1 && (
              <div className="flex-shrink-0">
                <label className="block text-[11px] font-black text-brand-dark uppercase tracking-wider mb-1">
                  Group Chat Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wedding Crew Alpha, Kitchen Ops..."
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
            )}

            {/* Contacts Selection List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar max-h-64">
              {filteredWorkers.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">No staff members found matching search</div>
              ) : (
                filteredWorkers.map(w => {
                  const isSelected = selectedReceivers.includes(w.id);
                  return (
                    <div
                      key={w.id}
                      onClick={() => toggleReceiver(w.id)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition ${
                        isSelected 
                          ? 'bg-amber-50 border-brand-yellow text-brand-dark' 
                          : 'bg-brand-soft border-transparent hover:bg-gray-100 text-brand-dark'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isSelected ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-black' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <b className="text-xs font-extrabold block">{w.fullName}</b>
                          <span className="text-[10px] text-gray-400 font-semibold">{w.role?.name || 'Staff'} &bull; {w.email}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(w.id);
                        }}
                        className="text-[11px] font-black text-brand-red hover:underline px-2 py-1 bg-white rounded-lg border border-gray-200 shadow-2xs hover:bg-red-50"
                      >
                        Direct Chat &rarr;
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Button */}
            <div className="border-t pt-3 flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartChat()}
                disabled={selectedReceivers.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-brand-yellow hover:bg-brand-yellowDark disabled:opacity-40 text-brand-dark text-xs font-extrabold shadow transition"
              >
                {selectedReceivers.length > 1 
                  ? `Create Group (${selectedReceivers.length} selected)` 
                  : selectedReceivers.length === 1 
                    ? 'Start Chat' 
                    : 'Select Recipients'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: Add More Receivers / Members to Existing Conversation */}
      {/* ============================================================== */}
      {showAddMembersModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-pop max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
              <div>
                <h3 className="text-base font-black text-brand-dark">Add Receivers to Chat</h3>
                <p className="text-xs text-gray-400">Invite additional team members to "{activeConvDetail?.title}"</p>
              </div>
              <button onClick={() => setShowAddMembersModal(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>

            {/* Search Input */}
            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff to add..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-brand-soft border border-brand-border rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
            </div>

            {/* Eligible Workers List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar max-h-64">
              {eligibleMembersToAdd.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">All available staff members are already in this chat thread!</div>
              ) : (
                eligibleMembersToAdd
                  .filter(w => {
                    const q = contactSearch.toLowerCase();
                    return (w.fullName || '').toLowerCase().includes(q) || (w.email || '').toLowerCase().includes(q) || (w.role?.name || '').toLowerCase().includes(q);
                  })
                  .map(w => {
                    const isSelected = selectedReceivers.includes(w.id);
                    return (
                      <div
                        key={w.id}
                        onClick={() => toggleReceiver(w.id)}
                        className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition ${
                          isSelected 
                            ? 'bg-amber-50 border-brand-yellow text-brand-dark' 
                            : 'bg-brand-soft border-transparent hover:bg-gray-100 text-brand-dark'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isSelected ? 'bg-brand-yellow border-brand-yellow text-brand-dark font-black' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <b className="text-xs font-extrabold block">{w.fullName}</b>
                            <span className="text-[10px] text-gray-400 font-semibold">{w.role?.name || 'Staff'} &bull; {w.email}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Bottom Button */}
            <div className="border-t pt-3 flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowAddMembersModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMembersToChat}
                disabled={selectedReceivers.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-brand-red hover:bg-brand-redDark disabled:opacity-40 text-white text-xs font-extrabold shadow transition"
              >
                Add {selectedReceivers.length > 0 ? `(${selectedReceivers.length})` : ''} to Chat
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
