import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { divisionGroupsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Building2,
  ChevronDown,
  ChevronUp,
  Shield,
  Mail,
  Briefcase,
} from 'lucide-react';

const DivisionGroupsPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes('super_admin');
  const canManage = isAdmin || isSuperAdmin;

  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [leaderDialog, setLeaderDialog] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchAllUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await divisionGroupsAPI.getAll();
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to fetch division groups:', err);
      toast.error('Failed to load division groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setAllUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleSetLeader = async () => {
    if (!selectedGroup) return;
    try {
      await divisionGroupsAPI.setLeader(selectedGroup.division_name, selectedLeaderId || null);
      toast.success(`Leader updated for ${selectedGroup.division_name}`);
      setLeaderDialog(false);
      setSelectedLeaderId('');
      fetchGroups();
    } catch (err) {
      toast.error('Failed to set leader');
    }
  };

  const handleAddMember = async (userId) => {
    if (!selectedGroup) return;
    try {
      await divisionGroupsAPI.addMember(selectedGroup.division_name, userId);
      toast.success('Member added to group');
      setAddMemberDialog(false);
      fetchGroups();
      fetchAllUsers();
    } catch (err) {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (divisionName, userId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      await divisionGroupsAPI.removeMember(divisionName, userId);
      toast.success('Member removed');
      fetchGroups();
      fetchAllUsers();
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(g =>
      g.division_name.toLowerCase().includes(term) ||
      g.members?.some(m =>
        m.full_name?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term)
      )
    );
  }, [groups, searchTerm]);

  const unassignedUsers = useMemo(() => {
    return allUsers.filter(u => !u.division);
  }, [allUsers]);

  const availableUsersForAdd = useMemo(() => {
    if (!selectedGroup) return unassignedUsers;
    const memberIds = new Set(selectedGroup.members?.map(m => m.id) || []);
    return allUsers.filter(u => !memberIds.has(u.id));
  }, [allUsers, selectedGroup, unassignedUsers]);

  const totalMembers = groups.reduce((sum, g) => sum + g.member_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="division-groups-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0056B3]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="division-groups-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">
            Division Groups
          </h2>
          <p className="text-slate-600 mt-1">
            Manage organizational divisions and their team members
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0056B3]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#0056B3]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900" data-testid="stat-total-divisions">{groups.length}</p>
              <p className="text-xs text-slate-500">Divisions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900" data-testid="stat-total-members">{totalMembers}</p>
              <p className="text-xs text-slate-500">Total Members</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900" data-testid="stat-leaders-assigned">
                {groups.filter(g => g.leader_id).length}
              </p>
              <p className="text-xs text-slate-500">Leaders Assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search divisions or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-division-groups"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups list */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No division groups found</h3>
              <p className="text-slate-600">No matching divisions or members</p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map((group) => (
            <GroupCard
              key={group.division_id}
              group={group}
              expanded={expandedGroup === group.division_name}
              onToggle={() => setExpandedGroup(expandedGroup === group.division_name ? null : group.division_name)}
              canManage={canManage}
              onSetLeader={() => {
                setSelectedGroup(group);
                setSelectedLeaderId(group.leader_id || '');
                setLeaderDialog(true);
              }}
              onAddMember={() => {
                setSelectedGroup(group);
                setAddMemberDialog(true);
              }}
              onRemoveMember={(userId) => handleRemoveMember(group.division_name, userId)}
            />
          ))
        )}
      </div>

      {/* Set Leader Dialog */}
      <Dialog open={leaderDialog} onOpenChange={setLeaderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Leader for {selectedGroup?.division_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Leader</Label>
              <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
                <SelectTrigger data-testid="select-leader-trigger">
                  <SelectValue placeholder="Choose a member as leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Leader</SelectItem>
                  {selectedGroup?.members?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} — {m.position || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaderDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSetLeader}
              className="bg-[#0056B3] hover:bg-[#004494]"
              data-testid="confirm-set-leader-btn"
            >
              Save Leader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Member to {selectedGroup?.division_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <AddMemberSearch users={availableUsersForAdd} onAdd={handleAddMember} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AddMemberSearch = ({ users, onAdd }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query) return users.slice(0, 20);
    const q = query.toLowerCase();
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [users, query]);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search users to add..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="search-add-member"
      />
      <div className="max-h-64 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No users found</p>
        ) : (
          filtered.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-[#0056B3]/10 text-[#0056B3]">
                    {u.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                  <p className="text-xs text-slate-500">{u.division || 'Unassigned'} — {u.email}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-[#0056B3]"
                onClick={() => onAdd(u.id)}
                data-testid={`add-member-${u.id}`}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GroupCard = ({ group, expanded, onToggle, canManage, onSetLeader, onAddMember, onRemoveMember }) => {
  const leader = group.leader;
  const members = group.members || [];

  return (
    <Card className="bg-white border-slate-200 overflow-hidden" data-testid={`group-card-${group.division_name}`}>
      {/* Group header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
        data-testid={`group-toggle-${group.division_name}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[#0056B3] flex items-center justify-center text-white font-bold text-lg">
            {group.division_name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{group.division_name}</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {group.member_count} members
              </span>
              {leader && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> {leader.full_name}
                </span>
              )}
              {!leader && (
                <span className="text-xs text-slate-400">No leader assigned</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                onClick={(e) => { e.stopPropagation(); onSetLeader(); }}
                data-testid={`set-leader-btn-${group.division_name}`}
              >
                <Shield className="w-3 h-3" /> Leader
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1"
                onClick={(e) => { e.stopPropagation(); onAddMember(); }}
                data-testid={`add-member-btn-${group.division_name}`}
              >
                <UserPlus className="w-3 h-3" /> Add
              </Button>
            </>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>

      {/* Expanded members */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50">
          {members.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No members in this division
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white transition-colors"
                  data-testid={`member-row-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="text-xs bg-[#0056B3]/10 text-[#0056B3]">
                        {member.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{member.full_name}</span>
                        {group.leader_id === member.id && (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                            <Crown className="w-3 h-3 mr-0.5" /> Leader
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </span>
                        {member.position && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {member.position}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {canManage && group.leader_id !== member.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => onRemoveMember(member.id)}
                      data-testid={`remove-member-${member.id}`}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default DivisionGroupsPage;
