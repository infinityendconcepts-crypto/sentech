import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { reportsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  BarChart3, Download, FileText, FileSpreadsheet,
  Users, DollarSign, Maximize2, X, Filter,
  PieChart as PieChartIcon, BarChart as BarChartLucide,
  TrendingUp, Ticket, GraduationCap, RefreshCw,
  Activity, Layers, ChevronDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
  AreaChart, Area,
} from 'recharts';

const COLORS = ['#0056B3', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#D946EF', '#84CC16'];

const CHART_TYPES = [
  { value: 'pie', label: 'Pie', icon: PieChartIcon },
  { value: 'bar', label: 'Bar', icon: BarChartLucide },
  { value: 'horizontal_bar', label: 'H-Bar', icon: BarChartLucide },
  { value: 'line', label: 'Line', icon: TrendingUp },
  { value: 'area', label: 'Area', icon: Activity },
  { value: 'donut', label: 'Donut', icon: Layers },
];

const formatCurrency = (v) => `R ${(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

/* ─── Multi-select dropdown ─── */
const MultiSelect = ({ label, options, selected, onChange, testId }) => {
  const [open, setOpen] = useState(false);
  const toggle = (val) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };
  const display = selected.length === 0 ? `All ${label}` : selected.length <= 2 ? selected.join(', ') : `${selected.length} selected`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-full justify-between text-left font-normal text-sm truncate"
          data-testid={testId}>
          <span className="truncate">{display}</span>
          <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 max-h-64 overflow-y-auto" align="start">
        {selected.length > 0 && (
          <button className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 border-b"
            onClick={() => onChange([])}>Clear selection</button>
        )}
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-sm"
            data-testid={`multi-opt-${opt}`}>
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
            <span className="truncate">{opt}</span>
          </label>
        ))}
        {options.length === 0 && <p className="p-3 text-xs text-slate-400">No options</p>}
      </PopoverContent>
    </Popover>
  );
};

/* ─── Universal Chart ─── */
const UniversalChart = ({ data, chartType, height = 300 }) => {
  if (!data || data.length === 0) return <p className="text-center text-slate-400 py-12 text-sm">No data available</p>;

  const renderPie = (inner = 0) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={inner}
          outerRadius={height > 400 ? 170 : 100}
          dataKey="value" nameKey="name">
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <RechartsTooltip formatter={(v) => [typeof v === 'number' && v > 999 ? formatCurrency(v) : v]} />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  );

  switch (chartType) {
    case 'pie': return renderPie(0);
    case 'donut': return renderPie(height > 400 ? 80 : 50);
    case 'bar':
      return (<ResponsiveContainer width="100%" height={height}><BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} /><YAxis tick={{ fontSize: 11 }} /><RechartsTooltip />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
      </BarChart></ResponsiveContainer>);
    case 'horizontal_bar':
      return (<ResponsiveContainer width="100%" height={Math.max(height, data.length * 40)}><BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><RechartsTooltip />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
      </BarChart></ResponsiveContainer>);
    case 'line':
      return (<ResponsiveContainer width="100%" height={height}><LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} /><YAxis tick={{ fontSize: 11 }} /><RechartsTooltip />
        <Line type="monotone" dataKey="value" stroke="#0056B3" strokeWidth={2} dot={{ fill: '#0056B3', r: 4 }} />
      </LineChart></ResponsiveContainer>);
    case 'area':
      return (<ResponsiveContainer width="100%" height={height}><AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} /><YAxis tick={{ fontSize: 11 }} /><RechartsTooltip />
        <Area type="monotone" dataKey="value" stroke="#0056B3" fill="#0056B3" fillOpacity={0.15} strokeWidth={2} />
      </AreaChart></ResponsiveContainer>);
    default: return renderPie(0);
  }
};

/* ─── Chart Card with per-chart export ─── */
const ChartCard = ({ title, data, defaultChart = 'pie', height = 300, onZoom }) => {
  const [chartType, setChartType] = useState(defaultChart);
  const [exporting, setExporting] = useState(false);

  const handleExportChart = async () => {
    if (!data || data.length === 0) { toast.error('No data to export'); return; }
    setExporting(true);
    try {
      const res = await reportsAPI.exportChart(title, data);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${title} exported`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <Card className="bg-white border-slate-200 group" data-testid={`chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-800">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {CHART_TYPES.map((ct) => (
            <Button key={ct.value} variant={chartType === ct.value ? 'default' : 'ghost'}
              size="sm" className="h-7 w-7 p-0"
              onClick={() => setChartType(ct.value)} title={ct.label}
              data-testid={`chart-type-${ct.value}-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              <ct.icon className="w-3.5 h-3.5" />
            </Button>
          ))}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600"
            onClick={handleExportChart} disabled={exporting || !data?.length}
            title="Export this chart" data-testid={`export-chart-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
            onClick={() => onZoom({ title, data, chartType })}
            data-testid={`zoom-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <UniversalChart data={data} chartType={chartType} height={height} />
      </CardContent>
    </Card>
  );
};

/* ═════════════════════════════════════════════════════════════ */
const ReportsPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [zoomChart, setZoomChart] = useState(null);

  // Multi-select filters
  const [selDivisions, setSelDivisions] = useState([]);
  const [selDepartments, setSelDepartments] = useState([]);
  const [selRaces, setSelRaces] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const filtersActive = selDivisions.length > 0 || selDepartments.length > 0 || selRaces.length > 0 || filterStatus || ageMin || ageMax || filterDateFrom || filterDateTo;

  const buildParams = useCallback(() => {
    const p = {};
    if (selDivisions.length) p.divisions = selDivisions.join(',');
    if (selDepartments.length) p.departments = selDepartments.join(',');
    if (selRaces.length) p.races = selRaces.join(',');
    if (filterStatus) p.status = filterStatus;
    if (ageMin) p.age_min = ageMin;
    if (ageMax) p.age_max = ageMax;
    if (filterDateFrom) p.date_from = filterDateFrom;
    if (filterDateTo) p.date_to = filterDateTo;
    return p;
  }, [selDivisions, selDepartments, selRaces, filterStatus, ageMin, ageMax, filterDateFrom, filterDateTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getInteractiveData(buildParams());
      setData(res.data);
    } catch { toast.error('Failed to load report data'); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => {
    setSelDivisions([]); setSelDepartments([]); setSelRaces([]);
    setFilterStatus(''); setAgeMin(''); setAgeMax('');
    setFilterDateFrom(''); setFilterDateTo('');
  };

  const handleExportFiltered = async (dataType = 'all') => {
    setExporting(true);
    try {
      const res = await reportsAPI.exportFiltered({ data_type: dataType, ...buildParams() });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentech_report_${dataType}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const divisions = useMemo(() => data?.filters?.divisions || [], [data]);
  const departments = useMemo(() => data?.filters?.departments || [], [data]);
  const raceOptions = useMemo(() => data?.filters?.races || [], [data]);

  if (loading && !data) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  /* ── Active filter badges ── */
  const filterBadges = [];
  selDivisions.forEach(d => filterBadges.push({ label: d, clear: () => setSelDivisions(prev => prev.filter(v => v !== d)) }));
  selDepartments.forEach(d => filterBadges.push({ label: d, clear: () => setSelDepartments(prev => prev.filter(v => v !== d)) }));
  selRaces.forEach(r => filterBadges.push({ label: `Race: ${r}`, clear: () => setSelRaces(prev => prev.filter(v => v !== r)) }));
  if (filterStatus) filterBadges.push({ label: `Status: ${filterStatus}`, clear: () => setFilterStatus('') });
  if (ageMin) filterBadges.push({ label: `Age >= ${ageMin}`, clear: () => setAgeMin('') });
  if (ageMax) filterBadges.push({ label: `Age <= ${ageMax}`, clear: () => setAgeMax('') });
  if (filterDateFrom) filterBadges.push({ label: `From: ${filterDateFrom}`, clear: () => setFilterDateFrom('') });
  if (filterDateTo) filterBadges.push({ label: `To: ${filterDateTo}`, clear: () => setFilterDateTo('') });

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Interactive reporting with demographic filtering</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} data-testid="refresh-btn">
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Filters Panel */}
      <Card className="bg-white border-slate-200" data-testid="filters-panel">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Filters
              {filtersActive && <Badge variant="secondary" className="text-xs">{filterBadges.length} active</Badge>}
            </CardTitle>
            {filtersActive && (
              <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={clearFilters} data-testid="clear-all-filters">
                <X className="w-3 h-3 mr-1" /> Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Division multi-select */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Divisions</Label>
              <MultiSelect label="Divisions" options={divisions} selected={selDivisions}
                onChange={(v) => { setSelDivisions(v); setSelDepartments([]); }}
                testId="filter-divisions" />
            </div>
            {/* Department multi-select */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Departments / Subgroups</Label>
              <MultiSelect label="Departments" options={departments} selected={selDepartments}
                onChange={setSelDepartments} testId="filter-departments" />
            </div>
            {/* Race multi-select */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Race</Label>
              <MultiSelect label="Races" options={raceOptions} selected={selRaces}
                onChange={setSelRaces} testId="filter-races" />
            </div>
            {/* Status */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Application Status</Label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === '_all' ? '' : v)}>
                <SelectTrigger className="h-9" data-testid="filter-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Age Range */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Age Min</Label>
              <Input type="number" min={0} max={100} placeholder="e.g. 25" value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)} className="h-9" data-testid="filter-age-min" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Age Max</Label>
              <Input type="number" min={0} max={100} placeholder="e.g. 45" value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)} className="h-9" data-testid="filter-age-max" />
            </div>
            {/* Date Range */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Date From</Label>
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                className="h-9" data-testid="filter-date-from" />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Date To</Label>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                className="h-9" data-testid="filter-date-to" />
            </div>
          </div>

          {/* Active filter badges */}
          {filterBadges.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 mr-1">Active:</span>
              {filterBadges.map((fb, i) => (
                <Badge key={i} variant="secondary" className="text-xs gap-1 cursor-pointer hover:bg-slate-200" onClick={fb.clear}>
                  {fb.label} <X className="w-3 h-3" />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Users', value: data?.users?.total || 0, sub: `${data?.users?.active || 0} active`, icon: Users, color: 'bg-blue-500' },
          { label: 'Bursary Apps', value: data?.bursary_applications?.total || 0, sub: formatCurrency(data?.bursary_applications?.total_amount || 0), icon: FileText, color: 'bg-amber-500' },
          { label: 'Training Apps', value: data?.training_applications?.total || 0, sub: formatCurrency(data?.training_applications?.total_amount || 0), icon: GraduationCap, color: 'bg-purple-500' },
          { label: 'Total Expenses', value: formatCurrency((data?.expenses?.total_application_expenses || 0) + (data?.expenses?.standalone_total || 0)), sub: `${(data?.expenses?.by_applicant || []).length} applicants`, icon: DollarSign, color: 'bg-emerald-500' },
          { label: 'Tickets', value: data?.tickets?.total || 0, sub: `${(data?.tickets?.by_status || []).find(s => s.name === 'open')?.value || 0} open`, icon: Ticket, color: 'bg-rose-500' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="bg-white border-slate-200" data-testid={`summary-${label.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 truncate">{label}</p>
                <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
                <p className="text-xs text-slate-400 truncate">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export bar */}
      <Card className="bg-slate-50 border-slate-200" data-testid="export-bar">
        <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Download className="w-4 h-4" />
            <span>Export filtered data:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'users', 'applications', 'expenses', 'tickets'].map((t) => (
              <Button key={t} variant="outline" size="sm" onClick={() => handleExportFiltered(t)} disabled={exporting}
                data-testid={`export-${t}`}>
                <FileSpreadsheet className="w-4 h-4 mr-1" /> {t === 'all' ? 'All Data' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts - Tabbed */}
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList className="bg-slate-100 p-1" data-testid="report-tabs">
          <TabsTrigger value="demographics" data-testid="tab-demographics">Demographics</TabsTrigger>
          <TabsTrigger value="applications" data-testid="tab-applications">Applications</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
          <TabsTrigger value="tickets" data-testid="tab-tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Users by Division" data={data?.users?.by_division || []} defaultChart="pie" onZoom={setZoomChart} />
            <ChartCard title="Users by Department" data={data?.users?.by_department?.slice(0, 15) || []} defaultChart="horizontal_bar" onZoom={setZoomChart} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Users by Race" data={data?.users?.by_race || []} defaultChart="pie" onZoom={setZoomChart} />
            <ChartCard title="Users by Age Range" data={data?.users?.by_age_range || []} defaultChart="bar" onZoom={setZoomChart} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Active vs Inactive Users"
              data={[{ name: 'Active', value: data?.users?.active || 0 }, { name: 'Inactive', value: data?.users?.inactive || 0 }]}
              defaultChart="donut" onZoom={setZoomChart} />
            <ChartCard title="Users by Role" data={data?.users?.by_role || []} defaultChart="bar" onZoom={setZoomChart} />
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Bursary Applications by Status" data={data?.bursary_applications?.by_status || []} defaultChart="pie" onZoom={setZoomChart} />
            <ChartCard title="Training Applications by Status" data={data?.training_applications?.by_status || []} defaultChart="pie" onZoom={setZoomChart} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Bursary Apps by Division" data={data?.bursary_applications?.by_division || []} defaultChart="bar" onZoom={setZoomChart} />
            <ChartCard title="Training Apps by Division" data={data?.training_applications?.by_division || []} defaultChart="bar" onZoom={setZoomChart} />
          </div>
          {(data?.training_applications?.by_provider || []).length > 0 && (
            <ChartCard title="Training by Service Provider" data={data?.training_applications?.by_provider || []} defaultChart="horizontal_bar" onZoom={setZoomChart} height={280} />
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Expenses by Type" data={data?.expenses?.by_type || []} defaultChart="bar" onZoom={setZoomChart} />
            <ChartCard title="Expenses by Division" data={data?.expenses?.by_division || []} defaultChart="pie" onZoom={setZoomChart} />
          </div>
          {(data?.expenses?.standalone_by_category || []).length > 0 && (
            <ChartCard title="Standalone Expenses by Category" data={data?.expenses?.standalone_by_category || []} defaultChart="donut" onZoom={setZoomChart} />
          )}
          {(data?.expenses?.by_applicant || []).length > 0 && (
            <Card className="bg-white border-slate-200" data-testid="applicant-expense-table">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Expenses by Applicant</CardTitle>
                <Button variant="ghost" size="sm" className="text-emerald-600 h-7"
                  onClick={() => {
                    const d = data.expenses.by_applicant;
                    reportsAPI.exportChart('Expenses by Applicant', d).then(res => {
                      const url = URL.createObjectURL(res.data);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'expenses_by_applicant.xlsx'; a.click(); URL.revokeObjectURL(url);
                      toast.success('Exported');
                    }).catch(() => toast.error('Export failed'));
                  }}
                  data-testid="export-chart-expenses-by-applicant">
                  <Download className="w-3.5 h-3.5 mr-1" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        {['Applicant', 'Type', 'Division', 'Dept', 'Flights', 'Accommodation', 'Car Hire', 'Catering', 'Total'].map(h => (
                          <th key={h} className={`py-2 px-3 text-xs font-semibold text-slate-500 ${['Flights', 'Accommodation', 'Car Hire', 'Catering', 'Total'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.expenses.by_applicant.map((item, i) => (
                        <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                          <td className="py-2 px-3 font-medium">{item.applicant}</td>
                          <td className="py-2 px-3"><Badge variant="outline" className="text-xs capitalize">{item.type}</Badge></td>
                          <td className="py-2 px-3 text-slate-600 text-xs">{item.division}</td>
                          <td className="py-2 px-3 text-slate-600 text-xs">{item.department}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(item.flights)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(item.accommodation)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(item.car_hire)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(item.catering)}</td>
                          <td className="py-2 px-3 text-right font-bold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-semibold">
                        <td className="py-2 px-3" colSpan={8}>Grand Total</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(data.expenses.total_application_expenses)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Tickets by Status" data={data?.tickets?.by_status || []} defaultChart="pie" onZoom={setZoomChart} />
            <ChartCard title="Tickets by Category" data={data?.tickets?.by_category || []} defaultChart="bar" onZoom={setZoomChart} />
            <ChartCard title="Tickets by Priority" data={data?.tickets?.by_priority || []} defaultChart="donut" onZoom={setZoomChart} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Zoom Dialog */}
      <Dialog open={!!zoomChart} onOpenChange={() => setZoomChart(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh]" data-testid="chart-zoom-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {zoomChart?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {zoomChart && <UniversalChart data={zoomChart.data} chartType={zoomChart.chartType} height={500} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;
