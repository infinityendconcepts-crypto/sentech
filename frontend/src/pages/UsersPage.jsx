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
import { usersAPI, divisionsAPI, departmentsAPI } from '../services/api';
import {
  Users, Search, MoreVertical, Shield, ShieldOff,
  Trash2, Mail, Building2, CheckCircle, XCircle, UserCheck,
  Briefcase, Calendar, Hash, X, Eye, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['super_admin', 'manager', 'professional', 'technician', 'clerical', 'employee'];

const getRoleColor = (role) => {
  switch (role) {
    case 'super_admin': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'admin': return 'bg-red-100 text-red-700 border-red-200';
    case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'professional': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'technician': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'clerical': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
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
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ division: '', department: '', position: '', role: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser?.roles?.includes('admin') || currentUser?.roles?.includes('super_admin');

  useEffect(() => { 
    fetchUsers();
    fetchDivisions();
    fetchAllDepartments();
  }, []);

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

  const fetchDivisions = async () => {
    try {
      const res = await divisionsAPI.getAll();
      const uniqueDivisions = [...new Set(res.data.map(d => d.name))].sort();
      setDivisions(uniqueDivisions);
    } catch {
      console.error('Failed to load divisions');
    }
  };

  const fetchAllDepartments = async () => {
    try {
      const res = await departmentsAPI.getAll();
      setAllDepartments(res.data);
    } catch {
      console.error('Failed to load departments');
    }
  };

  const fetchDepartmentsForDivision = (divisionName) => {
    // Get unique department names for the selected division from users
    const deptNames = [...new Set(
      users
        .filter(u => u.division === divisionName && u.department)
        .map(u => u.department)
    )].sort();
    setDepartments(deptNames);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditForm({
      division: user.division || '',
      department: user.department || '',
      position: user.position || '',
      role: user.roles?.[0] || 'employee',
    });
    if (user.division) {
      fetchDepartmentsForDivision(user.division);
    }
    setEditDialog(true);
  };

  const handleDivisionChange = (value) => {
    setEditForm({ ...editForm, division: value, department: '' });
    fetchDepartmentsForDivision(value);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await usersAPI.update(selectedUser.id, {
        division: editForm.division,
        department: editForm.department,
        position: editForm.position,
        roles: [editForm.role],
      });
      toast.success('User updated successfully');
      setEditDialog(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase()) ||
      u.position?.toLowerCase().includes(search.toLowerCase()) ||
      u.personnel_number?.toLowerCase().includes(search.toLowerCase());
    const matchDivision = filterDivision === 'all' || u.division === filterDivision;
    const matchRole = filterRole === 'all' || (u.roles || []).includes(filterRole);
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? u.is_active !== false : u.is_active === false);
    const matchGender = filterGender === 'all' || u.gender?.toLowerCase() === filterGender.toLowerCase();
    return matchSearch && matchDivision && matchRole && matchStatus && matchGender;
  });

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

  const clearFilters = () => {
    setSearch('');
    setFilterDivision('all');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterGender('all');
  };

  const hasActiveFilters = search || filterDivision !== 'all' || filterRole !== 'all' || filterStatus !== 'all' || filterGender !== 'all';

  // Get unique values for stats
  const uniqueDivisionsInUsers = [...new Set(users.map(u => u.division).filter(Boolean))];
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active !== false).length,
    divisions: uniqueDivisionsInUsers.length,
    needsSetup: users.filter(u => u.requires_password_setup).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Users</h2>
          <p className="text-slate-600 mt-1">Manage organization users and view employee details</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Divisions', value: stats.divisions, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Pending Setup', value: stats.needsSetup, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
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
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, department, position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="users-search"
                />
              </div>
              <Select value={filterDivision} onValueChange={setFilterDivision}>
                <SelectTrigger className="w-52" data-testid="filter-division">
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="All Divisions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40" data-testid="filter-role">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="w-32" data-testid="filter-gender">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gender</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Filters active:</span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                  <X className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-y border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Division / Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors" data-testid={`user-row-${u.id}`}>
                      {/* Employee Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${getAvatarColor(u.email)} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-sm font-semibold">{getInitials(u.full_name || u.email)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 truncate">{u.full_name || 'Unnamed'}</span>
                              {u.id === currentUser?.id && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{u.email}</span>
                            </div>
                            {u.personnel_number && (
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Hash className="w-3 h-3" />
                                <span>{u.personnel_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Division / Department */}
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">{u.division || '-'}</div>
                          <div className="text-slate-500">{u.department || '-'}</div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700">{u.position || '-'}</div>
                        {u.level && (
                          <div className="text-xs text-slate-400">Level: {u.level}</div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles || ['employee']).map(r => (
                            <Badge key={r} className={`${getRoleColor(r)} text-xs`}>
                              {r.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {u.is_active !== false ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-sm text-emerald-600">Active</span></>
                          ) : (
                            <><XCircle className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Inactive</span></>
                          )}
                        </div>
                        {u.requires_password_setup && (
                          <div className="text-xs text-amber-600 mt-1">Needs password setup</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`user-actions-${u.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => { setSelectedUser(u); setViewDialog(true); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => openEditDialog(u)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                            )}
                            {isAdmin && u.id !== currentUser?.id && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleStatus(u.id, u.is_active !== false)}>
                                  {u.is_active !== false ? (
                                    <><ShieldOff className="w-4 h-4 mr-2" />Deactivate</>
                                  ) : (
                                    <><Shield className="w-4 h-4 mr-2" />Activate</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => setDeleteConfirm({ id: u.id, name: u.full_name || u.email })}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-12 h-12 ${getAvatarColor(selectedUser?.email)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-lg font-semibold">{getInitials(selectedUser?.full_name)}</span>
              </div>
              <div>
                <div className="text-xl">{selectedUser?.full_name}</div>
                <div className="text-sm text-slate-500 font-normal">{selectedUser?.email}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.full_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Surname</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.surname || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ID Number</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.id_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Gender</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Race</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.race || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Age</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.age || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Employment Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-slate-500">Personnel Number</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.personnel_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Division</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.division || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Position</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.position || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Level</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.level || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.start_date || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Years of Service</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.years_of_service ? `${selectedUser.years_of_service} years` : '-'}</p>
                  </div>
                </div>
              </div>

              {/* OFO Classification */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  OFO Classification
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-slate-500">OFO Major Group</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.ofo_major_group || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">OFO Sub Major Group</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.ofo_sub_major_group || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">OFO Occupation</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.ofo_occupation || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">OFO Code</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.ofo_code || '-'}</p>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  System Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-slate-500">Role(s)</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedUser.roles || ['employee']).map(r => (
                        <Badge key={r} className={`${getRoleColor(r)} text-xs`}>
                          {r.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <div className="flex items-center gap-1 mt-1">
                      {selectedUser.is_active !== false ? (
                        <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Password Setup</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedUser.requires_password_setup ? 'Pending' : 'Complete'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.name)} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Pencil className="w-5 h-5 text-primary" />
              Edit User
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info Header */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={`w-10 h-10 ${getAvatarColor(selectedUser.email)} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-semibold">{getInitials(selectedUser.full_name)}</span>
                </div>
                <div>
                  <div className="font-medium text-slate-900">{selectedUser.full_name}</div>
                  <div className="text-sm text-slate-500">{selectedUser.email}</div>
                </div>
              </div>

              {/* Division Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-division">Division</Label>
                <Select value={editForm.division || 'none'} onValueChange={(v) => handleDivisionChange(v === 'none' ? '' : v)}>
                  <SelectTrigger id="edit-division" data-testid="edit-division">
                    <SelectValue placeholder="Select Division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Division --</SelectItem>
                    {divisions.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select 
                  value={editForm.department || 'none'} 
                  onValueChange={(v) => setEditForm({ ...editForm, department: v === 'none' ? '' : v })}
                >
                  <SelectTrigger id="edit-department" data-testid="edit-department">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Department --</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editForm.division && departments.length === 0 && (
                  <p className="text-xs text-slate-500">No departments found for this division. You can type a new one below.</p>
                )}
                <Input
                  placeholder="Or enter new department name"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="mt-2"
                  data-testid="edit-department-input"
                />
              </div>

              {/* Position Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  placeholder="Enter position/job title"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  data-testid="edit-position"
                />
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger id="edit-role" data-testid="edit-role">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r}>
                        {r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving} data-testid="save-user-btn">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
