import "@/App.css";
import "@/index.css";
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';

import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import NewApplicationPage from './pages/NewApplicationPage';
import SponsorsPage from './pages/SponsorsPage';
import BBBEEPage from './pages/BBBEEPage';
import TasksPage from './pages/TasksPage';
import PlaceholderPage from './components/PlaceholderPage';

import {
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
} from 'lucide-react';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/applications/new" element={<NewApplicationPage />} />
              <Route path="/sponsors" element={<SponsorsPage />} />
              <Route path="/bbbee" element={<BBBEEPage />} />
              <Route path="/projects" element={<PlaceholderPage title="Projects" description="Manage your projects" icon={FolderKanban} />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/leads" element={<PlaceholderPage title="Leads" description="Manage leads and prospects" icon={UserPlus} />} />
              <Route
                path="/prospects"
                element={<PlaceholderPage title="Prospects" description="Track potential sponsors" icon={Users2} />}
              />
              <Route
                path="/meetings"
                element={<PlaceholderPage title="Meetings" description="Schedule and manage meetings" icon={Calendar} />}
              />
              <Route
                path="/notes"
                element={<PlaceholderPage title="Notes" description="Create and manage notes" icon={StickyNote} />}
              />
              <Route
                path="/messages"
                element={<PlaceholderPage title="Messages" description="Internal messaging system" icon={MessageSquare} />}
              />
              <Route
                path="/team"
                element={<PlaceholderPage title="Team" description="Manage team members" icon={UsersRound} />}
              />
              <Route
                path="/tickets"
                element={<PlaceholderPage title="Tickets" description="Support ticket system" icon={Ticket} />}
              />
              <Route
                path="/expenses"
                element={<PlaceholderPage title="Expenses" description="Track and manage expenses" icon={Receipt} />}
              />
              <Route
                path="/reports"
                element={<PlaceholderPage title="Reports" description="Generate and view reports" icon={BarChart3} />}
              />
              <Route
                path="/files"
                element={<PlaceholderPage title="Files" description="Document management" icon={FolderOpen} />}
              />
              <Route
                path="/help"
                element={<PlaceholderPage title="Help & Support" description="Get help and support" icon={HelpCircle} />}
              />
              <Route
                path="/settings"
                element={<PlaceholderPage title="Settings" description="System settings" icon={Settings} />}
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;