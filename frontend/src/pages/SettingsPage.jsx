import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Settings, Mail, Users, Shield, Palette, Bell, Database, Plus, Edit,
  Trash2, Save, Eye, EyeOff, Check, X, LayoutDashboard, FileText,
  GraduationCap, Receipt, Ticket, MessageSquare, Calendar, BookOpen,
  ChevronRight, Lock, Sliders, Building2,
} from 'lucide-react';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'applications', label: 'Bursary Applications', icon: FileText },
  { key: 'training_applications', label: 'Training Applications', icon: GraduationCap },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
  { key: 'tickets', label: 'Tickets', icon: Ticket },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'meetings', label: 'Meetings', icon: Calendar },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'division_groups', label: 'Division Groups', icon: Building2 },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const PERMISSIONS = ['create', 'read', 'update', 'delete'];

const DASHBOARD_WIDGETS = [
  { key: 'applications', label: 'Applications Overview' },
  { key: 'training', label: 'Training Applications' },
  { key: 'expenses', label: 'Expenses Summary' },
  { key: 'users', label: 'Users Overview' },
  { key: 'tickets', label: 'Open Tickets' },
  { key: 'tasks', label: 'Tasks Progress' },
  { key: 'quick_actions', label: 'Quick Actions' },
  { key: 'recent_activity', label: 'Recent Activity' },
];

const SettingsPage = () => {
  const { user, isAdmin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  // RBAC
  const [editingRole, setEditingRole] = useState(null);
  const [newRoleDialog, setNewRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: {} });
  const [savingRole, setSavingRole] = useState(false);

  // Dashboard prefs
  const [dashPrefs, setDashPrefs] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const isSuperAdmin = user?.roles?.includes('super_admin');

  useEffect(() => {
    fetchSettings();
    fetchRoles();
    fetchDashPrefs();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try {
      const res = await settingsAPI.getRoles();
      setRoles(res.data);
    } catch { /* empty */ }
  };

  const fetchDashPrefs = async () => {
    try {
      const res = await settingsAPI.getDashboardPrefs();
      setDashPrefs(res.data);
    } catch { /* empty */ }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const handleSaveRole = async (role) => {
    setSavingRole(true);
    try {
      if (role.id) {
        await settingsAPI.updateRole(role.id, { permissions: role.permissions, description: role.description });
        toast.success('Role updated');
      } else {
        await settingsAPI.createRole({ name: role.name, description: role.description, permissions: role.permissions });
        toast.success('Role created');
      }
      setEditingRole(null);
      setNewRoleDialog(false);
      setNewRole({ name: '', description: '', permissions: {} });
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save role');
    } finally { setSavingRole(false); }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await settingsAPI.deleteRole(roleId);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err) { toast.error(err.response?.data?.detail || 'Cannot delete'); }
  };

  const handleSaveDashPrefs = async () => {
    setSavingPrefs(true);
    try {
      await settingsAPI.updateDashboardPrefs(dashPrefs);
      toast.success('Dashboard preferences saved');
    } catch { toast.error('Failed to save'); } finally { setSavingPrefs(false); }
  };

  const togglePermission = (role, module, perm) => {
    const perms = { ...role.permissions };
    if (!perms[module]) perms[module] = [];
    if (perms[module].includes(perm)) {
      perms[module] = perms[module].filter(p => p !== perm);
    } else {
      perms[module] = [...perms[module], perm];
    }
    return perms;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TABS = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'integrations', label: 'Integrations', icon: Mail },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'rbac', label: 'Roles & Permissions', icon: Shield },
    { key: 'pages', label: 'Page Settings', icon: Sliders },
    { key: 'data', label: 'Data & Storage', icon: Database },
  ];

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage system configuration, roles, and preferences</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Vertical Tab Navigation */}
        <div className="w-56 shrink-0">
          <Card className="bg-white border-slate-200 sticky top-6">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    data-testid={`settings-tab-${key}`}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'bg-[#0056B3] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {activeTab === key && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Company Name</Label>
                    <Input value={settings?.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} className="mt-1" data-testid="company-name" /></div>
                  <div><Label>Tagline</Label>
                    <Input value={settings?.company_tagline || ''} onChange={(e) => setSettings({ ...settings, company_tagline: e.target.value })} className="mt-1" /></div>
                  <div><Label>Company Email</Label>
                    <Input value={settings?.company_email || ''} onChange={(e) => setSettings({ ...settings, company_email: e.target.value })} className="mt-1" /></div>
                  <div><Label>Company Phone</Label>
                    <Input value={settings?.company_phone || ''} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} className="mt-1" /></div>
                  <div><Label>Timezone</Label>
                    <Select value={settings?.timezone || 'Africa/Johannesburg'} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div><Label>Currency</Label>
                    <Select value={settings?.currency || 'ZAR'} onValueChange={(v) => setSettings({ ...settings, currency: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ZAR">ZAR (R)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select></div>
                </div>
                <div><Label>Company Address</Label>
                  <Textarea value={settings?.company_address || ''} onChange={(e) => setSettings({ ...settings, company_address: e.target.value })} className="mt-1" rows={2} /></div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={saving} className="gap-2" data-testid="save-general">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <Card className="bg-white border-slate-200">
              <CardHeader><CardTitle>Branding & Appearance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Primary Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={settings?.primary_color || '#0056B3'} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-10 h-10 rounded border" />
                      <Input value={settings?.primary_color || '#0056B3'} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="flex-1" />
                    </div></div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integrations (SMTP + Teams) */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <Card className="bg-white border-slate-200">
                <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> SMTP Email Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>SMTP Host</Label><Input value={settings?.smtp_host || ''} onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })} className="mt-1" data-testid="smtp-host" /></div>
                    <div><Label>SMTP Port</Label><Input type="number" value={settings?.smtp_port || 587} onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })} className="mt-1" /></div>
                    <div><Label>Username</Label><Input value={settings?.smtp_username || ''} onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })} className="mt-1" /></div>
                    <div><Label>Password</Label>
                      <div className="relative mt-1"><Input type={showPassword.smtp ? 'text' : 'password'} value={settings?.smtp_password || ''} onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })} className="pr-10" />
                        <button className="absolute right-3 top-3" onClick={() => setShowPassword({ ...showPassword, smtp: !showPassword.smtp })}>{showPassword.smtp ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}</button>
                      </div></div>
                    <div><Label>From Email</Label><Input value={settings?.smtp_from_email || ''} onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })} className="mt-1" /></div>
                    <div><Label>From Name</Label><Input value={settings?.smtp_from_name || ''} onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div className="flex justify-end"><Button onClick={handleSaveSettings} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> Save</Button></div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-200">
                <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Microsoft Teams</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tenant ID</Label><Input value={settings?.teams_tenant_id || ''} onChange={(e) => setSettings({ ...settings, teams_tenant_id: e.target.value })} className="mt-1" data-testid="teams-tenant" /></div>
                    <div><Label>Client ID</Label><Input value={settings?.teams_client_id || ''} onChange={(e) => setSettings({ ...settings, teams_client_id: e.target.value })} className="mt-1" /></div>
                    <div><Label>Client Secret</Label>
                      <div className="relative mt-1"><Input type={showPassword.teams ? 'text' : 'password'} value={settings?.teams_client_secret || ''} onChange={(e) => setSettings({ ...settings, teams_client_secret: e.target.value })} className="pr-10" />
                        <button className="absolute right-3 top-3" onClick={() => setShowPassword({ ...showPassword, teams: !showPassword.teams })}>{showPassword.teams ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}</button>
                      </div></div>
                    <div><Label>Webhook URL</Label><Input value={settings?.teams_webhook_url || ''} onChange={(e) => setSettings({ ...settings, teams_webhook_url: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div className="flex justify-end"><Button onClick={handleSaveSettings} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> Save</Button></div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card className="bg-white border-slate-200">
              <CardHeader><CardTitle>Notification Settings</CardTitle><CardDescription>Configure how notifications are delivered</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'email_notifications', label: 'Email Notifications', desc: 'Send email alerts for important events' },
                  { key: 'sound_notifications', label: 'Sound Notifications', desc: 'Play sound when new notifications arrive' },
                  { key: 'ticket_notifications', label: 'Ticket Status Changes', desc: 'Notify when ticket status is updated' },
                  { key: 'application_notifications', label: 'Application Updates', desc: 'Notify on application status changes' },
                  { key: 'meeting_notifications', label: 'Meeting Reminders', desc: 'Send reminders before scheduled meetings' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div><p className="font-medium text-sm text-slate-900">{label}</p><p className="text-xs text-slate-500">{desc}</p></div>
                    <Switch checked={settings?.features_enabled?.[key] ?? true} onCheckedChange={(v) => setSettings({ ...settings, features_enabled: { ...settings?.features_enabled, [key]: v } })} data-testid={`switch-${key}`} />
                  </div>
                ))}
                <div className="flex justify-end"><Button onClick={handleSaveSettings} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> Save</Button></div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Customization */}
          {activeTab === 'dashboard' && (
            <Card className="bg-white border-slate-200">
              <CardHeader><CardTitle>Dashboard Customization</CardTitle><CardDescription>Choose which widgets appear on your dashboard</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {DASHBOARD_WIDGETS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <Checkbox
                        checked={dashPrefs?.visible_widgets?.includes(key) ?? true}
                        onCheckedChange={(checked) => {
                          const current = dashPrefs?.visible_widgets || DASHBOARD_WIDGETS.map(w => w.key);
                          setDashPrefs({
                            ...dashPrefs,
                            visible_widgets: checked ? [...current, key] : current.filter(k => k !== key),
                          });
                        }}
                        data-testid={`widget-${key}`}
                      />
                      <Label className="cursor-pointer text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveDashPrefs} disabled={savingPrefs} className="gap-2" data-testid="save-dash-prefs">
                    <Save className="w-4 h-4" /> {savingPrefs ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Roles & Permissions (Advanced RBAC) */}
          {activeTab === 'rbac' && (
            <div className="space-y-6">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#0056B3]" /> Roles & Permissions</CardTitle>
                      <CardDescription>Manage role-based access control for all system modules</CardDescription>
                    </div>
                    {(isAdmin || isSuperAdmin) && (
                      <Button onClick={() => setNewRoleDialog(true)} className="gap-2" data-testid="add-role-btn">
                        <Plus className="w-4 h-4" /> New Role
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roles.map(role => (
                      <div key={role.id} className="border border-slate-200 rounded-lg overflow-hidden" data-testid={`role-${role.name}`}>
                        <div className="flex items-center justify-between p-4 bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#0056B3]/10 rounded-full flex items-center justify-center">
                              <Shield className="w-4 h-4 text-[#0056B3]" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 capitalize">{role.name.replace('_', ' ')}</h4>
                              <p className="text-xs text-slate-500">{role.description || 'No description'}</p>
                            </div>
                            {role.is_system && <Badge variant="outline" className="text-xs">System</Badge>}
                          </div>
                          <div className="flex gap-2">
                            {(isAdmin || isSuperAdmin) && (
                              <Button variant="outline" size="sm" onClick={() => setEditingRole({ ...role })} data-testid={`edit-role-${role.name}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {!role.is_system && (isAdmin || isSuperAdmin) && (
                              <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteRole(role.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Permission matrix */}
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 pr-4 text-slate-600 font-medium">Module</th>
                                  {PERMISSIONS.map(p => (
                                    <th key={p} className="text-center py-2 px-3 text-slate-600 font-medium capitalize">{p}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {MODULES.map(({ key, label, icon: Icon }) => (
                                  <tr key={key} className="border-b border-slate-100">
                                    <td className="py-2 pr-4 flex items-center gap-2">
                                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-slate-700">{label}</span>
                                    </td>
                                    {PERMISSIONS.map(perm => (
                                      <td key={perm} className="text-center py-2 px-3">
                                        {role.permissions?.[key]?.includes(perm) ? (
                                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                                        ) : (
                                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Page Settings */}
          {activeTab === 'pages' && (
            <Card className="bg-white border-slate-200">
              <CardHeader><CardTitle>Page Settings</CardTitle><CardDescription>Configure visibility and defaults for each page module</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {MODULES.filter(m => m.key !== 'settings').map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="font-medium text-sm text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">Enable or disable this module</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings?.page_settings?.[key]?.enabled !== false}
                      onCheckedChange={(v) => {
                        const ps = { ...settings?.page_settings };
                        ps[key] = { ...ps[key], enabled: v };
                        setSettings({ ...settings, page_settings: ps });
                      }}
                      data-testid={`page-toggle-${key}`}
                    />
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveSettings} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> Save Page Settings</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data & Storage */}
          {activeTab === 'data' && (
            <Card className="bg-white border-slate-200">
              <CardHeader><CardTitle>Data & Storage</CardTitle><CardDescription>Database and storage configuration</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Database Status</p>
                    <div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /><span className="text-sm text-emerald-600">Connected</span></div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700">Storage</p>
                    <p className="text-sm text-slate-500 mt-1">MongoDB on local instance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => { if (!open) setEditingRole(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0056B3]" />
              Edit Role: {editingRole?.name?.replace('_', ' ')}
            </DialogTitle>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4">
              <div><Label>Description</Label>
                <Input value={editingRole.description || ''} onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })} className="mt-1" data-testid="edit-role-description" /></div>
              <div>
                <Label className="text-base font-semibold">Permissions Matrix</Label>
                <p className="text-xs text-slate-500 mb-3">Toggle permissions for each module</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 border-b">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Module</th>
                      {PERMISSIONS.map(p => (<th key={p} className="text-center py-3 px-4 font-medium text-slate-600 capitalize">{p}</th>))}
                      <th className="text-center py-3 px-4 font-medium text-slate-600">All</th>
                    </tr></thead>
                    <tbody>
                      {MODULES.map(({ key, label, icon: Icon }) => (
                        <tr key={key} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2.5 px-4 flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-slate-400" /><span>{label}</span></td>
                          {PERMISSIONS.map(perm => (
                            <td key={perm} className="text-center py-2.5 px-4">
                              <Checkbox
                                checked={editingRole.permissions?.[key]?.includes(perm) || false}
                                onCheckedChange={() => {
                                  setEditingRole({ ...editingRole, permissions: togglePermission(editingRole, key, perm) });
                                }}
                                data-testid={`perm-${key}-${perm}`}
                              />
                            </td>
                          ))}
                          <td className="text-center py-2.5 px-4">
                            <Checkbox
                              checked={PERMISSIONS.every(p => editingRole.permissions?.[key]?.includes(p))}
                              onCheckedChange={(checked) => {
                                const perms = { ...editingRole.permissions };
                                perms[key] = checked ? [...PERMISSIONS] : [];
                                setEditingRole({ ...editingRole, permissions: perms });
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
            <Button onClick={() => handleSaveRole(editingRole)} disabled={savingRole} className="gap-2" data-testid="save-role-btn">
              <Save className="w-4 h-4" /> {savingRole ? 'Saving...' : 'Save Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Role Dialog */}
      <Dialog open={newRoleDialog} onOpenChange={setNewRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create New Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Role Name</Label><Input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} className="mt-1" placeholder="e.g. team_lead" data-testid="new-role-name" /></div>
            <div><Label>Description</Label><Input value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} className="mt-1" placeholder="Role description" data-testid="new-role-desc" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRoleDialog(false)}>Cancel</Button>
            <Button onClick={() => handleSaveRole(newRole)} disabled={savingRole || !newRole.name} className="gap-2" data-testid="create-role-btn">
              <Plus className="w-4 h-4" /> Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
