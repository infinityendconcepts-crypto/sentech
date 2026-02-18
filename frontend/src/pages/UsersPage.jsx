import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI } from '../services/api';
import {
  Users, Search, Plus, MoreVertical, Shield, ShieldOff,
  Trash2, UserCog, Mail, Phone, Building2, CheckCircle,
  XCircle, Clock, UserCheck, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['admin', 'student'];

const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-700 border-red-200';
    case 'student': return 'bg-blue-100 text-blue-700 border-blue-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

const ROLE_DESCRIPTIONS = {
  admin: 'Full system access — can manage users, settings, reports, leads, and all modules.',
  student: 'Standard access — dashboard, applications, tasks, meetings, notes, tickets and personal profile.',
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-amber-500',
];

const getAvatarColor = (email) => {
  const idx = (email || '').charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [createDialog, setCreateDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }
  const [selectedUser, setSelectedUser] = useState(null);
  const [createForm, setCreateForm] = useState({ email: '', full_name: '', role: 'student', password: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const isAdmin = currentUser?.roles?.includes('admin');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || (u.roles || []).includes(filterRole);
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? u.is_active !== false : u.is_active === false);
    return matchSearch && matchRole && matchStatus;
  });

  const handleCreate = async () => {
    if (!createForm.email.trim()) { toast.error('Email is required'); return; }
    if (!createForm.password || createForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (createForm.password !== createForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await usersAPI.create({ email: createForm.email, full_name: createForm.full_name, role: createForm.role, password: createForm.password });
      toast.success(`User ${createForm.email} created successfully`);
      setCreateDialog(false);
      setCreateForm({ email: '', full_name: '', role: 'student', password: '', confirmPassword: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, newRoles) => {
    try {
      await usersAPI.changeRole(userId, newRoles);
      toast.success('Role updated');
      fetchUsers();
      setRoleDialog(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      if (isActive) {
        await usersAPI.deactivate(userId);
        toast.success('User deactivated');
      } else {
        await usersAPI.activate(userId);
        toast.success('User activated');
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = async (userId, name) => {
    setSaving(true);
    try {
      await usersAPI.delete(userId);
      toast.success(`${name} deleted`);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active !== false).length,
    admins: users.filter(u => (u.roles || []).includes('admin')).length,
    managers: users.filter(u => (u.roles || []).includes('manager')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Users</h2>
          <p className="text-slate-600 mt-1">Manage system users and permissions</p>
        </div>
        {isManager && (
          <Button className="gap-2" onClick={() => setInviteDialog(true)} data-testid="invite-user-btn">
            <Plus className="w-4 h-4" />
            Invite User
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Managers', value: stats.managers, icon: UserCog, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="bg-white border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="users-search"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40" data-testid="filter-role">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="filter-status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredUsers.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors" data-testid={`user-row-${u.id}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 ${getAvatarColor(u.email)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-sm font-semibold">{getInitials(u.full_name || u.email)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">{u.full_name || 'Unnamed'}</span>
                      {u.id === currentUser?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                      {u.is_active === false && (
                        <Badge className="bg-slate-100 text-slate-500 text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{u.email}
                      </span>
                      {u.department && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{u.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1 min-w-[120px]">
                    {(u.roles || ['employee']).map(r => (
                      <Badge key={r} className={`${getRoleColor(r)} text-xs`}>{r}</Badge>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1 w-24">
                    {u.is_active !== false ? (
                      <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-sm text-emerald-600">Active</span></>
                    ) : (
                      <><XCircle className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Inactive</span></>
                    )}
                  </div>

                  {/* Joined */}
                  <div className="text-xs text-slate-400 w-24 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </div>

                  {/* Actions */}
                  {isManager && u.id !== currentUser?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8" data-testid={`user-actions-${u.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isAdmin && (
                          <DropdownMenuItem onClick={() => { setSelectedUser(u); setRoleDialog(true); }}>
                            <UserCog className="w-4 h-4 mr-2" />Change Role
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(u.id, u.is_active !== false)}
                        >
                          {u.is_active !== false ? (
                            <><ShieldOff className="w-4 h-4 mr-2" />Deactivate</>
                          ) : (
                            <><Shield className="w-4 h-4 mr-2" />Activate</>
                          )}
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(u.id, u.full_name || u.email)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input
                placeholder="John Smith"
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                data-testid="invite-name"
              />
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                data-testid="invite-email"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">The user will receive a one-time login code to access the system. They can set their password after first login.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={saving} data-testid="confirm-invite-btn">
              {saving ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {selectedUser?.full_name || selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {ROLES.map(r => (
              <button
                key={r}
                className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                  (selectedUser?.roles || []).includes(r)
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => handleRoleChange(selectedUser?.id, [r])}
                data-testid={`role-option-${r}`}
              >
                <div className="flex items-center gap-3">
                  <Badge className={`${getRoleColor(r)} text-xs`}>{r}</Badge>
                  <span className="text-sm text-slate-700">
                    {r === 'admin' && 'Full system access'}
                    {r === 'manager' && 'Manage users and content'}
                    {r === 'employee' && 'Standard access'}
                    {r === 'viewer' && 'Read-only access'}
                  </span>
                </div>
                {(selectedUser?.roles || []).includes(r) && <CheckCircle className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
