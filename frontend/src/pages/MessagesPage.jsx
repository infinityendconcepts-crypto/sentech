import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { messagesAPI, usersAPI, divisionGroupsAPI, groupMessagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Send,
  MessageSquare,
  Users,
  User,
  MoreVertical,
  Check,
  CheckCheck,
  Building2,
  Layers,
} from 'lucide-react';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [chatTab, setChatTab] = useState('individual');
  const [divisions, setDivisions] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
    fetchDivisions();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await messagesAPI.getContactableUsers();
      setUsers(response.data.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await divisionGroupsAPI.getAll();
      setDivisions(response.data);
    } catch (error) {
      console.error('Failed to fetch divisions:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await messagesAPI.getMessages(conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartConversation = async (otherUserId) => {
    try {
      const response = await groupMessagesAPI.createConversation({
        target_type: 'individual',
        target_id: otherUserId,
      });
      setConversations(prev => {
        const exists = prev.find(c => c.id === response.data.id);
        return exists ? prev : [response.data, ...prev];
      });
      setSelectedConversation(response.data);
      setNewChatDialog(false);
      fetchConversations();
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const handleStartGroupConversation = async (targetType, targetId, targetName) => {
    try {
      const response = await groupMessagesAPI.createConversation({
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
      });
      setConversations(prev => {
        const exists = prev.find(c => c.id === response.data.id);
        return exists ? prev : [response.data, ...prev];
      });
      setSelectedConversation(response.data);
      setNewChatDialog(false);
      fetchConversations();
    } catch (error) {
      toast.error('Failed to start group conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const response = await messagesAPI.sendMessage(selectedConversation.id, {
        conversation_id: selectedConversation.id,
        content: messageInput,
        message_type: 'text',
      });
      setMessages(prev => [...prev, response.data]);
      setMessageInput('');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation?.participants) return null;
    return conversation.participants.find(p => p.id !== user?.id);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-ZA', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv);
    return other?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           other?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]" data-testid="messages-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Messages</h2>
          <p className="text-slate-600 mt-1">Chat with your team members</p>
        </div>
      </div>

      <Card className="bg-white border-slate-200 h-full">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-conversations-input"
                  />
                </div>
                <Dialog open={newChatDialog} onOpenChange={setNewChatDialog}>
                  <DialogTrigger asChild>
                    <Button size="icon" data-testid="new-chat-btn">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-1">
                      {[['individual', 'Individual', User], ['division', 'Division', Building2], ['subgroup', 'Subgroup', Layers]].map(([key, label, Icon]) => (
                        <button key={key} onClick={() => setChatTab(key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-colors ${chatTab === key ? 'bg-white text-[#0056B3] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          data-testid={`chat-tab-${key}`}>
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                    {chatTab === 'individual' && (
                      <div className="space-y-2">
                        <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} data-testid="search-users-chat" />
                        <div className="max-h-72 overflow-y-auto space-y-1">
                          {users.filter(u => !userSearch || u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase())).slice(0, 20).map((u) => (
                            <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => handleStartConversation(u.id)}>
                              <Avatar className="w-8 h-8"><AvatarFallback className="bg-[#0056B3] text-white text-xs">{u.full_name?.charAt(0)}</AvatarFallback></Avatar>
                              <div><p className="font-medium text-sm">{u.full_name}</p><p className="text-xs text-slate-500">{u.division || ''} — {u.email}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatTab === 'division' && (
                      <div className="max-h-72 overflow-y-auto space-y-1">
                        {divisions.map(d => (
                          <div key={d.division_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer" onClick={() => handleStartGroupConversation('division', d.division_name, d.division_name)}>
                            <div className="w-8 h-8 rounded-md bg-[#0056B3] flex items-center justify-center text-white font-bold text-sm">{d.division_name.charAt(0)}</div>
                            <div><p className="font-medium text-sm">{d.division_name}</p><p className="text-xs text-slate-500">{d.member_count} members</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                    {chatTab === 'subgroup' && (
                      <div className="max-h-72 overflow-y-auto space-y-1">
                        {divisions.filter(d => d.subgroups?.length > 0).map(d => (
                          <div key={d.division_id}>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 py-1.5">{d.division_name}</p>
                            {d.subgroups.map(sg => (
                              <div key={sg.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer ml-2" onClick={() => handleStartGroupConversation('subgroup', sg.id, sg.name)}>
                                <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">{sg.name.charAt(0)}</div>
                                <div><p className="font-medium text-sm">{sg.name}</p><p className="text-xs text-slate-500">{sg.members?.length || 0} members</p></div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const other = getOtherParticipant(conv);
                    return (
                      <div
                        key={conv.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.id === conv.id
                            ? 'bg-primary/10'
                            : 'hover:bg-slate-100'
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                        data-testid={`conversation-${conv.id}`}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-slate-200 text-slate-700">
                            {conv.type === 'group' 
                              ? <Users className="w-4 h-4" />
                              : other?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {conv.type === 'group' ? conv.name : other?.full_name || 'Unknown'}
                            </p>
                            <span className="text-xs text-slate-500">
                              {formatTime(conv.last_message_at)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {conv.type === 'group' ? `${conv.participants?.length || 0} members` : other?.email}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <Badge className="bg-primary text-white">{conv.unread}</Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-white">
                        {selectedConversation.type === 'group'
                          ? <Users className="w-4 h-4" />
                          : getOtherParticipant(selectedConversation)?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {selectedConversation.type === 'group'
                          ? selectedConversation.name
                          : getOtherParticipant(selectedConversation)?.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedConversation.type === 'group'
                          ? `${selectedConversation.participants?.length || 0} members`
                          : 'Online'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-primary text-white rounded-br-sm'
                                : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-slate-500'}`}>
                              <span className="text-xs">{formatTime(message.created_at)}</span>
                              {isOwn && (
                                message.is_read
                                  ? <CheckCheck className="w-3 h-3" />
                                  : <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      data-testid="message-input"
                    />
                    <Button type="submit" size="icon" data-testid="send-message-btn">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a conversation</h3>
                  <p className="text-slate-500">Choose a conversation from the list or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MessagesPage;
