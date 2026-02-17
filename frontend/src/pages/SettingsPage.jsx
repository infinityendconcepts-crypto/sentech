import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Settings,
  Mail,
  Video,
  Users,
  Shield,
  Palette,
  Bell,
  Database,
  Plus,
  Edit,
  Trash2,
  Save,
  TestTube,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [newRoleDialog, setNewRoleDialog] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: {} });

  const isAdmin = user?.roles?.includes('admin');

  useEffect(() => {
    fetchSettings();
    fetchRoles();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await settingsAPI.getRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    try {
      await settingsAPI.testSmtp(user.email);
      toast.success('Test email sent (simulated)');
    } catch (error) {
      toast.error('SMTP test failed');
    }
  };

  const handleCreateRole = async () => {
    try {
      await settingsAPI.createRole(newRole);
      toast.success('Role created successfully');
      setNewRoleDialog(false);
      setNewRole({ name: '', description: '', permissions: {} });
      fetchRoles();
    } catch (error) {
      toast.error('Failed to create role');
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const modules = [
    'applications', 'sponsors', 'projects', 'tasks', 'leads', 
    'prospects', 'meetings', 'notes', 'messages', 'team', 
    'tickets', 'expenses', 'reports', 'files', 'settings'
  ];

  const permissions = ['create', 'read', 'update', 'delete'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Settings</h2>
          <p className="text-slate-600 mt-1">Configure system settings and preferences</p>
        </div>
        {isAdmin && (
          <Button onClick={handleSave} disabled={saving} className="gap-2" data-testid="save-settings-btn">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="general" className="gap-2" data-testid="tab-general">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2" data-testid="tab-email">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2" data-testid="tab-meetings">
            <Video className="w-4 h-4" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2" data-testid="tab-roles">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2" data-testid="tab-features">
            <Database className="w-4 h-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2" data-testid="tab-appearance">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={settings?.company_name || ''}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    disabled={!isAdmin}
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings?.timezone || 'Africa/Johannesburg'}
                    onValueChange={(value) => updateSetting('timezone', value)}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings?.currency || 'ZAR'}
                    onValueChange={(value) => updateSetting('currency', value)}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings?.primary_color || '#0056B3'}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      disabled={!isAdmin}
                      className="w-16 h-10 p-1"
                      data-testid="input-primary-color"
                    />
                    <Input
                      value={settings?.primary_color || '#0056B3'}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email/SMTP Settings */}
        <TabsContent value="email">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure email server settings for notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings?.smtp_host || ''}
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    placeholder="smtp.example.com"
                    disabled={!isAdmin}
                    data-testid="input-smtp-host"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings?.smtp_port || 587}
                    onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                    disabled={!isAdmin}
                    data-testid="input-smtp-port"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">SMTP Username</Label>
                  <Input
                    id="smtp_username"
                    value={settings?.smtp_username || ''}
                    onChange={(e) => updateSetting('smtp_username', e.target.value)}
                    disabled={!isAdmin}
                    data-testid="input-smtp-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">SMTP Password</Label>
                  <div className="relative">
                    <Input
                      id="smtp_password"
                      type={showPassword.smtp ? 'text' : 'password'}
                      value={settings?.smtp_password || ''}
                      onChange={(e) => updateSetting('smtp_password', e.target.value)}
                      disabled={!isAdmin}
                      data-testid="input-smtp-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => togglePassword('smtp')}
                    >
                      {showPassword.smtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_email">From Email</Label>
                  <Input
                    id="smtp_from_email"
                    type="email"
                    value={settings?.smtp_from_email || ''}
                    onChange={(e) => updateSetting('smtp_from_email', e.target.value)}
                    placeholder="noreply@example.com"
                    disabled={!isAdmin}
                    data-testid="input-smtp-from-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_name">From Name</Label>
                  <Input
                    id="smtp_from_name"
                    value={settings?.smtp_from_name || 'Sentech Bursary System'}
                    onChange={(e) => updateSetting('smtp_from_name', e.target.value)}
                    disabled={!isAdmin}
                    data-testid="input-smtp-from-name"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="smtp_use_tls"
                    checked={settings?.smtp_use_tls ?? true}
                    onCheckedChange={(checked) => updateSetting('smtp_use_tls', checked)}
                    disabled={!isAdmin}
                  />
                  <Label htmlFor="smtp_use_tls">Use TLS</Label>
                </div>
                {isAdmin && (
                  <Button variant="outline" onClick={handleTestSmtp} className="gap-2" data-testid="test-smtp-btn">
                    <TestTube className="w-4 h-4" />
                    Test SMTP Connection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Integration */}
        <TabsContent value="meetings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Zoom Integration
                </CardTitle>
                <CardDescription>Configure Zoom API credentials for video meetings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zoom_api_key">API Key</Label>
                  <Input
                    id="zoom_api_key"
                    value={settings?.zoom_api_key || ''}
                    onChange={(e) => updateSetting('zoom_api_key', e.target.value)}
                    placeholder="Your Zoom API Key"
                    disabled={!isAdmin}
                    data-testid="input-zoom-api-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zoom_api_secret">API Secret</Label>
                  <div className="relative">
                    <Input
                      id="zoom_api_secret"
                      type={showPassword.zoom ? 'text' : 'password'}
                      value={settings?.zoom_api_secret || ''}
                      onChange={(e) => updateSetting('zoom_api_secret', e.target.value)}
                      placeholder="Your Zoom API Secret"
                      disabled={!isAdmin}
                      data-testid="input-zoom-api-secret"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => togglePassword('zoom')}
                    >
                      {showPassword.zoom ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Get your API credentials from the{' '}
                  <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Zoom Marketplace
                  </a>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-600" />
                  Microsoft Teams Integration
                </CardTitle>
                <CardDescription>Configure Microsoft Teams for video meetings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teams_tenant_id">Tenant ID</Label>
                  <Input
                    id="teams_tenant_id"
                    value={settings?.teams_tenant_id || ''}
                    onChange={(e) => updateSetting('teams_tenant_id', e.target.value)}
                    placeholder="Your Azure Tenant ID"
                    disabled={!isAdmin}
                    data-testid="input-teams-tenant-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teams_client_id">Client ID</Label>
                  <Input
                    id="teams_client_id"
                    value={settings?.teams_client_id || ''}
                    onChange={(e) => updateSetting('teams_client_id', e.target.value)}
                    placeholder="Your Azure Client ID"
                    disabled={!isAdmin}
                    data-testid="input-teams-client-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teams_client_secret">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="teams_client_secret"
                      type={showPassword.teams ? 'text' : 'password'}
                      value={settings?.teams_client_secret || ''}
                      onChange={(e) => updateSetting('teams_client_secret', e.target.value)}
                      placeholder="Your Azure Client Secret"
                      disabled={!isAdmin}
                      data-testid="input-teams-client-secret"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => togglePassword('teams')}
                    >
                      {showPassword.teams ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Configure in the{' '}
                  <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Azure Portal
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Roles & Permissions */}
        <TabsContent value="roles">
          <Card className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage user roles and access permissions</CardDescription>
              </div>
              {isAdmin && (
                <Dialog open={newRoleDialog} onOpenChange={setNewRoleDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" data-testid="add-role-btn">
                      <Plus className="w-4 h-4" />
                      Add Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>Define a new role with specific permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Role Name</Label>
                          <Input
                            value={newRole.name}
                            onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                            placeholder="e.g., team_lead"
                            data-testid="input-new-role-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={newRole.description}
                            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                            placeholder="Role description"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-slate-600 mb-2">
                            <div>Module</div>
                            {permissions.map(p => <div key={p} className="text-center capitalize">{p}</div>)}
                          </div>
                          {modules.slice(0, 8).map(module => (
                            <div key={module} className="grid grid-cols-5 gap-2 py-1 border-t">
                              <div className="text-sm capitalize">{module}</div>
                              {permissions.map(perm => (
                                <div key={perm} className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={newRole.permissions[module]?.includes(perm) || false}
                                    onChange={(e) => {
                                      const modulePerms = newRole.permissions[module] || [];
                                      const updated = e.target.checked
                                        ? [...modulePerms, perm]
                                        : modulePerms.filter(p => p !== perm);
                                      setNewRole({
                                        ...newRole,
                                        permissions: { ...newRole.permissions, [module]: updated }
                                      });
                                    }}
                                    className="w-4 h-4"
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewRoleDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateRole} data-testid="create-role-btn">Create Role</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <Card key={role.id} className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-slate-900 capitalize">{role.name}</h4>
                          {role.is_system && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                        </div>
                        {!role.is_system && isAdmin && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-rose-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(role.permissions || {}).map(([module, perms]) => (
                          <Badge key={module} variant="outline" className="text-xs">
                            {module}: {Array.isArray(perms) ? perms.join(', ') : perms}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Feature Toggles</CardTitle>
              <CardDescription>Enable or disable system modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <div key={module} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <Label htmlFor={`feature-${module}`} className="capitalize cursor-pointer">{module}</Label>
                    <Switch
                      id={`feature-${module}`}
                      checked={settings?.features_enabled?.[module] ?? true}
                      onCheckedChange={(checked) => {
                        updateSetting('features_enabled', {
                          ...settings?.features_enabled,
                          [module]: checked
                        });
                      }}
                      disabled={!isAdmin}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings?.primary_color || '#0056B3'}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      disabled={!isAdmin}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings?.primary_color || '#0056B3'}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company Logo URL</Label>
                  <Input
                    value={settings?.company_logo_url || ''}
                    onChange={(e) => updateSetting('company_logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-2">Preview</h4>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg"
                    style={{ backgroundColor: settings?.primary_color || '#0056B3' }}
                  />
                  <span className="font-heading font-bold text-lg">{settings?.company_name || 'Sentech'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
