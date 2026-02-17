import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Plus,
  CheckSquare,
  FolderKanban,
  StickyNote,
  Calendar,
  Ticket,
  MessageSquare,
  UserPlus,
  DollarSign,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Applications', href: '/applications' },
  { name: 'Sponsors', href: '/sponsors' },
  { name: 'BBBEE', href: '/bbbee' },
  { name: 'Projects', href: '/projects' },
  { name: 'Tasks', href: '/tasks' },
  { name: 'Leads', href: '/leads' },
  { name: 'Prospects', href: '/prospects' },
  { name: 'Meetings', href: '/meetings' },
  { name: 'Notes', href: '/notes' },
  { name: 'Messages', href: '/messages' },
  { name: 'Team', href: '/team' },
  { name: 'Tickets', href: '/tickets' },
  { name: 'Expenses', href: '/expenses' },
  { name: 'Reports', href: '/reports' },
  { name: 'Files', href: '/files' },
  { name: 'Help & Support', href: '/help' },
  { name: 'Settings', href: '/settings' },
];

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPage = navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard';

  const quickAddItems = [
    { label: 'New Task', icon: CheckSquare, href: '/tasks', testId: 'add-task-quick' },
    { label: 'New Note', icon: StickyNote, href: '/notes', testId: 'add-note-quick' },
    { label: 'New Meeting', icon: Calendar, href: '/meetings', testId: 'add-meeting-quick' },
    { label: 'New Ticket', icon: Ticket, href: '/tickets', testId: 'add-ticket-quick' },
    { label: 'New Lead', icon: TrendingUp, href: '/leads', testId: 'add-lead-quick' },
    { label: 'New Expense', icon: DollarSign, href: '/expenses', testId: 'add-expense-quick' },
    { label: 'New Message', icon: MessageSquare, href: '/messages', testId: 'add-message-quick' },
    { label: 'New Project', icon: FolderKanban, href: '/projects', testId: 'add-project-quick' },
  ];

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        <h1 className="text-xl font-heading font-semibold text-slate-900">{currentPage}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search anything..."
                className="w-72 bg-white"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                onBlur={() => { setSearchOpen(false); setSearchQuery(''); }}
                data-testid="header-search-input"
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              data-testid="header-search-btn"
            >
              <Search className="w-5 h-5 text-slate-600" />
            </Button>
          )}
        </div>

        {/* Quick Add Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="header-add-btn" title="Quick Add">
              <Plus className="w-5 h-5 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-white">
            <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quick Add</div>
            <DropdownMenuSeparator />
            {quickAddItems.map((item) => (
              <DropdownMenuItem
                key={item.href}
                className="cursor-pointer flex items-center justify-between group"
                onClick={() => navigate(item.href)}
                data-testid={item.testId}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" data-testid="header-notifications-btn">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
          </Button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="text-sm font-medium text-slate-900 hidden lg:block">
            {user?.full_name || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;