import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationsAPI } from '../../services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search, Bell, Plus, CheckSquare, StickyNote,
  Calendar, Ticket, MessageSquare, DollarSign,
  ChevronRight, FileText, Clock, ArrowRight,
} from 'lucide-react';

const pageNames = {
  '/dashboard': 'Dashboard', '/applications': 'Bursary Applications',
  '/training-applications': 'Training Applications', '/pdp': 'Personal Dev Plan',
  '/tasks': 'Training Track', '/meetings': 'Meetings', '/events': 'Events',
  '/notes': 'Notes', '/messages': 'Messages', '/files': 'MICTSETA Docs',
  '/tickets': 'Tickets', '/division-groups': 'Division Groups',
  '/notifications': 'Notifications', '/help': 'Help & Support',
  '/sponsors': 'Sponsors', '/bbbee': 'BBBEE', '/projects': 'Projects',
  '/expenses': 'Expenses', '/reports': 'Reports', '/users': 'Users',
  '/settings': 'Settings', '/profile': 'Profile',
};

const NOTIF_SOUND_URL = 'data:audio/wav;base64,UklGRlQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAACAgICAgICAgICAgICAgICAgICA';

const ICON_MAP = {
  new_message: MessageSquare, meeting_invite: Calendar, ticket_response: Ticket,
  status_change: FileText, team_update: CheckSquare, system: Bell,
};
const COLOR_MAP = {
  new_message: 'text-blue-600 bg-blue-50', meeting_invite: 'text-purple-600 bg-purple-50',
  ticket_response: 'text-orange-600 bg-orange-50', status_change: 'text-emerald-600 bg-emerald-50',
  team_update: 'text-violet-600 bg-violet-50', system: 'text-slate-600 bg-slate-100',
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

function getNotifRoute(notif) {
  if (notif.reference_type === 'bursary_application' && notif.reference_id)
    return `/applications/${notif.reference_id}/edit`;
  if (notif.reference_type === 'training_application' && notif.reference_id)
    return `/training-applications/${notif.reference_id}/edit`;
  if (notif.reference_type === 'application' && notif.reference_id)
    return `/applications/${notif.reference_id}/edit`;
  if (notif.reference_type === 'conversation') return '/messages';
  if (notif.reference_type === 'meeting') return '/meetings';
  if (notif.reference_type === 'ticket') return '/tickets';
  return '/notifications';
}

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const prevCountRef = useRef(0);
  const audioRef = useRef(null);

  const currentPage = pageNames[location.pathname] || 'Dashboard';

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      const newCount = res.data.unread_count || 0;
      if (newCount > prevCountRef.current && prevCountRef.current >= 0) playNotificationSound();
      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch {}
  }, []);

  const fetchRecentNotifs = useCallback(async () => {
    try {
      const res = await notificationsAPI.getRecent();
      setRecentNotifs(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (bellOpen) fetchRecentNotifs();
  }, [bellOpen, fetchRecentNotifs]);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) { audioRef.current = new Audio(NOTIF_SOUND_URL); audioRef.current.volume = 0.3; }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      try { await notificationsAPI.markRead(notif.id); } catch {}
      setRecentNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setBellOpen(false);
    navigate(getNotifRoute(notif));
  };

  const quickAddItems = [
    { label: 'New Task', icon: CheckSquare, href: '/tasks', testId: 'add-task-quick' },
    { label: 'New Note', icon: StickyNote, href: '/notes', testId: 'add-note-quick' },
    { label: 'New Meeting', icon: Calendar, href: '/meetings', testId: 'add-meeting-quick' },
    { label: 'New Ticket', icon: Ticket, href: '/tickets', testId: 'add-ticket-quick' },
    { label: 'New Expense', icon: DollarSign, href: '/expenses', testId: 'add-expense-quick' },
    { label: 'New Message', icon: MessageSquare, href: '/messages', testId: 'add-message-quick' },
  ];

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) { setSearchOpen(false); setSearchQuery(''); }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center flex-1">
        <h1 className="text-lg md:text-xl font-heading font-semibold text-slate-900 truncate">{currentPage}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative hidden md:block">
          {searchOpen ? (
            <Input type="text" placeholder="Search anything..." className="w-72 bg-white" autoFocus value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearch}
              onBlur={() => { setSearchOpen(false); setSearchQuery(''); }} data-testid="header-search-input" />
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} data-testid="header-search-btn">
              <Search className="w-5 h-5 text-slate-600" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="header-add-btn" title="Quick Add"><Plus className="w-5 h-5 text-slate-600" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-white">
            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Add</div>
            <DropdownMenuSeparator />
            {quickAddItems.map((item) => (
              <DropdownMenuItem key={item.href} className="cursor-pointer flex items-center justify-between group" onClick={() => navigate(item.href)} data-testid={item.testId}>
                <div className="flex items-center gap-2"><item.icon className="w-4 h-4 text-slate-500" /><span>{item.label}</span></div>
                <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Bell with Dropdown */}
        <Popover open={bellOpen} onOpenChange={setBellOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="header-notifications-btn">
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse" data-testid="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 bg-white" data-testid="notification-dropdown">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-rose-500">{unreadCount} unread</span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {recentNotifs.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No notifications yet</p>
                </div>
              ) : (
                recentNotifs.map(notif => {
                  const Icon = ICON_MAP[notif.type] || Bell;
                  const colorCls = COLOR_MAP[notif.type] || COLOR_MAP.system;
                  return (
                    <button key={notif.id}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => handleNotifClick(notif)} data-testid={`notif-dropdown-${notif.id}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorCls}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs leading-tight ${!notif.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'} truncate`}>{notif.title}</p>
                          {!notif.is_read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Clock className="w-2.5 h-2.5" />{getTimeAgo(new Date(notif.created_at))}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-slate-100 px-4 py-2">
              <Button variant="ghost" className="w-full text-xs text-primary justify-center gap-1 h-8"
                onClick={() => { setBellOpen(false); navigate('/notifications'); }} data-testid="notif-view-more">
                View all notifications <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 ml-1 cursor-pointer rounded-full hover:bg-slate-100 px-2 py-1 transition-colors" data-testid="header-avatar-btn">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">{user?.full_name?.charAt(0) || 'U'}</span>
              </div>
              <span className="text-sm font-medium text-slate-900 hidden lg:block">{user?.full_name || 'User'}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')} data-testid="nav-profile-btn">
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')} data-testid="nav-settings-btn">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={logout} data-testid="nav-logout-btn">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
