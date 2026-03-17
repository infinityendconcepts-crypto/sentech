import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { divisionGroupsAPI, subgroupsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Search, Users, UserPlus, UserMinus, Crown, Building2,
  ChevronDown, ChevronUp, Shield, Mail, Briefcase,
  FolderPlus, Pencil, Trash2, Layers, Clock, X,
} from 'lucide-react';

const DURATION_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '2 Hours', hours: 2 },
  { label: '4 Hours', hours: 4 },
  { label: '8 Hours', hours: 8 },
  { label: '1 Day', hours: 24 },
  { label: '2 Days', hours: 48 },
  { label: '3 Days', hours: 72 },
  { label: '1 Week', hours: 168 },
  { label: '2 Weeks', hours: 336 },
];

function timeRemaining(endStr) {
  if (!endStr) return null;
  const end = new Date(endStr);
  const now = new Date();
  const diff = end - now;
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const rHours = hours % 24;
    return `${days}d ${rHours}h`;
  }
  return `${hours}h ${mins}m`;
}

const DivisionGroupsPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes('super_admin');
  const isTechSupport = currentUser?.division === 'Technical Support';
  const canManage = isAdmin || isSuperAdmin || isTechSupport;

  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);

  const [leaderDialog, setLeaderDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [addMemberDialog, setAddMemberDialog] = useState(false);

  const [createSubgroupDialog, setCreateSubgroupDialog] = useState(false);
  const [newSubgroupName, setNewSubgroupName] = useState('');
  const [renameSubgroupDialog, setRenameSubgroupDialog] = useState(false);
  const [selectedSubgroup, setSelectedSubgroup] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [subgroupLeaderDialog, setSubgroupLeaderDialog] = useState(false);
  const [subgroupLeaderId, setSubgroupLeaderId] = useState('');
  const [addSubgroupMemberDialog, setAddSubgroupMemberDialog] = useState(false);
  const [expandedSubgroup, setExpandedSubgroup] = useState(null);

  // JIT Temp Leader
  const [tempLeaderDialog, setTempLeaderDialog] = useState(false);
  const [tempLeaderId, setTempLeaderId] = useState('');
  const [tempDuration, setTempDuration] = useState('');

  useEffect(() => { fetchGroups(); fetchAllUsers(); }, []);

  const fetchGroups = async () => {
    try { const res = await divisionGroupsAPI.getAll(); setGroups(res.data); }
    catch { toast.error('Failed to load division groups'); }
    finally { setLoading(false); }
  };

  const fetchAllUsers = async () => {
    try { const res = await usersAPI.getAll(); setAllUsers(res.data); }
    catch (err) { console.error(err); }
  };

  const handleSetLeader = async () => {
    if (!selectedGroup) return;
    try {
      await divisionGroupsAPI.setLeader(selectedGroup.division_name, selectedLeaderId === 'none' ? null : selectedLeaderId);
      toast.success(`Leader updated for ${selectedGroup.division_name}`);
      setLeaderDialog(false); fetchGroups();
    } catch { toast.error('Failed to set leader'); }
  };

  const handleAddMember = async (userId) => {
    if (!selectedGroup) return;
    try {
      await divisionGroupsAPI.addMember(selectedGroup.division_name, userId);
      toast.success('Member added'); setAddMemberDialog(false); fetchGroups(); fetchAllUsers();
    } catch { toast.error('Failed to add member'); }
  };

  const handleRemoveMember = async (divisionName, userId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try { await divisionGroupsAPI.removeMember(divisionName, userId); toast.success('Member removed'); fetchGroups(); fetchAllUsers(); }
    catch { toast.error('Failed to remove member'); }
  };

  const handleCreateSubgroup = async () => {
    if (!selectedGroup || !newSubgroupName.trim()) return;
    try {
      await divisionGroupsAPI.createSubgroup(selectedGroup.division_name, { name: newSubgroupName.trim() });
      toast.success('Subgroup created'); setCreateSubgroupDialog(false); setNewSubgroupName(''); fetchGroups();
    } catch { toast.error('Failed to create subgroup'); }
  };

  const handleRenameSubgroup = async () => {
    if (!selectedSubgroup || !renameValue.trim()) return;
    try { await subgroupsAPI.update(selectedSubgroup.id, { name: renameValue.trim() }); toast.success('Subgroup renamed'); setRenameSubgroupDialog(false); fetchGroups(); }
    catch { toast.error('Failed to rename'); }
  };

  const handleDeleteSubgroup = async (sgId) => {
    if (!window.confirm('Delete this subgroup?')) return;
    try { await subgroupsAPI.delete(sgId); toast.success('Subgroup deleted'); fetchGroups(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleSetSubgroupLeader = async () => {
    if (!selectedSubgroup) return;
    try {
      await subgroupsAPI.update(selectedSubgroup.id, { leader_id: subgroupLeaderId === 'none' ? null : subgroupLeaderId });
      toast.success('Subgroup leader updated'); setSubgroupLeaderDialog(false); fetchGroups();
    } catch { toast.error('Failed to set leader'); }
  };

  const handleAddSubgroupMember = async (userId) => {
    if (!selectedSubgroup) return;
    try { await subgroupsAPI.addMember(selectedSubgroup.id, userId); toast.success('Member added to subgroup'); setAddSubgroupMemberDialog(false); fetchGroups(); fetchAllUsers(); }
    catch { toast.error('Failed to add member'); }
  };

  const handleRemoveSubgroupMember = async (sgId, userId) => {
    if (!window.confirm('Remove this member from the subgroup?')) return;
    try { await subgroupsAPI.removeMember(sgId, userId); toast.success('Member removed'); fetchGroups(); }
    catch { toast.error('Failed to remove'); }
  };

  // JIT Temp Leader handlers
  const handleAssignTempLeader = async () => {
    if (!selectedSubgroup || !tempLeaderId || !tempDuration) return;
    try {
      await subgroupsAPI.assignTempLeader(selectedSubgroup.id, {
        temp_leader_id: tempLeaderId,
        duration_hours: parseFloat(tempDuration),
      });
      toast.success('Temporary leader assigned');
      setTempLeaderDialog(false); setTempLeaderId(''); setTempDuration(''); fetchGroups();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to assign temporary leader';
      toast.error(msg);
    }
  };

  const handleRevokeTempLeader = async (sgId) => {
    if (!window.confirm('Revoke the temporary leader assignment?')) return;
    try { await subgroupsAPI.revokeTempLeader(sgId); toast.success('Temporary leader revoked'); fetchGroups(); }
    catch { toast.error('Failed to revoke'); }
  };

  const canAssignTemp = (sg) => {
    if (canManage) return true;
    return sg?.leader_id === currentUser?.id;
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(g =>
      g.division_name.toLowerCase().includes(term) ||
      g.members?.some(m => m.full_name?.toLowerCase().includes(term) || m.email?.toLowerCase().includes(term)) ||
      g.subgroups?.some(sg => sg.name?.toLowerCase().includes(term))
    );
  }, [groups, searchTerm]);

  const availableUsersForAdd = useMemo(() => {
    if (!selectedGroup) return allUsers;
    const memberIds = new Set(selectedGroup.members?.map(m => m.id) || []);
    return allUsers.filter(u => !memberIds.has(u.id));
  }, [allUsers, selectedGroup]);

  const totalMembers = groups.reduce((sum, g) => sum + g.member_count, 0);
  const totalSubgroups = groups.reduce((sum, g) => sum + (g.subgroups?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="division-groups-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0056B3]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="division-groups-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Division Groups</h2>
          <p className="text-slate-600 mt-1">Manage organizational divisions, subgroups and their members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={Building2} color="bg-[#0056B3]/10" iconColor="text-[#0056B3]" value={groups.length} label="Divisions" testId="stat-total-divisions" />
        <StatCard icon={Users} color="bg-emerald-50" iconColor="text-emerald-600" value={totalMembers} label="Total Members" testId="stat-total-members" />
        <StatCard icon={Crown} color="bg-amber-50" iconColor="text-amber-600" value={groups.filter(g => g.leader_id).length} label="Leaders Assigned" testId="stat-leaders-assigned" />
        <StatCard icon={Layers} color="bg-violet-50" iconColor="text-violet-600" value={totalSubgroups} label="Subgroups" testId="stat-total-subgroups" />
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Search divisions, subgroups or members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="search-division-groups" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No division groups found</h3>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <GroupCard
              key={group.division_id}
              group={group}
              expanded={expandedGroup === group.division_name}
              expandedSubgroup={expandedSubgroup}
              onToggle={() => setExpandedGroup(expandedGroup === group.division_name ? null : group.division_name)}
              onToggleSubgroup={(sgId) => setExpandedSubgroup(expandedSubgroup === sgId ? null : sgId)}
              canManage={canManage}
              canAssignTemp={canAssignTemp}
              onSetLeader={() => { setSelectedGroup(group); setSelectedLeaderId(group.leader_id || ''); setLeaderDialog(true); }}
              onAddMember={() => { setSelectedGroup(group); setAddMemberDialog(true); }}
              onRemoveMember={(userId) => handleRemoveMember(group.division_name, userId)}
              onCreateSubgroup={() => { setSelectedGroup(group); setNewSubgroupName(''); setCreateSubgroupDialog(true); }}
              onRenameSubgroup={(sg) => { setSelectedSubgroup(sg); setRenameValue(sg.name); setRenameSubgroupDialog(true); }}
              onDeleteSubgroup={(sgId) => handleDeleteSubgroup(sgId)}
              onSetSubgroupLeader={(sg) => { setSelectedSubgroup(sg); setSubgroupLeaderId(sg.leader_id || ''); setSubgroupLeaderDialog(true); }}
              onAddSubgroupMember={(sg) => { setSelectedSubgroup(sg); setAddSubgroupMemberDialog(true); }}
              onRemoveSubgroupMember={(sgId, userId) => handleRemoveSubgroupMember(sgId, userId)}
              onAssignTempLeader={(sg) => { setSelectedSubgroup(sg); setTempLeaderId(''); setTempDuration(''); setTempLeaderDialog(true); }}
              onRevokeTempLeader={(sgId) => handleRevokeTempLeader(sgId)}
            />
          ))
        )}
      </div>

      {/* Set Division Leader Dialog */}
      <Dialog open={leaderDialog} onOpenChange={setLeaderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Leader — {selectedGroup?.division_name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Select Leader</Label>
            <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
              <SelectTrigger data-testid="select-leader-trigger"><SelectValue placeholder="Choose a member" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Leader</SelectItem>
                {selectedGroup?.members?.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name} — {m.position || m.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaderDialog(false)}>Cancel</Button>
            <Button onClick={handleSetLeader} className="bg-[#0056B3] hover:bg-[#004494]" data-testid="confirm-set-leader-btn">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Division Member Dialog */}
      <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Member — {selectedGroup?.division_name}</DialogTitle></DialogHeader>
          <UserSearchList users={availableUsersForAdd} onSelect={handleAddMember} />
          <DialogFooter><Button variant="outline" onClick={() => setAddMemberDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subgroup Dialog */}
      <Dialog open={createSubgroupDialog} onOpenChange={setCreateSubgroupDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Subgroup — {selectedGroup?.division_name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Subgroup Name</Label>
            <Input value={newSubgroupName} onChange={e => setNewSubgroupName(e.target.value)} placeholder="e.g., Reporting to the CEO" data-testid="input-subgroup-name" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSubgroupDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSubgroup} className="bg-[#0056B3] hover:bg-[#004494]" data-testid="confirm-create-subgroup-btn">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Subgroup Dialog */}
      <Dialog open={renameSubgroupDialog} onOpenChange={setRenameSubgroupDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Subgroup</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>New Name</Label>
            <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} data-testid="input-rename-subgroup" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameSubgroupDialog(false)}>Cancel</Button>
            <Button onClick={handleRenameSubgroup} className="bg-[#0056B3] hover:bg-[#004494]" data-testid="confirm-rename-subgroup-btn">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subgroup Leader Dialog */}
      <Dialog open={subgroupLeaderDialog} onOpenChange={setSubgroupLeaderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Leader — {selectedSubgroup?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Select Leader</Label>
            <Select value={subgroupLeaderId} onValueChange={setSubgroupLeaderId}>
              <SelectTrigger data-testid="select-subgroup-leader-trigger"><SelectValue placeholder="Choose a member" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Leader</SelectItem>
                {selectedSubgroup?.members?.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubgroupLeaderDialog(false)}>Cancel</Button>
            <Button onClick={handleSetSubgroupLeader} className="bg-[#0056B3] hover:bg-[#004494]" data-testid="confirm-subgroup-leader-btn">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Subgroup Member Dialog */}
      <Dialog open={addSubgroupMemberDialog} onOpenChange={setAddSubgroupMemberDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Member — {selectedSubgroup?.name}</DialogTitle></DialogHeader>
          <UserSearchList users={allUsers.filter(u => !selectedSubgroup?.member_user_ids?.includes(u.id))} onSelect={handleAddSubgroupMember} />
          <DialogFooter><Button variant="outline" onClick={() => setAddSubgroupMemberDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JIT Temporary Leader Dialog */}
      <Dialog open={tempLeaderDialog} onOpenChange={setTempLeaderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Assign Temporary Leader — {selectedSubgroup?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Temporary Leader</Label>
              <Select value={tempLeaderId} onValueChange={setTempLeaderId}>
                <SelectTrigger data-testid="select-temp-leader-trigger"><SelectValue placeholder="Choose a member" /></SelectTrigger>
                <SelectContent>
                  {selectedSubgroup?.members?.filter(m => m.id !== selectedSubgroup?.leader_id).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name} — {m.position || m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={tempDuration} onValueChange={setTempDuration}>
                <SelectTrigger data-testid="select-temp-duration"><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => (
                    <SelectItem key={d.hours} value={String(d.hours)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
              <Clock className="w-4 h-4 inline mr-1" />
              The temporary leader will have leadership access for the selected duration. After expiry, the original leader resumes automatically.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTempLeaderDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAssignTempLeader}
              disabled={!tempLeaderId || !tempDuration}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="confirm-assign-temp-leader-btn"
            >
              <Clock className="w-4 h-4 mr-1" /> Assign Temp Leader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------- StatCard ---------- */
const StatCard = ({ icon: Icon, color, iconColor, value, label, testId }) => (
  <Card className="bg-white border-slate-200">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
      <div>
        <p className="text-2xl font-bold text-slate-900" data-testid={testId}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </CardContent>
  </Card>
);

/* ---------- UserSearchList ---------- */
const UserSearchList = ({ users, onSelect }) => {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const list = !q ? users : users.filter(u => u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()));
    return list.slice(0, 20);
  }, [users, q]);
  return (
    <div className="space-y-3">
      <Input placeholder="Search users..." value={q} onChange={e => setQ(e.target.value)} data-testid="search-add-member" />
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filtered.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">No users found</p> : filtered.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8"><AvatarFallback className="text-xs bg-[#0056B3]/10 text-[#0056B3]">{u.full_name?.charAt(0)}</AvatarFallback></Avatar>
              <div>
                <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                <p className="text-xs text-slate-500">{u.division || 'Unassigned'} — {u.email}</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-[#0056B3]" onClick={() => onSelect(u.id)} data-testid={`add-user-${u.id}`}><UserPlus className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------- GroupCard ---------- */
const GroupCard = ({
  group, expanded, expandedSubgroup, onToggle, onToggleSubgroup, canManage, canAssignTemp,
  onSetLeader, onAddMember, onRemoveMember,
  onCreateSubgroup, onRenameSubgroup, onDeleteSubgroup,
  onSetSubgroupLeader, onAddSubgroupMember, onRemoveSubgroupMember,
  onAssignTempLeader, onRevokeTempLeader,
}) => {
  const leader = group.leader;
  const members = group.members || [];
  const subgroups = group.subgroups || [];
  return (
    <Card className="bg-white border-slate-200 overflow-hidden" data-testid={`group-card-${group.division_name}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={onToggle} data-testid={`group-toggle-${group.division_name}`}>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#0056B3] flex items-center justify-center text-white font-bold text-lg">{group.division_name.charAt(0)}</div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{group.division_name}</h3>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> {group.member_count} members</span>
              {leader ? <span className="text-xs text-amber-600 flex items-center gap-1"><Crown className="w-3 h-3" /> {leader.full_name}</span> : <span className="text-xs text-slate-400">No leader assigned</span>}
              {subgroups.length > 0 && <span className="text-xs text-violet-600 flex items-center gap-1"><Layers className="w-3 h-3" /> {subgroups.length} subgroup{subgroups.length > 1 ? 's' : ''}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={e => { e.stopPropagation(); onSetLeader(); }} data-testid={`set-leader-btn-${group.division_name}`}><Shield className="w-3 h-3" /> Leader</Button>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={e => { e.stopPropagation(); onAddMember(); }} data-testid={`add-member-btn-${group.division_name}`}><UserPlus className="w-3 h-3" /> Add</Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 text-violet-600 border-violet-200 hover:bg-violet-50" onClick={e => { e.stopPropagation(); onCreateSubgroup(); }} data-testid={`create-subgroup-btn-${group.division_name}`}><FolderPlus className="w-3 h-3" /> Subgroup</Button>
            </>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-100">
          {subgroups.length > 0 && (
            <div className="bg-violet-50/40 border-b border-slate-100">
              <div className="px-4 py-2"><p className="text-xs font-semibold text-violet-700 uppercase tracking-wide flex items-center gap-1"><Layers className="w-3 h-3" /> Subgroups</p></div>
              {subgroups.map(sg => (
                <SubgroupSection key={sg.id} sg={sg} expanded={expandedSubgroup === sg.id} onToggle={() => onToggleSubgroup(sg.id)} canManage={canManage} canAssignTemp={canAssignTemp(sg)}
                  onRename={() => onRenameSubgroup(sg)} onDelete={() => onDeleteSubgroup(sg.id)} onSetLeader={() => onSetSubgroupLeader(sg)} onAddMember={() => onAddSubgroupMember(sg)} onRemoveMember={(userId) => onRemoveSubgroupMember(sg.id, userId)}
                  onAssignTempLeader={() => onAssignTempLeader(sg)} onRevokeTempLeader={() => onRevokeTempLeader(sg.id)}
                />
              ))}
            </div>
          )}
          <div className="bg-slate-50/50">
            <div className="px-4 py-2 border-b border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Division Members ({members.length})</p></div>
            {members.length === 0 ? <div className="p-6 text-center text-sm text-slate-500">No members in this division</div> : (
              <div className="divide-y divide-slate-100">
                {members.map(member => <MemberRow key={member.id} member={member} isLeader={group.leader_id === member.id} canManage={canManage} onRemove={() => onRemoveMember(member.id)} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

/* ---------- SubgroupSection ---------- */
const SubgroupSection = ({ sg, expanded, onToggle, canManage, canAssignTemp, onRename, onDelete, onSetLeader, onAddMember, onRemoveMember, onAssignTempLeader, onRevokeTempLeader }) => {
  const members = sg.members || [];
  const hasTempLeader = sg.temp_leader_active && sg.temp_leader;
  const remaining = timeRemaining(sg.temp_leader_end);

  return (
    <div className="border-t border-violet-100/60" data-testid={`subgroup-${sg.id}`}>
      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-violet-50 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">{sg.name?.charAt(0)}</div>
          <div>
            <span className="text-sm font-medium text-slate-900">{sg.name}</span>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">{members.length} members</span>
              {sg.leader && <span className="text-xs text-amber-600 flex items-center gap-1"><Crown className="w-3 h-3" /> {sg.leader.full_name}</span>}
              {hasTempLeader && remaining && (
                <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0 gap-1" data-testid={`temp-leader-badge-${sg.id}`}>
                  <Clock className="w-3 h-3" /> Acting: {sg.temp_leader.full_name} ({remaining})
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canManage && (
            <>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500" onClick={e => { e.stopPropagation(); onRename(); }} title="Rename" data-testid={`rename-subgroup-${sg.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500" onClick={e => { e.stopPropagation(); onSetLeader(); }} title="Set Leader" data-testid={`subgroup-leader-btn-${sg.id}`}><Shield className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500" onClick={e => { e.stopPropagation(); onAddMember(); }} title="Add Member" data-testid={`subgroup-add-member-${sg.id}`}><UserPlus className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-500" onClick={e => { e.stopPropagation(); onDelete(); }} title="Delete" data-testid={`delete-subgroup-${sg.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
            </>
          )}
          {canAssignTemp && (
            hasTempLeader ? (
              <Button size="sm" variant="ghost" className="h-7 px-1.5 text-orange-600 hover:bg-orange-50 text-[10px] gap-0.5" onClick={e => { e.stopPropagation(); onRevokeTempLeader(); }} title="Revoke Temp Leader" data-testid={`revoke-temp-${sg.id}`}>
                <X className="w-3 h-3" /> Revoke
              </Button>
            ) : (
              <Button size="sm" variant="ghost" className="h-7 px-1.5 text-orange-500 hover:bg-orange-50 text-[10px] gap-0.5" onClick={e => { e.stopPropagation(); onAssignTempLeader(); }} title="Assign Temp Leader" data-testid={`assign-temp-${sg.id}`}>
                <Clock className="w-3 h-3" /> JIT
              </Button>
            )
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className="bg-white/60">
          {hasTempLeader && remaining && (
            <div className="mx-4 my-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 flex items-center justify-between" data-testid={`temp-leader-banner-${sg.id}`}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-800">
                  <strong>{sg.temp_leader.full_name}</strong> is acting as temporary leader
                </span>
              </div>
              <Badge className="bg-orange-200 text-orange-800 text-xs">{remaining} remaining</Badge>
            </div>
          )}
          {members.length === 0 ? <div className="px-4 py-4 text-center text-sm text-slate-500">No members in this subgroup</div> : (
            <div className="divide-y divide-slate-100">
              {members.map(m => (
                <MemberRow key={m.id} member={m} isLeader={sg.leader_id === m.id} isTempLeader={hasTempLeader && sg.temp_leader_id === m.id} canManage={canManage} onRemove={() => onRemoveMember(m.id)} indent />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- MemberRow ---------- */
const MemberRow = ({ member, isLeader, isTempLeader, canManage, onRemove, indent }) => (
  <div className={`flex items-center justify-between px-4 py-3 hover:bg-white transition-colors ${indent ? 'pl-8' : ''}`} data-testid={`member-row-${member.id}`}>
    <div className="flex items-center gap-3">
      <Avatar className="w-9 h-9"><AvatarFallback className="text-xs bg-[#0056B3]/10 text-[#0056B3]">{member.full_name?.charAt(0)}</AvatarFallback></Avatar>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900">{member.full_name}</span>
          {isLeader && <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0"><Crown className="w-3 h-3 mr-0.5" /> Leader</Badge>}
          {isTempLeader && <Badge className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0"><Clock className="w-3 h-3 mr-0.5" /> Acting Leader</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {member.email}</span>
          {member.position && <span className="text-xs text-slate-500 flex items-center gap-1"><Briefcase className="w-3 h-3" /> {member.position}</span>}
        </div>
      </div>
    </div>
    {canManage && !isLeader && (
      <Button size="sm" variant="ghost" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={onRemove} data-testid={`remove-member-${member.id}`}><UserMinus className="w-4 h-4" /></Button>
    )}
  </div>
);

export default DivisionGroupsPage;
