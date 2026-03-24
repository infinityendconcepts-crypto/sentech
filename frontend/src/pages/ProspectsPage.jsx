import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { prospectsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import {
  Plus,
  Search,
  UserPlus,
  Eye,
  Phone,
  Mail,
  Building,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  List,
  LayoutGrid,
} from 'lucide-react';

const DraggableProspectCard = ({ prospect, sources, getInterestColor, handleDeleteProspect }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: prospect.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  return (
    <Card ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`bg-white border-slate-200 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm text-slate-900 truncate">{prospect.name}</h4>
          <Badge className={`text-xs ${getInterestColor(prospect.interest_level)}`}>{prospect.interest_level}</Badge>
        </div>
        {prospect.company && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <Building className="w-3 h-3" />{prospect.company}
          </div>
        )}
        {prospect.email && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <Mail className="w-3 h-3" /><span className="truncate">{prospect.email}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <Badge variant="outline" className="text-xs">{sources.find(s => s.value === prospect.source)?.label}</Badge>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-600"
            onClick={(e) => { e.stopPropagation(); handleDeleteProspect(prospect.id); }}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DroppableColumn = ({ id, children, label, count }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-slate-700">{label}</h3>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      <div ref={setNodeRef}
        className={`space-y-2 min-h-[400px] p-2 rounded-lg transition-colors ${isOver ? 'bg-primary/5' : 'bg-slate-50'}`}
      >
        {children}
      </div>
    </div>
  );
};

const ProspectsPage = () => {
  const { user } = useAuth();
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban');
  const [activeProspect, setActiveProspect] = useState(null);
  const [newProspectDialog, setNewProspectDialog] = useState(false);
  const [newProspect, setNewProspect] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    interest_level: 'medium',
    budget_range: '',
    notes: '',
  });

  const statuses = [
    { value: 'identified', label: 'Identified', color: 'bg-slate-100 text-slate-700' },
    { value: 'researching', label: 'Researching', color: 'bg-blue-100 text-blue-700' },
    { value: 'approached', label: 'Approached', color: 'bg-purple-100 text-purple-700' },
    { value: 'engaged', label: 'Engaged', color: 'bg-amber-100 text-amber-700' },
    { value: 'qualified', label: 'Qualified', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'disqualified', label: 'Disqualified', color: 'bg-rose-100 text-rose-700' },
  ];

  const sources = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'event', label: 'Event' },
    { value: 'cold_outreach', label: 'Cold Outreach' },
    { value: 'other', label: 'Other' },
  ];

  const interestLevels = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
    { value: 'high', label: 'High', color: 'bg-emerald-100 text-emerald-700' },
  ];

  useEffect(() => {
    fetchProspects();
  }, [statusFilter]);

  const fetchProspects = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await prospectsAPI.getAll(params);
      setProspects(response.data);
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProspect = async () => {
    try {
      await prospectsAPI.create(newProspect);
      toast.success('Prospect added successfully');
      setNewProspectDialog(false);
      setNewProspect({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: 'website',
        interest_level: 'medium',
        budget_range: '',
        notes: '',
      });
      fetchProspects();
    } catch (error) {
      toast.error('Failed to add prospect');
    }
  };

  const handleUpdateStatus = async (prospectId, newStatus) => {
    try {
      await prospectsAPI.update(prospectId, { status: newStatus });
      setProspects(prospects.map(p =>
        p.id === prospectId ? { ...p, status: newStatus } : p
      ));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteProspect = async (prospectId) => {
    if (!window.confirm('Are you sure you want to delete this prospect?')) return;
    try {
      await prospectsAPI.delete(prospectId);
      toast.success('Prospect deleted');
      fetchProspects();
    } catch (error) {
      toast.error('Failed to delete prospect');
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event) => {
    const prospectId = event.active.id;
    setActiveProspect(prospects.find(p => p.id === prospectId) || null);
  };

  const handleDragEnd = (event) => {
    setActiveProspect(null);
    const { active, over } = event;
    if (!over) return;
    const prospectId = active.id;
    const newStatus = over.id;
    const prospect = prospects.find(p => p.id === prospectId);
    if (prospect && prospect.status !== newStatus && statuses.some(s => s.value === newStatus)) {
      handleUpdateStatus(prospectId, newStatus);
    }
  };

  const getStatusColor = (status) => {
    return statuses.find(s => s.value === status)?.color || 'bg-slate-100 text-slate-700';
  };

  const getInterestColor = (level) => {
    return interestLevels.find(l => l.value === level)?.color || 'bg-slate-100 text-slate-700';
  };

  const filteredProspects = prospects.filter(prospect =>
    prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prospect.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prospect.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProspectsByStatus = (status) => {
    return filteredProspects.filter(p => p.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="prospects-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Prospects</h2>
          <p className="text-slate-600 mt-1">Identify and qualify potential leads</p>
        </div>
        <Dialog open={newProspectDialog} onOpenChange={setNewProspectDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-prospect-btn">
              <Plus className="w-4 h-4" />
              Add Prospect
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Prospect</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newProspect.name}
                  onChange={(e) => setNewProspect({ ...newProspect, name: e.target.value })}
                  placeholder="Full name"
                  data-testid="input-prospect-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newProspect.email}
                    onChange={(e) => setNewProspect({ ...newProspect, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newProspect.phone}
                    onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })}
                    placeholder="+27..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={newProspect.company}
                  onChange={(e) => setNewProspect({ ...newProspect, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={newProspect.source}
                    onValueChange={(value) => setNewProspect({ ...newProspect, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interest Level</Label>
                  <Select
                    value={newProspect.interest_level}
                    onValueChange={(value) => setNewProspect({ ...newProspect, interest_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {interestLevels.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Budget Range</Label>
                <Input
                  value={newProspect.budget_range}
                  onChange={(e) => setNewProspect({ ...newProspect, budget_range: e.target.value })}
                  placeholder="e.g., R50,000 - R100,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newProspect.notes}
                  onChange={(e) => setNewProspect({ ...newProspect, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewProspectDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateProspect} data-testid="submit-prospect-btn">Add Prospect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search prospects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-prospects-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-6 gap-4">
            {statuses.map((status) => (
              <DroppableColumn key={status.value} id={status.value} label={status.label} count={getProspectsByStatus(status.value).length}>
                {getProspectsByStatus(status.value).map((prospect) => (
                  <DraggableProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    sources={sources}
                    getInterestColor={getInterestColor}
                    handleDeleteProspect={handleDeleteProspect}
                  />
                ))}
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeProspect ? (
              <Card className="bg-white border-primary shadow-xl w-48">
                <CardContent className="p-3">
                  <h4 className="font-medium text-sm text-slate-900 truncate">{activeProspect.name}</h4>
                  {activeProspect.company && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Building className="w-3 h-3" />{activeProspect.company}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProspects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">No prospects found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProspects.map((prospect) => (
                    <TableRow key={prospect.id} data-testid={`prospect-row-${prospect.id}`}>
                      <TableCell className="font-medium">{prospect.name}</TableCell>
                      <TableCell>{prospect.company || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {prospect.email && (
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="w-3 h-3" />
                              {prospect.email}
                            </div>
                          )}
                          {prospect.phone && (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="w-3 h-3" />
                              {prospect.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {sources.find(s => s.value === prospect.source)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${getInterestColor(prospect.interest_level)}`}>
                          {prospect.interest_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={prospect.status}
                          onValueChange={(value) => handleUpdateStatus(prospect.id, value)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600"
                          onClick={() => handleDeleteProspect(prospect.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProspectsPage;
