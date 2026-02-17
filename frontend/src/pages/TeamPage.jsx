import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea';
import { teamsAPI, usersAPI } from '../services/api';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Mail,
  Phone,
  Building,
  Edit,
  Trash2,
  MoreVertical,
  Crown,
} from 'lucide-react';

const TeamPage = () => {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTeamDialog, setNewTeamDialog] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    department: '',
    color: '#0056B3',
  });

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await teamsAPI.getAll();
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateTeam = async () => {
    try {
      await teamsAPI.create(newTeam);
      toast.success('Team created successfully');
      setNewTeamDialog(false);
      setNewTeam({ name: '', description: '', department: '', color: '#0056B3' });
      fetchTeams();
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamsAPI.delete(teamId);
      toast.success('Team deleted successfully');
      fetchTeams();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const handleAddMember = async (userId) => {
    if (!selectedTeam) return;
    try {
      await teamsAPI.addMember(selectedTeam.id, userId);
      toast.success('Member added to team');
      fetchTeams();
      fetchUsers();
      setAddMemberDialog(false);
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    try {
      await teamsAPI.removeMember(teamId, userId);
      toast.success('Member removed from team');
      fetchTeams();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const getTeamMembers = (team) => {
    return users.filter(u => u.team_id === team.id);
  };

  const getAvailableUsers = () => {
    if (!selectedTeam) return users;
    return users.filter(u => u.team_id !== selectedTeam.id);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (roles) => {
    if (roles?.includes('admin')) return 'bg-purple-100 text-purple-700';
    if (roles?.includes('manager')) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="team-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Team</h2>
          <p className="text-slate-600 mt-1">Manage teams and team members</p>
        </div>
        <Dialog open={newTeamDialog} onOpenChange={setNewTeamDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="create-team-btn">
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="e.g., Engineering Team"
                  data-testid="input-team-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Team description..."
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={newTeam.department}
                  onChange={(e) => setNewTeam({ ...newTeam, department: e.target.value })}
                  placeholder="e.g., Operations"
                />
              </div>
              <div className="space-y-2">
                <Label>Team Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newTeam.color}
                    onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={newTeam.color}
                    onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTeamDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateTeam} data-testid="submit-team-btn">Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search teams or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-team-input"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="teams" className="gap-2" data-testid="tab-teams">
            <Users className="w-4 h-4" />
            Teams ({teams.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2" data-testid="tab-members">
            <UserPlus className="w-4 h-4" />
            All Members ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Teams View */}
        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.length === 0 ? (
              <Card className="col-span-full bg-white border-slate-200">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No teams found</h3>
                  <p className="text-slate-600">Create your first team to get started</p>
                </CardContent>
              </Card>
            ) : (
              filteredTeams.map((team) => {
                const members = getTeamMembers(team);
                return (
                  <Card key={team.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200" data-testid={`team-card-${team.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: team.color || '#0056B3' }}
                          >
                            {team.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{team.name}</CardTitle>
                            {team.department && (
                              <p className="text-xs text-slate-500">{team.department}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600"
                          onClick={() => handleDeleteTeam(team.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {team.description && (
                        <p className="text-sm text-slate-600 mb-4">{team.description}</p>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">Members ({members.length})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setSelectedTeam(team);
                              setAddMemberDialog(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4" />
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {members.slice(0, 5).map((member) => (
                            <div key={member.id} className="flex items-center gap-1 bg-slate-50 rounded-full px-2 py-1">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">{member.full_name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-slate-700">{member.full_name?.split(' ')[0]}</span>
                              {team.leader_id === member.id && (
                                <Crown className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                          ))}
                          {members.length > 5 && (
                            <Badge variant="secondary" className="text-xs">+{members.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Members View */}
        <TabsContent value="members">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const userTeam = teams.find(t => t.id === user.team_id);
              return (
                <Card key={user.id} className="bg-white border-slate-200" data-testid={`member-card-${user.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-white">
                          {user.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{user.full_name}</h4>
                        <p className="text-sm text-slate-600 truncate">{user.position || 'Team Member'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-xs ${getRoleColor(user.roles)}`}>
                            {user.roles?.[0] || 'employee'}
                          </Badge>
                          {userTeam && (
                            <Badge variant="outline" className="text-xs">
                              {userTeam.name}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          )}
                          {user.department && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Building className="w-3 h-3" />
                              {user.department}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {selectedTeam?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {getAvailableUsers().map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer"
                  onClick={() => handleAddMember(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPage;
