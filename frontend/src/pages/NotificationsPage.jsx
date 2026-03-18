import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { notificationsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Bell, CheckCheck, Trash2, MessageSquare, Calendar,
  Ticket, FileText, Users, Clock, Shield,
} from 'lucide-react';

const ICON_MAP = {
  new_message: MessageSquare,
  meeting_invite: Calendar,
  ticket_response: Ticket,
  status_change: FileText,
  team_update: Users,
  system: Bell,
};

const COLOR_MAP = {
  new_message: 'text-blue-600 bg-blue-50',
  meeting_invite: 'text-purple-600 bg-purple-50',
  ticket_response: 'text-orange-600 bg-orange-50',
  status_change: 'text-emerald-600 bg-emerald-50',
  team_update: 'text-violet-600 bg-violet-50',
  system: 'text-slate-600 bg-slate-100',
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try { const res = await notificationsAPI.getAll(); setNotifications(res.data); }
    catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try { await notificationsAPI.markRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)); }
    catch { toast.error('Failed'); }
  };

  const handleMarkAllRead = async () => {
    try { await notificationsAPI.markAllRead(); setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))); toast.success('All marked as read'); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    try { await notificationsAPI.delete(id); setNotifications(prev => prev.filter(n => n.id !== id)); }
    catch { toast.error('Failed'); }
  };

  const handleClick = (notif) => {
    if (!notif.is_read) handleMarkRead(notif.id);
    if (notif.reference_type === 'conversation') navigate('/messages');
    else if (notif.reference_type === 'meeting') navigate('/meetings');
    else if (notif.reference_type === 'ticket') navigate('/tickets');
    else if (notif.reference_type === 'application') navigate('/applications');
  };

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0056B3]" /></div>;

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Notifications</h2>
          <p className="text-slate-600 mt-1">{unreadCount > 0 ? `${unreadCount} unread notifications` : 'You\'re all caught up'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} className="gap-2" data-testid="mark-all-read-btn">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['all', 'All'], ['unread', 'Unread'], ['new_message', 'Messages'], ['meeting_invite', 'Meetings'], ['status_change', 'Status'], ['ticket_response', 'Tickets']].map(([key, label]) => (
          <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(key)}
            className={filter === key ? 'bg-[#0056B3]' : ''} data-testid={`filter-${key}`}>
            {label}
            {key === 'unread' && unreadCount > 0 && <Badge className="ml-1 bg-red-500 text-white text-[10px] px-1.5">{unreadCount}</Badge>}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="bg-white border-slate-200"><CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
            <p className="text-slate-600">You'll see notifications here when there are updates</p>
          </CardContent></Card>
        ) : (
          filtered.map(notif => {
            const Icon = ICON_MAP[notif.type] || Bell;
            const colorCls = COLOR_MAP[notif.type] || COLOR_MAP.system;
            const time = new Date(notif.created_at);
            const ago = getTimeAgo(time);
            return (
              <Card key={notif.id} className={`bg-white border-slate-200 transition-colors cursor-pointer hover:bg-slate-50 ${!notif.is_read ? 'border-l-4 border-l-[#0056B3]' : ''}`}
                onClick={() => handleClick(notif)} data-testid={`notification-${notif.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorCls}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{notif.title}</p>
                      {!notif.is_read && <div className="w-2 h-2 rounded-full bg-[#0056B3] shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{notif.message}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{ago}</span>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                      onClick={e => { e.stopPropagation(); handleDelete(notif.id); }} data-testid={`delete-notif-${notif.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

function getTimeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default NotificationsPage;
