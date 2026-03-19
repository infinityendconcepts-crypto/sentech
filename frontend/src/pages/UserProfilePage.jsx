import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, documentsAPI, applicationsAPI, trainingApplicationsAPI } from '../services/api';
import {
  User, Mail, Phone, Building2, Lock, Save,
  Shield, Camera, CheckCircle, Eye, EyeOff,
  Upload, FileText, CheckCircle2, XCircle, Clock,
  Trash2, RefreshCw, GraduationCap, BookOpen,
  Edit, AlertTriangle, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-700';
    case 'manager': return 'bg-purple-100 text-purple-700';
    case 'employee': return 'bg-blue-100 text-blue-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-amber-500',
];

const getAvatarColor = (email) => {
  const idx = (email || '').charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
};

const UserProfilePage = () => {
  const { user: authUser, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const reuploadRef = useRef(null);
  const [reuploadDocId, setReuploadDocId] = useState(null);
  const [docForm, setDocForm] = useState({ name: '', document_type: 'general' });

  // Applications state
  const [bursaryApps, setBursaryApps] = useState([]);
  const [trainingApps, setTrainingApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [reEditDialog, setReEditDialog] = useState(null);
  const [reEditReason, setReEditReason] = useState('');
  const [requestingReEdit, setRequestingReEdit] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    department: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getMe();
      setProfile(res.data);
      setForm({
        full_name: res.data.full_name || '',
        phone: res.data.phone || '',
        department: res.data.department || '',
        bio: res.data.bio || '',
      });
    } catch {
      if (authUser) {
        setProfile(authUser);
        setForm({
          full_name: authUser.full_name || '',
          phone: authUser.phone || '',
          department: authUser.department || '',
          bio: authUser.bio || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!profile?.id) return;
    setDocsLoading(true);
    try {
      const res = await documentsAPI.getAll(profile.id);
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const [bRes, tRes] = await Promise.all([
        applicationsAPI.getAll(),
        trainingApplicationsAPI.getAll(),
      ]);
      const userId = authUser?.id;
      const allBursary = Array.isArray(bRes.data) ? bRes.data : [];
      const allTraining = Array.isArray(tRes.data) ? tRes.data : [];
      setBursaryApps(allBursary.filter(a => a.user_id === userId));
      setTrainingApps(allTraining.filter(a => a.user_id === userId));
    } catch {
      setBursaryApps([]);
      setTrainingApps([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const isWithin24Hours = (submittedAt) => {
    if (!submittedAt) return true;
    const submitted = new Date(submittedAt);
    const now = new Date();
    return (now - submitted) < 86400000; // 24hrs in ms
  };

  const getTimeRemaining = (submittedAt) => {
    if (!submittedAt) return '';
    const submitted = new Date(submittedAt);
    const deadline = new Date(submitted.getTime() + 86400000);
    const now = new Date();
    const remaining = deadline - now;
    if (remaining <= 0) return 'Expired';
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h ${mins}m remaining`;
  };

  const handleRequestReEdit = async () => {
    if (!reEditDialog) return;
    setRequestingReEdit(true);
    try {
      const api = reEditDialog.type === 'bursary' ? applicationsAPI : trainingApplicationsAPI;
      await api.requestReEdit(reEditDialog.id, reEditReason);
      toast.success('Re-edit request submitted. An admin will review your request.');
      setReEditDialog(null);
      setReEditReason('');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setRequestingReEdit(false);
    }
  };

  const handleFileUpload = async (e, reuploadId = null) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return; }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target.result;
        const payload = {
          name: docForm.name || file.name,
          file_name: file.name,
          file_data: base64,
          document_type: docForm.document_type,
        };

        if (reuploadId) {
          // Delete old doc and upload new
          await documentsAPI.delete(profile.id, reuploadId);
        }
        await documentsAPI.upload(profile.id, payload);
        toast.success(reuploadId ? 'Document re-uploaded successfully' : 'Document uploaded successfully');
        setDocForm({ name: '', document_type: 'general' });
        setReuploadDocId(null);
        fetchDocuments();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to upload document');
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!profile?.id) return;
    try {
      await documentsAPI.delete(profile.id, docId);
      toast.success('Document removed');
      fetchDocuments();
    } catch {
      toast.error('Failed to remove document');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 gap-1"><CheckCircle2 className="w-3 h-3" />Approved</Badge>;
      case 'rejected': return <Badge className="bg-rose-100 text-rose-700 gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 gap-1"><Clock className="w-3 h-3" />Processing</Badge>;
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await usersAPI.updateMe(form);
      setProfile(res.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.new_password) { toast.error('New password is required'); return; }
    if (passwordForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match'); return;
    }
    setChangingPwd(true);
    try {
      await usersAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPwd(false);
    }
  };

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarBg = getAvatarColor(profile?.email || '');

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-24 h-24 ${avatarBg} rounded-full flex items-center justify-center`}>
                <span className="text-white text-3xl font-bold">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border-2 border-slate-200 flex items-center justify-center">
                <Camera className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-slate-900">{profile?.full_name || 'Your Name'}</h2>
                {(profile?.roles || []).map(r => (
                  <Badge key={r} className={`${getRoleColor(r)} text-xs`}>{r}</Badge>
                ))}
              </div>
              <p className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4" />{profile?.email}
              </p>
              {profile?.department && (
                <p className="text-slate-500 flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4" />{profile.department}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {profile?.is_active !== false ? (
                <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-sm text-emerald-600 font-medium">Active Account</span></>
              ) : (
                <><Shield className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-500">Inactive</span></>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="applications" onClick={fetchApplications}>My Applications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="documents" onClick={fetchDocuments}>Documents</TabsTrigger>
          <TabsTrigger value="activity">Account Info</TabsTrigger>
        </TabsList>

        {/* Profile Info Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Editable Info */}
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label>Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        className="pl-10"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Your full name"
                        data-testid="profile-name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input className="pl-10 bg-slate-50" value={profile?.email || ''} disabled />
                    </div>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        className="pl-10"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+27 XX XXX XXXX"
                        data-testid="profile-phone"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        className="pl-10"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        placeholder="e.g. Finance, HR"
                        data-testid="profile-department"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Bio</Label>
                  <Textarea
                    className="mt-1"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                    data-testid="profile-bio"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2" data-testid="save-profile-btn">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details (from dataset - read-only) */}
            {(profile?.surname || profile?.id_number || profile?.gender || profile?.race || profile?.age) && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Personal Details</CardTitle>
                  <CardDescription>Information imported from HR records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Surname', value: profile?.surname },
                      { label: 'ID Number', value: profile?.id_number },
                      { label: 'Gender', value: profile?.gender },
                      { label: 'Race', value: profile?.race },
                      { label: 'Age', value: profile?.age },
                    ].filter(f => f.value).map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Employment Information (from dataset - read-only) */}
            {(profile?.personnel_number || profile?.division || profile?.position || profile?.level || profile?.start_date) && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">Employment Information</CardTitle>
                  <CardDescription>Information from HR records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Personnel Number', value: profile?.personnel_number },
                      { label: 'Division', value: profile?.division },
                      { label: 'Department', value: profile?.department },
                      { label: 'Position', value: profile?.position },
                      { label: 'Level', value: profile?.level },
                      { label: 'Start Date', value: profile?.start_date },
                      { label: 'Years of Service', value: profile?.years_of_service ? `${profile.years_of_service} years` : null },
                    ].filter(f => f.value).map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* OFO Classification (from dataset - read-only) */}
            {(profile?.ofo_major_group || profile?.ofo_code) && (
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">OFO Classification</CardTitle>
                  <CardDescription>Organising Framework for Occupations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Major Group', value: profile?.ofo_major_group },
                      { label: 'Sub Major Group', value: profile?.ofo_sub_major_group },
                      { label: 'Occupation', value: profile?.ofo_occupation },
                      { label: 'OFO Code', value: profile?.ofo_code },
                    ].filter(f => f.value).map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* My Applications Tab */}
        <TabsContent value="applications">
          <div className="space-y-6">
            {appsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Bursary Applications */}
                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#0056B3]" />
                      Bursary Applications
                    </CardTitle>
                    <CardDescription>Your bursary application submissions and their statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bursaryApps.length === 0 ? (
                      <div className="text-center py-10">
                        <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No bursary applications yet</p>
                        <Button variant="outline" className="mt-3 gap-2" onClick={() => navigate('/applications')}>
                          <FileText className="w-4 h-4" /> Go to Bursary Applications
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bursaryApps.map(app => {
                          const canEdit = app.status === 'draft' || (isWithin24Hours(app.submitted_at) && !['approved', 'rejected'].includes(app.status));
                          const editExpired = !canEdit && !['approved', 'rejected', 'draft'].includes(app.status);
                          const reEditPending = app.re_edit_requested && !app.re_edit_approved;
                          const reEditApproved = app.re_edit_approved;
                          return (
                            <div key={app.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors" data-testid={`bursary-app-${app.id}`}>
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-5 h-5 text-[#0056B3]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 text-sm">
                                  {app.personal_info?.full_name || app.academic_bursary_info?.institution_name || 'Bursary Application'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : app.created_at ? new Date(app.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>
                                {canEdit && app.submitted_at && app.status !== 'draft' && (
                                  <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Edit window: {getTimeRemaining(app.submitted_at)}
                                  </p>
                                )}
                                {reEditPending && (
                                  <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Re-edit request pending approval
                                  </p>
                                )}
                                {reEditApproved && (
                                  <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Re-edit approved — you can now edit
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <AppStatusBadge status={app.status} />
                                {(canEdit || reEditApproved) && (
                                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => navigate(`/applications/${app.id}/edit`)} data-testid={`edit-bursary-${app.id}`}>
                                    <Edit className="w-3 h-3" /> Edit
                                  </Button>
                                )}
                                {editExpired && !reEditPending && !reEditApproved && (
                                  <Button variant="outline" size="sm" className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={() => setReEditDialog({ id: app.id, type: 'bursary', title: 'Bursary Application' })} data-testid={`request-reedit-bursary-${app.id}`}>
                                    <Send className="w-3 h-3" /> Request Re-edit
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Training Applications */}
                <Card className="bg-white border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      Training Applications
                    </CardTitle>
                    <CardDescription>Your training application submissions and their statuses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trainingApps.length === 0 ? (
                      <div className="text-center py-10">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No training applications yet</p>
                        <Button variant="outline" className="mt-3 gap-2" onClick={() => navigate('/training-applications')}>
                          <FileText className="w-4 h-4" /> Go to Training Applications
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trainingApps.map(app => {
                          const canEdit = app.status === 'draft' || (isWithin24Hours(app.submitted_at) && !['approved', 'rejected'].includes(app.status));
                          const editExpired = !canEdit && !['approved', 'rejected', 'draft'].includes(app.status);
                          const reEditPending = app.re_edit_requested && !app.re_edit_approved;
                          const reEditApproved = app.re_edit_approved;
                          return (
                            <div key={app.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors" data-testid={`training-app-${app.id}`}>
                              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 text-sm">
                                  {app.training_info?.training_type || app.training_info?.service_provider || 'Training Application'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : app.created_at ? new Date(app.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>
                                {canEdit && app.submitted_at && app.status !== 'draft' && (
                                  <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Edit window: {getTimeRemaining(app.submitted_at)}
                                  </p>
                                )}
                                {reEditPending && (
                                  <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Re-edit request pending approval
                                  </p>
                                )}
                                {reEditApproved && (
                                  <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Re-edit approved — you can now edit
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <AppStatusBadge status={app.status} />
                                {(canEdit || reEditApproved) && (
                                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => navigate(`/training-applications/${app.id}/edit`)} data-testid={`edit-training-${app.id}`}>
                                    <Edit className="w-3 h-3" /> Edit
                                  </Button>
                                )}
                                {editExpired && !reEditPending && !reEditApproved && (
                                  <Button variant="outline" size="sm" className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={() => setReEditDialog({ id: app.id, type: 'training', title: 'Training Application' })} data-testid={`request-reedit-training-${app.id}`}>
                                    <Send className="w-3 h-3" /> Request Re-edit
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label>Current Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type={showCurrentPwd ? 'text' : 'password'}
                    className="pl-10 pr-10"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Current password"
                    data-testid="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type={showNewPwd ? 'text' : 'password'}
                    className="pl-10 pr-10"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="Min. 8 characters"
                    data-testid="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
                {passwordForm.new_password.length > 0 && passwordForm.new_password.length < 8 && (
                  <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
                )}
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    className="pl-10"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="Repeat new password"
                    data-testid="confirm-password"
                  />
                </div>
                {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPwd || passwordForm.new_password.length < 8 || passwordForm.new_password !== passwordForm.confirm_password}
                className="gap-2 w-full"
                data-testid="change-password-btn"
              >
                <Lock className="w-4 h-4" />
                {changingPwd ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
              <CardDescription>Upload and manage your application documents. Re-upload rejected documents below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Upload Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">Upload New Document</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Document Name</Label>
                    <Input
                      className="mt-1"
                      placeholder="e.g. ID Document, Matric Certificate"
                      value={docForm.name}
                      onChange={e => setDocForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Document Type</Label>
                    <select
                      className="mt-1 w-full h-9 border border-slate-200 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      value={docForm.document_type}
                      onChange={e => setDocForm(f => ({ ...f, document_type: e.target.value }))}
                    >
                      <option value="general">General</option>
                      <option value="id">ID Document</option>
                      <option value="academic">Academic Transcript</option>
                      <option value="financial">Financial Statement</option>
                      <option value="proof_of_residence">Proof of Residence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e)}
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Choose File & Upload'}
                </Button>
                <p className="text-xs text-slate-400">Supported: PDF, DOC, DOCX, JPG, PNG. Max 5MB.</p>
              </div>

              {/* Documents List */}
              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={reuploadRef}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, reuploadDocId)}
                  />
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{doc.document_type?.replace(/_/g, ' ')} · Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-ZA') : 'N/A'}</p>
                        {doc.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{doc.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(doc.status)}
                        {doc.status === 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                            onClick={() => { setReuploadDocId(doc.id); setTimeout(() => reuploadRef.current?.click(), 50); }}
                          >
                            <RefreshCw className="w-3 h-3" /> Re-upload
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-rose-600"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Info Tab */}
        <TabsContent value="activity">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'User ID', value: profile?.id || 'N/A' },
                    { label: 'Account Status', value: profile?.is_active !== false ? 'Active' : 'Inactive' },
                    { label: 'Email Verified', value: profile?.is_verified ? 'Yes' : 'No' },
                    { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
                    { label: 'Last Updated', value: profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Assigned Roles</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.roles || ['employee']).map(r => (
                      <Badge key={r} className={`${getRoleColor(r)}`}>{r}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Re-edit Request Dialog */}
      <Dialog open={!!reEditDialog} onOpenChange={(open) => { if (!open) { setReEditDialog(null); setReEditReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Request Re-edit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              The 24-hour edit window for your <strong>{reEditDialog?.title}</strong> has expired. You can request an admin to re-enable editing.
            </p>
            <div>
              <Label>Reason for re-edit</Label>
              <Textarea
                data-testid="re-edit-reason-input"
                placeholder="Please explain why you need to edit this application..."
                value={reEditReason}
                onChange={(e) => setReEditReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReEditDialog(null); setReEditReason(''); }}>Cancel</Button>
            <Button
              data-testid="submit-re-edit-request"
              onClick={handleRequestReEdit}
              disabled={requestingReEdit || !reEditReason.trim()}
              className="bg-[#0056B3] hover:bg-[#004494] gap-2"
            >
              {requestingReEdit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AppStatusBadge = ({ status }) => {
  const config = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-300' },
    pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-300' },
    submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 border-blue-300' },
    under_review: { label: 'Under Review', className: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
    approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-300' },
    completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  };
  const c = config[status] || { label: status || 'Unknown', className: 'bg-slate-100 text-slate-600 border-slate-300' };
  return <Badge variant="outline" className={`text-xs ${c.className}`} data-testid={`status-badge-${status}`}>{c.label}</Badge>;
};

export default UserProfilePage;
