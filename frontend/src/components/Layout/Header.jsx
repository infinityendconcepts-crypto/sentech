import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  Plus,
  CheckSquare,
  Clock,
  FolderKanban,
  ListTodo,
  StickyNote,
  Calendar,
  Ticket,
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
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const currentPage = navigation.find((item) => item.href === location.pathname)?.name || 'Dashboard';

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
                placeholder="Search..."
                className="w-64"
                autoFocus
                onBlur={() => setSearchOpen(false)}
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

        {/* Add Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="header-add-btn">
              <Plus className="w-5 h-5 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer" data-testid="add-task-btn">
              <CheckSquare className="w-4 h-4 mr-2" />
              Add Task
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" data-testid="add-reminder-btn">
              <Clock className="w-4 h-4 mr-2" />
              Add Reminder
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" data-testid="add-project-time-btn">
              <FolderKanban className="w-4 h-4 mr-2" />
              Add Project Time
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" data-testid="add-todo-btn">
              <ListTodo className="w-4 h-4 mr-2" />
              Add To Do
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" data-testid="add-note-btn">
              <StickyNote className="w-4 h-4 mr-2" />
              Add Note
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" data-testid="add-event-btn">
              <Calendar className="w-4 h-4 mr-2" />
              Add Event
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" data-testid="add-ticket-btn">
              <Ticket className="w-4 h-4 mr-2" />
              Add Ticket
            </DropdownMenuItem>
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
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-700">
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