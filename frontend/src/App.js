import "@/App.css";
import "@/index.css";
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Layout from './components/Layout/Layout';

import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import NewApplicationPage from './pages/NewApplicationPage';
import SponsorsPage from './pages/SponsorsPage';
import BBBEEPage from './pages/BBBEEPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import LeadsPage from './pages/LeadsPage';
import ProspectsPage from './pages/ProspectsPage';
import MeetingsPage from './pages/MeetingsPage';
import NotesPage from './pages/NotesPage';
import MessagesPage from './pages/MessagesPage';
import TeamPage from './pages/TeamPage';
import TicketsPage from './pages/TicketsPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import FilesPage from './pages/FilesPage';
import HelpPage from './pages/HelpPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import UserProfilePage from './pages/UserProfilePage';
import EventsPage from './pages/EventsPage';
import PDPPage from './pages/PDPPage';

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
              {/* ── Routes accessible by ALL authenticated users ── */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/applications/new" element={<NewApplicationPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/pdp" element={<PDPPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/meetings" element={<MeetingsPage />} />
              <Route path="/team" element={<TeamPage />} />

              {/* ── Admin-only routes ── */}
              <Route element={<RoleProtectedRoute requiredRole="admin" />}>
                <Route path="/sponsors" element={<SponsorsPage />} />
                <Route path="/bbbee" element={<BBBEEPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/prospects" element={<ProspectsPage />} />
                <Route path="/expenses" element={<ExpensesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/users" element={<UsersPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
