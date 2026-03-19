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
  Search, Bell, Plus, CheckSquare, StickyNote,
  Calendar, Ticket, MessageSquare, DollarSign,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Bursary Applications', href: '/applications' },
  { name: 'Training Applications', href: '/training-applications' },
  { name: 'Personal Dev Plan', href: '/pdp' },
  { name: 'Training Track', href: '/tasks' },
  { name: 'Meetings', href: '/meetings' },
  { name: 'Events', href: '/events' },
  { name: 'Notes', href: '/notes' },
  { name: 'Messages', href: '/messages' },
  { name: 'MICTSETA Docs', href: '/files' },
  { name: 'Tickets', href: '/tickets' },
  { name: 'Division Groups', href: '/division-groups' },
  { name: 'Notifications', href: '/notifications' },
  { name: 'Help & Support', href: '/help' },
  { name: 'Sponsors', href: '/sponsors' },
  { name: 'BBBEE', href: '/bbbee' },
  { name: 'Projects', href: '/projects' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'Reports', href: '/reports' },
  { name: 'Users', href: '/users' },
  { name: 'Settings', href: '/settings' },
  { name: 'Profile', href: '/profile' },
];

const NOTIF_SOUND_URL = 'data:audio/wav;base64,UklGRlQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTAFAACAgICAgICAgICAgICAgICAgICA/4CAgP+AgID/gICA/4CAgP+AgH+Af39+f35+fn5+fn5/f3+AgICBgYGCgoKDg4ODg4ODgoKBgYCAgH9/fn5+fn5+f3+AgIGBgoKDg4SEhISEhIODgoKBgH9/fn19fX19fn5/gIGBgoODhIWFhYWFhYSEg4KBgH9+fX19fX5+f4CBgoOEhYaGhoaGhoWFhIOCgX9+fXx8fH1+f4CBg4SFhoeHh4eHh4aFhIOCgH5+fXx8fH1+gIGDhIaHiIiIiIiIh4aFg4KAfn18fHx9fn+BgoSGh4iJiYmJiYiHhoSDgX9+fXx8fX5/gYOEhoiJioqKioqJiIeGhIJ/fn18fH1+gIGDhYeJioqLi4uKiomHhoSCgH5+fXx9foCAgoSGiImLi4yMi4uKiIeGg4GAfn18fX5/gIKEhoiKi4yMjIyLioiHhYOBf359fX1+gIGDhYeJi4yNjY2Mi4qIh4WDgX9+fX19foCAgoSHiYuMjY2NjYyLiYeGg4F/fn19fX6AgIKFh4mLjI6Ojo2Mi4mHhYOBf359fX5+gIGDhYiKjI2Ojo6NjIuJh4WDgX9+fX1+f4CChIaJi4yOj4+OjYyKiIaDgX9+fX1+f4GChIeJi42Oj4+PjoyLiYeFg4F/fn19fn+AgYOFiIqMjo+Pj46NjImHhYOBf359fn5/gIKEhomLjY6Pj4+OjYuJh4WDgX9+fn5+f4GCg4aIioyOj5CPjo2LiYeFg4F/fn5+fn+AgoOFiIqMjo+Qj46NjImHhYKAf35+fn5/gIKEhomLjY+QkI+OjYuJh4WCgH9+fn5+f4GChIeJi42Pj5CPjo2LiYeFgoB/fn5+fn+BgoSGiYuNj5CQj46NjImHhYKAf35+fn9/gYKEhomLjY+QkI+OjYuJh4WCgH9+fn5/f4GCg4aIioyOkJCPjo2LiYeEgoB/fn5+f3+BgoSGiIqNj5CQj46Ni4mHhYKAf35+fn9/gIKEhoiKjY+QkI+OjYuJh4WCgH9+fn5/gICCg4aIioyOkJCPjo2LiYeEgoB/fn5+f4CAgYOFh4mLjY+Qj4+OjIqIhYOBf35+fn9/gIGDhYeJi42Pj4+PjYuJh4WCgH9+fn5/f4CBg4WIiouNj4+Pjo2LiYeEgoB/fn5+f3+AgYOFh4mLjY+Pj46NjImHhIKAf35+fn9/gIGDhYeJi42Pj4+OjYuJh4SCgH9+fn5/f4CBg4WHiYuNj4+Pjo2LiYeFgn9+fn5+f3+AgYOFh4mLjY+Pjo6Ni4mHhYKAfn5+fn9/gIGDhYeJi42Pj46OjYuJh4WCgH9+fn5/f4CBg4WHiYuNj4+OjY2LiYeFgn9+fn5+f3+AgYOFh4mLjY6Ojo2LiYeFgn9+fn5+f3+AgYOFh4mLjI6OjY2LiYeFgn9+fn5+f3+AgYKEhoiKjI2OjY2LiYeFgn9/fn5+f3+AgYKEhoiKjI2NjYyLiYeFgn9/fn5+f3+AgYKEhoiKjI2NjYyKiIeFgn9/fn5+f3+AgYKEhoiKjI2NjIyKiIeFgn9/fn5+f4CAgYKEhoiKjI2NjIuKiIaEgn9/fn5+f4CAgYKEhoiKi42MjIuKiIaEgn+Afn5+f4CAgYKEhoiKi4yMjIuKiIaEgoB/fn5+f4CAgIKEhoeJi4yMi4uKiIaEgoB/f35+f4CAgIKDhoeJi4uMi4uKiIaDgYB/f35/f4CAgIKDhoeJiouMi4uJiIaDgYB/f35/f4B/gIKDhoeJiouMi4qJh4aDgYB/f39/f4B/gIKDhYeJiouLi4qJh4aDgYB/f39/f4CAgIKDhYeJiouLiomJh4aDgYB/f39/f4CAgIKDhYeJiouLiomIh4WDgYB/f39/f4CAgIKDhYeJiouLiomIhoWDgYB/f39/f4CAgIGDhYeIiouLiomIhoWDgYCAf39/f4CAgIGDhYeIiouKiomIhoWDgYCAf39/f4CA';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);
  const audioRef = useRef(null);

  const currentPage = navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard';

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      const newCount = res.data.unread_count || 0;
      if (newCount > prevCountRef.current && prevCountRef.current >= 0) {
        playNotificationSound();
      }
      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(NOTIF_SOUND_URL);
        audioRef.current.volume = 0.3;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
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
    if (e.key === 'Enter' && searchQuery.trim()) {
      setSearchOpen(false);
      setSearchQuery('');
    }
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

        {/* Notifications Bell */}
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} data-testid="header-notifications-btn">
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse" data-testid="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* User Avatar → Profile */}
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
