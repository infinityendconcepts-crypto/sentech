import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { leadsAPI } from '../services/api';
import { 
  Plus, 
  Search,
  Filter,
  FileDown,
  Printer,
  Tag,
  Upload,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  Phone,
  Mail,
  User,
  Building2,
  MoreVertical
} from 'lucide-react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { toast } from 'sonner';

// Draggable Lead Card Component
const DraggableLeadCard = ({ lead }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-700';
      case 'qualified': return 'bg-blue-100 text-blue-700';
      case 'discussion': return 'bg-purple-100 text-purple-700';
      case 'negotiation': return 'bg-orange-100 text-orange-700';
      case 'won': return 'bg-emerald-100 text-emerald-700';
      case 'lost': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border-slate-200 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing"
      data-testid={`kanban-lead-${lead.id}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-slate-900">{lead.name}</h4>
            <Badge className={`${getStatusColor(lead.status)} text-xs`}>
              {lead.status}
            </Badge>
          </div>
          <div className="space-y-2">
            {lead.company && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Building2 className="w-3 h-3" />
                {lead.company}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-3 h-3" />
              {lead.phone}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail className="w-3 h-3" />
              {lead.email}
            </div>
            {lead.labels && lead.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {lead.labels.map((label, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">{label}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Lead Card Clone for DragOverlay
const LeadCardOverlay = ({ lead }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-700';
      case 'qualified': return 'bg-blue-100 text-blue-700';
      case 'discussion': return 'bg-purple-100 text-purple-700';
      case 'negotiation': return 'bg-orange-100 text-orange-700';
      case 'won': return 'bg-emerald-100 text-emerald-700';
      case 'lost': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  return (
    <Card className="bg-white border-slate-300 shadow-2xl rotate-2 opacity-95 cursor-grabbing">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-slate-900">{lead.name}</h4>
          <Badge className={`${getStatusColor(lead.status)} text-xs`}>{lead.status}</Badge>
        </div>
        {lead.company && <p className="text-xs text-slate-500 mt-1">{lead.company}</p>}
      </CardContent>
    </Card>
  );
};

// Droppable Column Component
const DroppableColumn = ({ id, title, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-100 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <Badge variant="secondary" className="ml-2">{count}</Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-3 min-h-[300px] rounded-lg p-2 transition-colors duration-150 ${
          isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'bg-transparent'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
    </div>
  );
};

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list');
  const [filters, setFilters] = useState({
    owner: 'all',
    status: 'all',
    label: 'all',
    source: 'all',
    search: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await leadsAPI.getAll();
      setLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock leads data
  const mockLeads = [
    {
      id: '1',
      name: 'John Smith',
      company: 'TechCorp',
      phone: '+27 11 123 4567',
      email: 'john.smith@techcorp.com',
      owner: 'Sarah Johnson',
      labels: ['Hot Lead', 'Enterprise'],
      created_date: '2026-01-15',
      status: 'new',
      source: 'Website'
    },
    {
      id: '2',
      name: 'Mary Williams',
      company: 'Innovation Hub',
      phone: '+27 21 987 6543',
      email: 'm.williams@innovhub.com',
      owner: 'Michael Chen',
      labels: ['Warm Lead'],
      created_date: '2026-01-18',
      status: 'qualified',
      source: 'Referral'
    },
    {
      id: '3',
      name: 'David Brown',
      company: 'Future Solutions',
      phone: '+27 31 555 1234',
      email: 'david.b@futuresol.com',
      owner: 'Sarah Johnson',
      labels: ['Enterprise', 'High Value'],
      created_date: '2026-01-20',
      status: 'discussion',
      source: 'LinkedIn'
    },
    {
      id: '4',
      name: 'Lisa Anderson',
      company: 'Smart Systems',
      phone: '+27 11 789 4561',
      email: 'l.anderson@smartsys.com',
      owner: 'Michael Chen',
      labels: ['SME'],
      created_date: '2026-01-22',
      status: 'negotiation',
      source: 'Cold Call'
    },
    {
      id: '5',
      name: 'Robert Taylor',
      company: 'Global Enterprises',
      phone: '+27 21 456 7890',
      email: 'r.taylor@globalent.com',
      owner: 'Sarah Johnson',
      labels: ['Enterprise', 'Hot Lead'],
      created_date: '2026-01-25',
      status: 'won',
      source: 'Website'
    },
    {
      id: '6',
      name: 'Jennifer Lee',
      company: 'LocalBiz',
      phone: '+27 11 321 6547',
      email: 'j.lee@localbiz.co.za',
      owner: 'Michael Chen',
      labels: ['Cold Lead'],
      created_date: '2026-01-28',
      status: 'lost',
      source: 'Email Campaign'
    },
    {
      id: '7',
      name: 'Peter Wilson',
      company: 'NextGen Tech',
      phone: '+27 31 654 3210',
      email: 'p.wilson@nextgen.tech',
      owner: 'Sarah Johnson',
      labels: ['Warm Lead', 'Tech'],
      created_date: '2026-01-30',
      status: 'new',
      source: 'Trade Show'
    },
    {
      id: '8',
      name: 'Susan Miller',
      company: 'Retail Plus',
      phone: '+27 21 987 1234',
      email: 's.miller@retailplus.com',
      owner: 'Michael Chen',
      labels: ['Retail'],
      created_date: '2026-02-01',
      status: 'qualified',
      source: 'Partner'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-700';
      case 'qualified':
        return 'bg-blue-100 text-blue-700';
      case 'discussion':
        return 'bg-purple-100 text-purple-700';
      case 'negotiation':
        return 'bg-orange-100 text-orange-700';
      case 'won':
        return 'bg-emerald-100 text-emerald-700';
      case 'lost':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const kanbanColumns = [
    { id: 'new', title: 'New', status: 'new' },
    { id: 'qualified', title: 'Qualified', status: 'qualified' },
    { id: 'discussion', title: 'Discussion', status: 'discussion' },
    { id: 'negotiation', title: 'Negotiation', status: 'negotiation' },
    { id: 'won', title: 'Won', status: 'won' },
    { id: 'lost', title: 'Lost', status: 'lost' }
  ];

  const filteredLeads = mockLeads.filter(lead => {
    if (filters.owner !== 'all' && lead.owner !== filters.owner) return false;
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.label !== 'all' && !lead.labels.includes(filters.label)) return false;
    if (filters.source !== 'all' && lead.source !== filters.source) return false;
    if (filters.search && !lead.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const uniqueOwners = [...new Set(mockLeads.map(l => l.owner))];
  const uniqueLabels = [...new Set(mockLeads.flatMap(l => l.labels))];
  const uniqueSources = [...new Set(mockLeads.map(l => l.source))];

  const handleStatusChange = (leadId, newStatus) => {
    console.log(`Changing lead ${leadId} to status ${newStatus}`);
    toast.success(`Lead status changed to ${newStatus}`);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeLead = mockLeads.find(l => l.id === active.id);
    const overColumnStatus = over.id;

    if (activeLead && activeLead.status !== overColumnStatus) {
      handleStatusChange(active.id, overColumnStatus);
      toast.success(`Lead moved to ${overColumnStatus}`);
    }
  };

  const clearFilters = () => {
    setFilters({
      owner: 'all',
      status: 'all',
      label: 'all',
      source: 'all',
      search: ''
    });
    toast.success('Filters cleared');
  };

  return (
    <div className="space-y-6" data-testid="leads-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Leads</h2>
          <p className="text-slate-600 mt-1">Manage your sales leads and prospects</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" data-testid="manage-labels-btn">
            <Tag className="w-4 h-4" />
            Manage labels
          </Button>
          <Button variant="outline" className="gap-2" data-testid="import-leads-btn">
            <Upload className="w-4 h-4" />
            Import leads
          </Button>
          <Button className="gap-2" data-testid="add-lead-btn">
            <Plus className="w-4 h-4" />
            Add lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
                data-testid="search-leads-input"
              />
            </div>
            <Select value={filters.owner} onValueChange={(value) => setFilters({ ...filters, owner: value })}>
              <SelectTrigger className="w-[180px]" data-testid="filter-owner">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {uniqueOwners.map(owner => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[180px]" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="discussion">Discussion</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.label} onValueChange={(value) => setFilters({ ...filters, label: value })}>
              <SelectTrigger className="w-[180px]" data-testid="filter-label">
                <SelectValue placeholder="Label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labels</SelectItem>
                {uniqueLabels.map(label => (
                  <SelectItem key={label} value={label}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.source} onValueChange={(value) => setFilters({ ...filters, source: value })}>
              <SelectTrigger className="w-[180px]" data-testid="filter-source">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" title="Created date" data-testid="filter-date-btn">
              <Calendar className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              title="Apply filters"
              data-testid="apply-filters-btn"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              title="Clear filters"
              data-testid="clear-filters-btn"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex gap-2 ml-2">
              <Button variant="ghost" size="icon" title="Export" data-testid="export-btn">
                <FileDown className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Print" data-testid="print-btn">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list" data-testid="view-list">List</TabsTrigger>
          <TabsTrigger value="kanban" data-testid="view-kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Labels</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors" data-testid={`lead-row-${lead.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{lead.name}</div>
                            {lead.company && (
                              <div className="text-xs text-slate-500">{lead.company}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{lead.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-slate-600" />
                            </div>
                            <span className="text-sm text-slate-600">{lead.owner}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {lead.labels.map((label, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {new Date(lead.created_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Badge className={`${getStatusColor(lead.status)} cursor-pointer`}>
                                {lead.status}
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'new')}>New</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'qualified')}>Qualified</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'discussion')}>Discussion</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'negotiation')}>Negotiation</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'won')}>Won</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'lost')}>Lost</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`edit-lead-${lead.id}`}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" data-testid={`delete-lead-${lead.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {kanbanColumns.map(column => {
                const columnLeads = filteredLeads.filter(lead => lead.status === column.status);
                return (
                  <DroppableColumn key={column.id} id={column.status} title={column.title} count={columnLeads.length}>
                    {columnLeads.map(lead => (
                      <DraggableLeadCard key={lead.id} lead={lead} />
                    ))}
                  </DroppableColumn>
                );
              })}            </div>
          </DndContext>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadsPage;