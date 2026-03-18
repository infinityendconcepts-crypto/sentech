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
  Upload, Download, FileSpreadsheet,
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
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '', surname: '', email: '',
    division: '', department: '', position: '', role: '', level: '',
    personnel_number: '', id_number: '', gender: '', race: '', age: '',
    start_date: '', years_of_service: '',
    ofo_major_group: '', ofo_sub_major_group: '', ofo_occupation: '', ofo_code: '',
    phone: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Import state
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

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
      full_name: user.full_name || '',
      surname: user.surname || '',
      email: user.email || '',
      division: user.division || '',
      department: user.department || '',
      position: user.position || '',
      role: user.roles?.[0] || 'employee',
      level: user.level || '',
      personnel_number: user.personnel_number || '',
      id_number: user.id_number || '',
      gender: user.gender || '',
      race: user.race || '',
      age: user.age || '',
      start_date: user.start_date || '',
      years_of_service: user.years_of_service || '',
      ofo_major_group: user.ofo_major_group || '',
      ofo_sub_major_group: user.ofo_sub_major_group || '',
      ofo_occupation: user.ofo_occupation || '',
      ofo_code: user.ofo_code || '',
      phone: user.phone || '',
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
      const payload = {
        full_name: editForm.full_name || undefined,
        surname: editForm.surname || undefined,
        email: editForm.email || undefined,
        division: editForm.division,
        department: editForm.department,
        position: editForm.position,
        roles: [editForm.role],
        level: editForm.level || undefined,
        personnel_number: editForm.personnel_number || undefined,
        id_number: editForm.id_number || undefined,
        gender: editForm.gender || undefined,
        race: editForm.race || undefined,
        age: editForm.age ? parseInt(editForm.age) : undefined,
        start_date: editForm.start_date || undefined,
        years_of_service: editForm.years_of_service ? parseFloat(editForm.years_of_service) : undefined,
        ofo_major_group: editForm.ofo_major_group || undefined,
        ofo_sub_major_group: editForm.ofo_sub_major_group || undefined,
        ofo_occupation: editForm.ofo_occupation || undefined,
        ofo_code: editForm.ofo_code || undefined,
        phone: editForm.phone || undefined,
      };
      // Remove undefined values
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      await usersAPI.update(selectedUser.id, payload);
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
    const matchDepartment = filterDepartment === 'all' || u.department === filterDepartment;
    const matchRole = filterRole === 'all' || (u.roles || []).includes(filterRole);
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? u.is_active !== false : u.is_active === false);
    const matchGender = filterGender === 'all' || u.gender?.toLowerCase() === filterGender.toLowerCase();
    return matchSearch && matchDepartment && matchRole && matchStatus && matchGender;
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

  const handleDownloadTemplate = async () => {
    try {
      const res = await usersAPI.downloadImportTemplate();
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_import_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
  };

  const handleImportUsers = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fileName = importFile.name.toLowerCase();
      let users = [];

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse XLSX using a simple approach - read as array buffer
        const arrayBuffer = await importFile.arrayBuffer();
        // Use a simple XLSX parser via backend
        const formData = new FormData();
        formData.append('file', importFile);
        // Fall back to CSV parsing for now, inform user
        toast.error('Please use CSV format for import. Download the template and save as CSV.');
        setImporting(false);
        return;
      }

      // CSV parsing
      const text = await importFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        toast.error('File must have a header row and at least one data row');
        setImporting(false);
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        if (row.email) users.push(row);
      }
      if (!users.length) {
        toast.error('No valid user rows found');
        setImporting(false);
        return;
      }
      const res = await usersAPI.bulkImport(users);
      setImportResult(res.data);
      toast.success(res.data.message || 'Import completed');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterDepartment('all');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterGender('all');
  };

  const hasActiveFilters = search || filterDepartment !== 'all' || filterRole !== 'all' || filterStatus !== 'all' || filterGender !== 'all';

  // Get unique values for stats
  const uniqueDepartmentsInUsers = [...new Set(users.map(u => u.department).filter(Boolean))].sort();
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active !== false).length,
    departments: uniqueDepartmentsInUsers.length,
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
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleDownloadTemplate} data-testid="download-template-btn">
              <Download className="w-4 h-4" />
              Template
            </Button>
            <Button className="gap-2" onClick={() => { setImportDialog(true); setImportFile(null); setImportResult(null); }} data-testid="import-users-btn">
              <Upload className="w-4 h-4" />
              Import Users
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Departments', value: stats.departments, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
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
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-52" data-testid="filter-department">
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartmentsInUsers.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Division</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Department</th>
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

                      {/* Division */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{u.division || '-'}</div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700">{u.department || '-'}</div>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
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

              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} data-testid="edit-full-name" />
                  </div>
                  <div className="space-y-1">
                    <Label>Surname</Label>
                    <Input value={editForm.surname} onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })} data-testid="edit-surname" />
                  </div>
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} data-testid="edit-email" />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+27 XX XXX XXXX" data-testid="edit-phone" />
                  </div>
                  <div className="space-y-1">
                    <Label>ID Number</Label>
                    <Input value={editForm.id_number} onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })} data-testid="edit-id-number" />
                  </div>
                  <div className="space-y-1">
                    <Label>Gender</Label>
                    <Select value={editForm.gender || 'none'} onValueChange={(v) => setEditForm({ ...editForm, gender: v === 'none' ? '' : v })}>
                      <SelectTrigger data-testid="edit-gender"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Not Set --</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Race</Label>
                    <Select value={editForm.race || 'none'} onValueChange={(v) => setEditForm({ ...editForm, race: v === 'none' ? '' : v })}>
                      <SelectTrigger data-testid="edit-race"><SelectValue placeholder="Select Race" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Not Set --</SelectItem>
                        <SelectItem value="African">African</SelectItem>
                        <SelectItem value="Coloured">Coloured</SelectItem>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="White">White</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Age</Label>
                    <Input type="number" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} data-testid="edit-age" />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Employment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Personnel Number</Label>
                    <Input value={editForm.personnel_number} onChange={(e) => setEditForm({ ...editForm, personnel_number: e.target.value })} data-testid="edit-personnel-number" />
                  </div>
                  <div className="space-y-1">
                    <Label>Division</Label>
                    <Select value={editForm.division || 'none'} onValueChange={(v) => handleDivisionChange(v === 'none' ? '' : v)}>
                      <SelectTrigger data-testid="edit-division"><SelectValue placeholder="Select Division" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No Division --</SelectItem>
                        {divisions.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Department</Label>
                    <Select value={editForm.department || 'none'} onValueChange={(v) => setEditForm({ ...editForm, department: v === 'none' ? '' : v })}>
                      <SelectTrigger data-testid="edit-department"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No Department --</SelectItem>
                        {departments.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Or enter new department" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="mt-1" data-testid="edit-department-input" />
                  </div>
                  <div className="space-y-1">
                    <Label>Position</Label>
                    <Input value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} data-testid="edit-position" />
                  </div>
                  <div className="space-y-1">
                    <Label>Level</Label>
                    <Input value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} placeholder="e.g. C3, D1" data-testid="edit-level" />
                  </div>
                  <div className="space-y-1">
                    <Label>Start Date</Label>
                    <Input value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} placeholder="e.g. 2020-01-15" data-testid="edit-start-date" />
                  </div>
                  <div className="space-y-1">
                    <Label>Years of Service</Label>
                    <Input type="number" step="0.1" value={editForm.years_of_service} onChange={(e) => setEditForm({ ...editForm, years_of_service: e.target.value })} data-testid="edit-years-of-service" />
                  </div>
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                      <SelectTrigger data-testid="edit-role"><SelectValue placeholder="Select Role" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => (
                          <SelectItem key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* OFO Classification */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">OFO Classification</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Major Group</Label>
                    <Input value={editForm.ofo_major_group} onChange={(e) => setEditForm({ ...editForm, ofo_major_group: e.target.value })} data-testid="edit-ofo-major" />
                  </div>
                  <div className="space-y-1">
                    <Label>Sub Major Group</Label>
                    <Input value={editForm.ofo_sub_major_group} onChange={(e) => setEditForm({ ...editForm, ofo_sub_major_group: e.target.value })} data-testid="edit-ofo-sub-major" />
                  </div>
                  <div className="space-y-1">
                    <Label>Occupation</Label>
                    <Input value={editForm.ofo_occupation} onChange={(e) => setEditForm({ ...editForm, ofo_occupation: e.target.value })} data-testid="edit-ofo-occupation" />
                  </div>
                  <div className="space-y-1">
                    <Label>OFO Code</Label>
                    <Input value={editForm.ofo_code} onChange={(e) => setEditForm({ ...editForm, ofo_code: e.target.value })} data-testid="edit-ofo-code" />
                  </div>
                </div>
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

      {/* Import Users Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Import Users from CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Upload a CSV file with user data. 
                <button onClick={handleDownloadTemplate} className="underline font-medium ml-1" data-testid="download-template-dialog-btn">
                  Download the template
                </button> to see the required format.
              </p>
            </div>

            <div>
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                  {importFile ? (
                    <div>
                      <p className="text-sm font-medium text-slate-900">{importFile.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Click to select CSV file</p>
                  )}
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleImportFile}
                  data-testid="csv-upload-input"
                />
              </Label>
            </div>

            {importResult && (
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium text-slate-900">Import Results:</p>
                <p className="text-sm text-emerald-600">Imported: {importResult.imported}</p>
                <p className="text-sm text-amber-600">Skipped (duplicates): {importResult.skipped}</p>
                {importResult.errors?.length > 0 && (
                  <p className="text-sm text-red-600">Errors: {importResult.errors.length}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialog(false)}>Close</Button>
            <Button
              onClick={handleImportUsers}
              disabled={importing || !importFile}
              className="gap-2"
              data-testid="confirm-import-btn"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
