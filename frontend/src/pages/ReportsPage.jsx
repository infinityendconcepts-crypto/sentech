import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { reportsAPI, tasksAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  Users, Briefcase, CheckCircle, DollarSign,
  TrendingUp, Calendar, Filter, Printer,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  Legend,
} from 'recharts';

const CHART_COLORS = ['#0056B3', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

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

  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await reportsAPI.export(selectedReport, format);
      
      const mimeTypes = {
        'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'pdf': 'application/pdf',
        'csv': 'text/csv',
        'json': 'application/json',
      };
      const extensions = { 'excel': 'xlsx', 'pdf': 'pdf', 'csv': 'csv', 'json': 'json' };
      
      let blobData = response.data;
      if (format === 'json') blobData = JSON.stringify(response.data, null, 2);
      
      const blob = new Blob([blobData], { type: mimeTypes[format] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_report.${extensions[format]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    } finally {
      setExporting(false);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2" disabled={exporting} data-testid="export-report-btn">
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('excel')} data-testid="export-excel-btn">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} data-testid="export-pdf-btn">
                <FileText className="w-4 h-4 mr-2 text-red-600" />
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')} data-testid="export-csv-btn">
                <Download className="w-4 h-4 mr-2 text-blue-600" />
                Export to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
