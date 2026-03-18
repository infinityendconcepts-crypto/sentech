import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { reportsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  Users, Briefcase, DollarSign, Maximize2, X,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#0056B3', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#D946EF', '#84CC16'];

const ChartCard = ({ title, children, onZoom }) => (
  <Card className="bg-white border-slate-200 group">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
        onClick={onZoom}
        data-testid={`zoom-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Maximize2 className="w-4 h-4 text-slate-500" />
      </Button>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const ReportsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [zoomChart, setZoomChart] = useState(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await reportsAPI.getDashboard();
      setStats(res.data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleExport = async (type, format) => {
    setExporting(true);
    try {
      const res = await reportsAPI.export(type, format);
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${type}_report.json`; a.click();
      } else {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url; a.download = `${type}_report.${format}`; a.click();
      }
      toast.success('Report exported');
    } catch { toast.error('Export failed'); } finally { setExporting(false); }
  };

  const formatCurrency = (v) => `R ${(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const divisionData = stats?.users?.by_division || [];
  const activeInactiveData = [
    { name: 'Active', value: stats?.users?.active || 0 },
    { name: 'Inactive', value: stats?.users?.inactive || 0 },
  ];
  const expenseTypeData = stats?.expense_breakdown?.by_type?.filter(e => e.value > 0) || [];
  const applicantExpenses = stats?.expense_breakdown?.by_applicant || [];
  const appOverviewData = [
    { name: 'Total', value: stats?.applications?.total || 0, fill: '#0056B3' },
    { name: 'Pending', value: stats?.applications?.pending || 0, fill: '#F59E0B' },
    { name: 'Approved', value: stats?.applications?.approved || 0, fill: '#10B981' },
    { name: 'Tasks', value: stats?.tasks?.total || 0, fill: '#8B5CF6' },
    { name: 'Completed', value: stats?.tasks?.completed || 0, fill: '#06B6D4' },
  ];

  const renderDivisionChart = (height = 320) => (
    divisionData.length > 0 ? (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={divisionData} cx="50%" cy="50%" labelLine={false}
            label={({ name, value }) => `${name.length > 12 ? name.slice(0, 12) + '...' : name} (${value})`}
            outerRadius={height > 400 ? 180 : 110} dataKey="value">
            {divisionData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
          </Pie>
          <RechartsTooltip formatter={(value, name) => [`${value} users`, name]} />
          <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    ) : <p className="text-center text-slate-400 py-12">No division data</p>
  );

  const renderActiveInactiveChart = (height = 320) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={activeInactiveData} cx="50%" cy="50%" innerRadius={height > 400 ? 100 : 60}
          outerRadius={height > 400 ? 180 : 110} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
          <Cell fill="#10B981" /><Cell fill="#EF4444" />
        </Pie>
        <RechartsTooltip /><Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderExpenseTypeChart = (height = 300) => (
    expenseTypeData.length > 0 ? (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={expenseTypeData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <RechartsTooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {expenseTypeData.map((_, i) => (<Cell key={i} fill={['#0056B3', '#F59E0B', '#10B981', '#EC4899'][i % 4]} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ) : <p className="text-center text-slate-400 py-12">No expense data</p>
  );

  const renderAppOverviewChart = (height = 250) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={appOverviewData}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><RechartsTooltip />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {appOverviewData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const chartConfigs = {
    division: { title: 'Users by Division', render: renderDivisionChart },
    activeInactive: { title: 'Active vs Inactive Users', render: renderActiveInactiveChart },
    expenseType: { title: 'Expenses by Type', render: renderExpenseTypeChart },
    appOverview: { title: 'Applications Overview', render: renderAppOverviewChart },
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Overview of all system metrics and data</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={exporting} data-testid="export-btn">
              <Download className="w-4 h-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleExport('applications', 'excel')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Applications (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('expenses', 'excel')}>
              <DollarSign className="w-4 h-4 mr-2" /> Expenses (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('applications', 'json')}>
              <FileText className="w-4 h-4 mr-2" /> Applications (JSON)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.users?.total || 0, sub: `${stats?.users?.active || 0} active`, icon: Users, color: 'bg-blue-500' },
          { label: 'Applications', value: stats?.applications?.total || 0, sub: `${stats?.applications?.pending || 0} pending`, icon: FileText, color: 'bg-amber-500' },
          { label: 'Total Expenses', value: formatCurrency(stats?.expense_breakdown?.total_application_expenses || 0), sub: `${applicantExpenses.length} applicants`, icon: DollarSign, color: 'bg-emerald-500' },
          { label: 'Open Tickets', value: stats?.tickets?.open || 0, sub: 'Awaiting response', icon: Briefcase, color: 'bg-rose-500' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="bg-white border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Users by Division" onZoom={() => setZoomChart('division')}>
          {renderDivisionChart()}
        </ChartCard>
        <ChartCard title="Active vs Inactive Users" onZoom={() => setZoomChart('activeInactive')}>
          {renderActiveInactiveChart()}
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Expenses by Type" onZoom={() => setZoomChart('expenseType')}>
          {renderExpenseTypeChart()}
        </ChartCard>
        <Card className="bg-white border-slate-200">
          <CardHeader><CardTitle className="text-base">Expenses by Applicant</CardTitle></CardHeader>
          <CardContent>
            {applicantExpenses.length > 0 ? (
              <div className="space-y-3">
                {applicantExpenses.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg" data-testid={`applicant-expense-${i}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900">{item.applicant}</p>
                        <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg font-semibold">
                  <span className="text-slate-700">Grand Total</span>
                  <span className="text-slate-900">{formatCurrency(stats?.expense_breakdown?.total_application_expenses || 0)}</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-400 py-12">No applicant expenses</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Applications Overview */}
      <ChartCard title="Applications Overview" onZoom={() => setZoomChart('appOverview')}>
        {renderAppOverviewChart()}
      </ChartCard>

      {/* Zoom/Fullscreen Chart Dialog */}
      <Dialog open={!!zoomChart} onOpenChange={() => setZoomChart(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh]" data-testid="chart-zoom-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {zoomChart && chartConfigs[zoomChart]?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {zoomChart && chartConfigs[zoomChart]?.render(500)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;
