import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboardAPI } from '../services/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  Users,
  FolderKanban,
  Ticket,
  TrendingUp,
  Award,
} from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: FileText,
      color: 'bg-blue-500',
      link: '/applications',
    },
    {
      title: 'Pending Applications',
      value: stats?.pending_applications || 0,
      icon: Clock,
      color: 'bg-amber-500',
      link: '/applications',
    },
    {
      title: 'Approved Applications',
      value: stats?.approved_applications || 0,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      link: '/applications',
    },
    {
      title: 'Active Sponsors',
      value: stats?.total_sponsors || 0,
      icon: Users,
      color: 'bg-purple-500',
      link: '/sponsors',
    },
    {
      title: 'Active Projects',
      value: stats?.active_projects || 0,
      icon: FolderKanban,
      color: 'bg-indigo-500',
      link: '/projects',
    },
    {
      title: 'Open Tickets',
      value: stats?.open_tickets || 0,
      icon: Ticket,
      color: 'bg-rose-500',
      link: '/tickets',
    },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-600 mt-1">Welcome to your bursary management dashboard</p>
      </div>

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
                  View details →
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">Application Approved</p>
                  <p className="text-xs text-slate-600 mt-0.5">Engineering Bursary 2024 - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">New Application Submitted</p>
                  <p className="text-xs text-slate-600 mt-0.5">Medical Bursary 2024 - 5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">New Sponsor Added</p>
                  <p className="text-xs text-slate-600 mt-0.5">Tech Corp Foundation - 1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader>
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
              <Link to="/sponsors">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4">
                  <Users className="w-4 h-4" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">View Sponsors</span>
                    <span className="block text-xs text-slate-600">Manage sponsors</span>
                  </span>
                </Button>
              </Link>
              <Link to="/bbbee">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4">
                  <Award className="w-4 h-4" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">BBBEE Records</span>
                    <span className="block text-xs text-slate-600">View compliance</span>
                  </span>
                </Button>
              </Link>
              <Link to="/reports">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-4">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-left">
                    <span className="block text-sm font-medium">Reports</span>
                    <span className="block text-xs text-slate-600">Generate reports</span>
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;