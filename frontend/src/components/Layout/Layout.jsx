import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Header from './Header';
import {
  LayoutDashboard,
  FileText,
  Users,
  Award,
  FolderKanban,
  CheckSquare,
  Calendar,
  CalendarDays,
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
  ChevronLeft,
  ChevronRight,
  Menu,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';

// adminOnly: true = visible only to admins
const navigation = [
  { name: 'Dashboard',     href: '/dashboard',   icon: LayoutDashboard },
  { name: 'Bursary Applications',  href: '/applications', icon: FileText },
  { name: 'Training Applications', href: '/training-applications', icon: GraduationCap },
  { name: 'Personal Dev Plan', href: '/pdp',      icon: TrendingUp },
  { name: 'Training Track',href: '/tasks',        icon: CheckSquare },
  { name: 'Meetings',      href: '/meetings',     icon: Calendar },
  { name: 'Events',        href: '/events',       icon: CalendarDays },
  { name: 'Messages',      href: '/messages',     icon: MessageSquare },
  { name: 'MICTSETA Docs', href: '/files',        icon: FolderOpen },
  { name: 'Tickets',       href: '/tickets',      icon: Ticket },
  { name: 'Division Groups', href: '/division-groups',  icon: UsersRound },
  { name: 'Help & Support',href: '/help',         icon: HelpCircle },
  // ── Admin only ──
  { name: 'Sponsors',   href: '/sponsors',   icon: Users,        adminOnly: true },
  { name: 'BBBEE',      href: '/bbbee',      icon: Award,        adminOnly: true },
  { name: 'Projects',   href: '/projects',   icon: FolderKanban, adminOnly: true },
  { name: 'Expenses',   href: '/expenses',   icon: Receipt,      adminOnly: true },
  { name: 'Reports',    href: '/reports',    icon: BarChart3,    adminOnly: true },
  { name: 'Users',      href: '/users',      icon: Users,        adminOnly: true },
  { name: 'Settings',   href: '/settings',   icon: Settings,     adminOnly: true },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  // Filter navigation based on role
  const visibleNav = navigation.filter(item => !item.adminOnly || isAdmin);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null && !isMobile) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, [isMobile]);

  const toggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const NavItem = ({ item, isActive }) => {
    const content = (
      <Link
        to={item.href}
        data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
          isActive
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        } ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
        onClick={() => isMobile && setSidebarOpen(false)}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {(!sidebarCollapsed || isMobile) && <span className="truncate">{item.name}</span>}
      </Link>
    );

    if (sidebarCollapsed && !isMobile) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Mobile overlay */}
        <div
          className={`fixed inset-0 bg-slate-900/50 lg:hidden z-40 transition-opacity duration-200 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarCollapsed && !isMobile ? 'w-[72px]' : 'w-64'}`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center h-16 border-b border-slate-200 ${
              sidebarCollapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-4'
            }`}>
              <div className="flex items-center">
                <img 
                  src="/sentech-logo.png" 
                  alt="Sentech Logo" 
                  className={`object-contain ${sidebarCollapsed && !isMobile ? 'w-10 h-8' : 'w-40 h-12'}`}
                />
              </div>
              {/* Mobile close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-slate-500 hover:text-slate-700"
                data-testid="close-sidebar-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {visibleNav.map((item) => (
                <NavItem 
                  key={item.name} 
                  item={item} 
                  isActive={location.pathname === item.href}
                />
              ))}
            </nav>

            {/* User section */}
            <div className="border-t border-slate-200">
              {/* Collapse toggle - desktop only */}
              {!isMobile && (
                <div className={`px-3 py-2 border-b border-slate-100 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className={`gap-2 text-slate-500 hover:text-slate-700 ${sidebarCollapsed ? 'p-2' : 'w-full justify-start'}`}
                    data-testid="toggle-sidebar-btn"
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <>
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-xs">Collapse menu</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              <div className="p-3">
                {sidebarCollapsed && !isMobile ? (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={logout}
                        className="w-full p-2 flex justify-center items-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        data-testid="logout-btn"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{user?.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500">Click to logout</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <Link to="/profile" className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/30 transition-all">
                        <span className="text-sm font-semibold text-primary">
                          {user?.full_name?.charAt(0) || 'U'}
                        </span>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to="/profile" className="text-sm font-medium text-slate-900 truncate hover:text-primary transition-colors block">
                          {user?.full_name || 'User'}
                        </Link>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header with hamburger menu */}
          <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-slate-200 bg-white">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md"
              data-testid="open-sidebar-btn"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_877694de-c9d9-4133-bcb4-cd4bf6e19551/artifacts/576jxjw8_HeCFT4bk_400x400.jpg" 
                alt="Sentech Logo" 
                className="w-8 h-8 rounded-md object-contain"
              />
              <span className="font-heading font-bold text-slate-900">Sentech</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block">
            <Header />
          </div>

          <main className="flex-1 overflow-y-auto bg-background">
            <div className="p-4 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Layout;
