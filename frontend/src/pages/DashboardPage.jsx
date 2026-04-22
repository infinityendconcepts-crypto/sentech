import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI, notificationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
  Ticket,
  TrendingUp,
  Award,
  Bell,
  GraduationCap,
  Activity,
  BarChart3,
  ArrowRight,
  AlertCircle,
  Monitor,
  DollarSign,
} from 'lucide-react';

const iconMap = {
  'bell': Bell,
  'file-text': FileText,
  'graduation-cap': GraduationCap,
  'ticket': Ticket,
  'check-circle': CheckCircle2,
  'users': Users,
};

const typeColorMap = {
  application: 'bg-blue-100 text-blue-600',
  training_application: 'bg-purple-100 text-purple-600',
  ticket: 'bg-rose-100 text-rose-600',
  notification: 'bg-amber-100 text-amber-600',
  task_assignment: 'bg-emerald-100 text-emerald-600',
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DashboardPage = () => {
  const { isAdmin, isEmployee, isHead } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [trainingInsights, setTrainingInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const showInsights = isAdmin || isHead;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, activityRes, reportRes, notifsRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentActivity(),
          isAdmin ? dashboardAPI.getReportSummary() : Promise.resolve({ data: null }),
          notificationsAPI.getAll(),
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data || []);
        setReportSummary(reportRes.data);
        setNotifications((notifsRes.data || []).slice(0, 5));

        if (showInsights) {
          try {
            const insightsRes = await dashboardAPI.getTrainingInsights();
            setTrainingInsights(insightsRes.data);
          } catch { /* non-critical */ }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin, showInsights]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const adminStatCards = [
    { title: 'Total Applications', value: stats?.total_applications || 0, icon: FileText, color: 'bg-blue-500', link: '/applications' },
    { title: 'Pending Applications', value: stats?.pending_applications || 0, icon: Clock, color: 'bg-amber-500', link: '/applications' },
    { title: 'Approved Applications', value: stats?.approved_applications || 0, icon: CheckCircle2, color: 'bg-emerald-500', link: '/applications' },
    { title: 'Training Applications', value: stats?.training_applications || 0, icon: GraduationCap, color: 'bg-purple-500', link: '/training-applications' },
    { title: 'Open Tickets', value: stats?.open_tickets || 0, icon: Ticket, color: 'bg-rose-500', link: '/tickets' },
    { title: 'Unread Notifications', value: stats?.unread_notifications || 0, icon: Bell, color: 'bg-indigo-500', link: '/notifications' },
  ];

  const employeeStatCards = [
    { title: 'My Applications', value: stats?.total_applications || 0, icon: FileText, color: 'bg-blue-500', link: '/applications' },
    { title: 'Pending', value: stats?.pending_applications || 0, icon: Clock, color: 'bg-amber-500', link: '/applications' },
    { title: 'Approved', value: stats?.approved_applications || 0, icon: CheckCircle2, color: 'bg-emerald-500', link: '/applications' },
    { title: 'My Training', value: stats?.training_applications || 0, icon: GraduationCap, color: 'bg-purple-500', link: '/training-applications' },
    { title: 'My Tickets', value: stats?.open_tickets || 0, icon: Ticket, color: 'bg-rose-500', link: '/tickets' },
    { title: 'Notifications', value: stats?.unread_notifications || 0, icon: Bell, color: 'bg-indigo-500', link: '/notifications' },
  ];

  const statCards = isEmployee ? employeeStatCards : adminStatCards;

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">
          {isEmployee ? 'My Dashboard' : 'Dashboard Overview'}
        </h2>
        <p className="text-slate-600 mt-1">
          {isEmployee ? 'Your personal bursary and training overview' : 'Welcome to your bursary management dashboard'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card
            key={index}
            className="bg-white border-slate-200 hover:shadow-md transition-all duration-200"
            data-testid={`stat-card-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{card.title}</p>
                  <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <Link to={card.link}>
                <Button variant="link" size="sm" className="mt-4 px-0 text-primary hover:text-primary-hover">
                  View details <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Training Insights — Admins & Heads only */}
      {showInsights && trainingInsights && (
        <div data-testid="training-insights-section">
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Training Insights
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart: All 4 metrics */}
            <Card className="bg-white border-slate-200" data-testid="training-insights-pie">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading font-semibold text-slate-700">Training Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Digital Trainings', value: trainingInsights.digital_trainings },
                        { name: 'All Trainings', value: trainingInsights.total_trainings },
                        { name: 'Total Spend (R)', value: trainingInsights.total_spend },
                        { name: 'Total Interns', value: trainingInsights.total_interns },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(value, name) => {
                      if (name === 'Total Spend (R)') return [`R ${value.toLocaleString('en-ZA')}`, name];
                      return [value, name];
                    }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white border-slate-200" data-testid="digital-trainings-card">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-heading font-bold text-slate-900">{trainingInsights.digital_trainings}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Digital Trainings</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200" data-testid="total-trainings-card">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-heading font-bold text-slate-900">{trainingInsights.total_trainings}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">All Trainings</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200" data-testid="total-spend-card">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mb-3">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-heading font-bold text-slate-900">
                    R{trainingInsights.total_spend.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Total Spend</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200" data-testid="total-interns-card">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-heading font-bold text-slate-900">{trainingInsights.total_interns}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">Total Interns</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <Card className="bg-white border-slate-200" data-testid="recent-activity-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between font-heading">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </span>
              <Badge variant="secondary" className="text-xs">{activities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                activities.map((item, idx) => {
                  const IconComp = iconMap[item.icon] || Bell;
                  const colorClass = typeColorMap[item.type] || 'bg-slate-100 text-slate-600';
                  return (
                    <div
                      key={item.id || idx}
                      className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                      data-testid={`activity-item-${idx}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{item.description}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                        {timeAgo(item.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Widget */}
        <Card className="bg-white border-slate-200" data-testid="notifications-widget">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between font-heading">
              <span className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </span>
              {(stats?.unread_notifications || 0) > 0 && (
                <Badge className="bg-rose-500 text-white text-xs">{stats.unread_notifications} unread</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div
                    key={notif.id || idx}
                    className={`flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0 ${
                      !notif.is_read ? 'bg-blue-50/50 -mx-2 px-2 rounded-md' : ''
                    }`}
                    data-testid={`notification-item-${idx}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      !notif.is_read ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!notif.is_read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">{notif.message}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link to="/notifications">
              <Button variant="outline" size="sm" className="w-full mt-4 gap-2" data-testid="view-all-notifications-btn">
                View All Notifications
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Report Summary + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Summary */}
        {isAdmin && reportSummary && (
          <Card className="bg-white border-slate-200" data-testid="report-summary-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-heading">
                <BarChart3 className="w-5 h-5 text-primary" />
                Report Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Users</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{reportSummary.active_users}</p>
                  <p className="text-xs text-slate-500">of {reportSummary.total_users} total</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Bursary Approved</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{reportSummary.approved_bursary_applications}</p>
                  <p className="text-xs text-slate-500">of {reportSummary.total_bursary_applications} total</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Training Approved</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{reportSummary.approved_training_applications}</p>
                  <p className="text-xs text-slate-500">of {reportSummary.total_training_applications} total</p>
                </div>
                <div className="bg-rose-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Tickets</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{reportSummary.open_tickets}</p>
                  <p className="text-xs text-slate-500">{reportSummary.closed_tickets} closed</p>
                </div>
              </div>
              <Link to="/reports">
                <Button variant="outline" size="sm" className="w-full mt-4 gap-2" data-testid="view-full-reports-btn">
                  View Full Reports
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-white border-slate-200" data-testid="quick-actions-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading">
              <Award className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/applications/new">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="quick-new-application">
                  <FileText className="w-4 h-4" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">New Application</span>
                    <span className="block text-xs text-slate-600">Start bursary form</span>
                  </span>
                </Button>
              </Link>
              {isEmployee ? (
                <>
                  <Link to="/tickets">
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="quick-new-ticket">
                      <Ticket className="w-4 h-4" />
                      <span className="text-left">
                        <span className="block text-sm font-medium">New Ticket</span>
                        <span className="block text-xs text-slate-600">Submit a request</span>
                      </span>
                    </Button>
                  </Link>
                  <Link to="/notes">
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="quick-new-note">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-left">
                        <span className="block text-sm font-medium">New Note</span>
                        <span className="block text-xs text-slate-600">Create a note</span>
                      </span>
                    </Button>
                  </Link>
                  <Link to="/messages">
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="quick-new-message">
                      <Bell className="w-4 h-4" />
                      <span className="text-left">
                        <span className="block text-sm font-medium">New Message</span>
                        <span className="block text-xs text-slate-600">Send a message</span>
                      </span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/training-applications">
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="quick-training-apps">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-left">
                        <span className="block text-sm font-medium">Training Apps</span>
                        <span className="block text-xs text-slate-600">View training</span>
                      </span>
                    </Button>
                  </Link>
                  <Link to="/bbbee">
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="quick-bbbee">
                      <Award className="w-4 h-4" />
                      <span className="text-left">
                        <span className="block text-sm font-medium">BBBEE Records</span>
                        <span className="block text-xs text-slate-600">View compliance</span>
                      </span>
                    </Button>
                  </Link>
                  <Link to="/reports">
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4" data-testid="quick-reports">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-left">
                        <span className="block text-sm font-medium">Reports</span>
                        <span className="block text-xs text-slate-600">Generate reports</span>
                      </span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
