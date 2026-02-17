import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reportsAPI, tasksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  BarChart3,
  Download,
  FileText,
  Users,
  Briefcase,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
  Printer,
} from 'lucide-react';

const ReportsPage = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('applications');
  const [dateRange, setDateRange] = useState('all');

  const reportTypes = [
    { value: 'applications', label: 'Applications', icon: FileText },
    { value: 'expenses', label: 'Expenses', icon: DollarSign },
    { value: 'tasks', label: 'Tasks', icon: CheckCircle },
    { value: 'projects', label: 'Projects', icon: Briefcase },
    { value: 'sponsors', label: 'Sponsors', icon: Users },
    { value: 'leads', label: 'Leads', icon: TrendingUp },
    { value: 'tickets', label: 'Tickets', icon: FileText },
  ];

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await reportsAPI.getDashboard();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await reportsAPI.export(selectedReport, format);
      
      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_report.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_report.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-600 mt-1">View insights and export data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2" data-testid="print-btn">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} className="gap-2" data-testid="export-csv-btn">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport('json')} className="gap-2" data-testid="export-json-btn">
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Dashboard Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Applications</p>
                <p className="text-2xl font-bold text-slate-900">{dashboardStats?.applications?.total || 0}</p>
                <p className="text-xs text-emerald-600">
                  {dashboardStats?.applications?.approved || 0} approved
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Sponsors</p>
                <p className="text-2xl font-bold text-slate-900">{dashboardStats?.sponsors?.active || 0}</p>
                <p className="text-xs text-slate-500">
                  of {dashboardStats?.sponsors?.total || 0} total
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tasks Completed</p>
                <p className="text-2xl font-bold text-slate-900">{dashboardStats?.tasks?.completed || 0}</p>
                <p className="text-xs text-emerald-600">
                  {dashboardStats?.tasks?.completion_rate || 0}% completion rate
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(dashboardStats?.expenses?.total)}
                </p>
                <p className="text-xs text-slate-500">All time</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Selection */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger className="w-48" data-testid="select-report-type">
                  <SelectValue placeholder="Select report" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Last updated: {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications Overview */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Applications Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm">Total Applications</span>
                    <span className="font-bold">{dashboardStats?.applications?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="text-sm text-amber-700">Pending Review</span>
                    <span className="font-bold text-amber-700">{dashboardStats?.applications?.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-emerald-700">Approved</span>
                    <span className="font-bold text-emerald-700">{dashboardStats?.applications?.approved || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projects Overview */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Projects Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm">Total Projects</span>
                    <span className="font-bold">{dashboardStats?.projects?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">Active Projects</span>
                    <span className="font-bold text-blue-700">{dashboardStats?.projects?.active || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leads Overview */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Leads Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm">Total Leads</span>
                    <span className="font-bold">{dashboardStats?.leads?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-emerald-700">Won</span>
                    <span className="font-bold text-emerald-700">{dashboardStats?.leads?.won || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Overview */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Support Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">Open Tickets</span>
                    <span className="font-bold text-blue-700">{dashboardStats?.tickets?.open || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">Detailed Report</h3>
              <p className="text-slate-600 mb-4">
                Export the {selectedReport} report to view detailed data
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  Export as CSV
                </Button>
                <Button onClick={() => handleExport('json')}>
                  Export as JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">Trend Analysis</h3>
              <p className="text-slate-600">
                Trend analysis and charts will be available here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
