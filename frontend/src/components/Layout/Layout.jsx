import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Header from './Header';
import {
  LayoutDashboard,
  FileText,
  Users,
  Award,
  FolderKanban,
  CheckSquare,
  UserPlus,
  Users2,
  Calendar,
  StickyNote,
  MessageSquare,
  UsersRound,
  Ticket,
  Receipt,
  BarChart3,
  FolderOpen,
  HelpCircle,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Applications', href: '/applications', icon: FileText },
  { name: 'Sponsors', href: '/sponsors', icon: Users },
  { name: 'BBBEE', href: '/bbbee', icon: Award },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Leads', href: '/leads', icon: UserPlus },
  { name: 'Prospects', href: '/prospects', icon: Users2 },
  { name: 'Meetings', href: '/meetings', icon: Calendar },
  { name: 'Notes', href: '/notes', icon: StickyNote },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Team', href: '/team', icon: UsersRound },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Files', href: '/files', icon: FolderOpen },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      <div
        className={`fixed inset-0 bg-slate-900/50 lg:hidden z-40 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <img 
                src="https://customer-assets.emergentagent.com/job_35f4e68b-f8a6-438f-aaff-cead03553ebb/artifacts/a17j70a0_HeCFT4bk_400x400.jpg" 
                alt="Sentech Logo" 
                className="w-10 h-10 rounded-lg"
              />
              <span className="font-heading font-bold text-lg text-slate-900">Sentech</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700"
              data-testid="close-sidebar-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-700">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;