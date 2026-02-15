import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { projectsAPI } from '../services/api';
import { 
  Plus, 
  FolderKanban,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Building2,
  X
} from 'lucide-react';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [formData, setFormData] = useState({
    title: '',
    project_type: 'internal',
    client_id: '',
    description: '',
    start_date: '',
    deadline: '',
    has_budget: true,
    budget: '',
    labels: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock projects data
  const mockProjects = [
    {
      id: '1',
      title: 'Bursary Portal Upgrade',
      project_type: 'internal',
      description: 'Upgrade the bursary application portal with new features',
      start_date: '2026-01-15',
      deadline: '2026-04-30',
      status: 'active',
      has_budget: true,
      budget: 250000,
      progress: 65,
      labels: ['High Priority', 'IT'],
      team_size: 5
    },
    {
      id: '2',
      title: 'BBBEE Compliance System',
      project_type: 'client',
      client_name: 'TechCorp Solutions',
      description: 'Develop automated BBBEE compliance tracking system',
      start_date: '2026-02-01',
      deadline: '2026-06-15',
      status: 'active',
      has_budget: true,
      budget: 450000,
      progress: 30,
      labels: ['Client Project', 'Compliance'],
      team_size: 8
    },
    {
      id: '3',
      title: 'Staff Training Program',
      project_type: 'internal',
      description: 'Quarterly training program for all staff members',
      start_date: '2026-01-10',
      deadline: '2026-03-31',
      status: 'completed',
      has_budget: true,
      budget: 75000,
      progress: 100,
      labels: ['HR', 'Training'],
      team_size: 3
    },
    {
      id: '4',
      title: 'Sponsor Engagement Campaign',
      project_type: 'internal',
      description: 'Marketing campaign to engage new sponsors',
      start_date: '2026-02-15',
      deadline: '2026-05-30',
      status: 'active',
      has_budget: false,
      budget: 0,
      progress: 15,
      labels: ['Marketing', 'No Budget'],
      team_size: 4
    },
    {
      id: '5',
      title: 'Student Support System',
      project_type: 'client',
      client_name: 'University Partners',
      description: 'Comprehensive student support and tracking system',
      start_date: '2026-03-01',
      deadline: '2026-09-30',
      status: 'on_hold',
      has_budget: true,
      budget: 680000,
      progress: 10,
      labels: ['Client Project', 'Education'],
      team_size: 10
    },
    {
      id: '6',
      title: 'Data Migration Project',
      project_type: 'internal',
      description: 'Migrate legacy systems to new database infrastructure',
      start_date: '2026-01-20',
      deadline: '2026-03-15',
      status: 'cancelled',
      has_budget: true,
      budget: 120000,
      progress: 25,
      labels: ['IT', 'Infrastructure'],
      team_size: 6
    }
  ];

  // Mock clients data
  const mockClients = [
    {
      id: '1',
      name: 'TechCorp Solutions',
      contact_person: 'Sarah Johnson',
      email: 'sarah.j@techcorp.com',
      phone: '+27 11 123 4567',
      active_projects: 2,
      total_projects: 5,
      total_invoiced: 1250000,
      payment_received: 950000,
      outstanding: 300000
    },
    {
      id: '2',
      name: 'University Partners',
      contact_person: 'Prof. David Nkosi',
      email: 'd.nkosi@unipartners.ac.za',
      phone: '+27 21 987 6543',
      active_projects: 1,
      total_projects: 3,
      total_invoiced: 850000,
      payment_received: 850000,
      outstanding: 0
    },
    {
      id: '3',
      name: 'Innovation Hub',
      contact_person: 'Linda Williams',
      email: 'l.williams@innovhub.co.za',
      phone: '+27 31 555 9876',
      active_projects: 3,
      total_projects: 8,
      total_invoiced: 2100000,
      payment_received: 1800000,
      outstanding: 300000
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'on_hold':
        return 'bg-amber-100 text-amber-700';
      case 'cancelled':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'on_hold':
        return <AlertCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FolderKanban className="w-4 h-4" />;
    }
  };

  const projectStats = {
    totalProjects: mockProjects.length,
    activeProjects: mockProjects.filter(p => p.status === 'active').length,
    completedProjects: mockProjects.filter(p => p.status === 'completed').length,
    onHoldProjects: mockProjects.filter(p => p.status === 'on_hold').length,
    cancelledProjects: mockProjects.filter(p => p.status === 'cancelled').length,
    clientProjects: mockProjects.filter(p => p.project_type === 'client').length,
    internalProjects: mockProjects.filter(p => p.project_type === 'internal').length,
  };

  const handleSubmit = (saveAndContinue = false) => {
    console.log('Form data:', formData);
    console.log('Save and continue:', saveAndContinue);
    setOpen(false);
    // Reset form
    setFormData({
      title: '',
      project_type: 'internal',
      client_id: '',
      description: '',
      start_date: '',
      deadline: '',
      has_budget: true,
      budget: '',
      labels: '',
    });
  };

  return (
    <div className="space-y-6" data-testid="projects-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Projects</h2>
          <p className="text-slate-600 mt-1">Manage internal and client projects</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-project-btn">
              <Plus className="w-4 h-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add project</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-project-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Project type</Label>
                <select
                  id="project_type"
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  data-testid="select-project-type"
                >
                  <option value="internal">Internal Project</option>
                  <option value="client">Client Project</option>
                </select>
              </div>
              {formData.project_type === 'client' && (
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <select
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    data-testid="select-client"
                  >
                    <option value="">Select client</option>
                    {mockClients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  data-testid="input-deadline"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has_budget"
                    checked={formData.has_budget}
                    onChange={(e) => setFormData({ ...formData, has_budget: e.target.checked })}
                    className="w-4 h-4"
                    data-testid="checkbox-has-budget"
                  />
                  <Label htmlFor="has_budget" className="cursor-pointer">This project has a budget</Label>
                </div>
              </div>
              {formData.has_budget && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (R)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Budget amount"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    data-testid="input-budget"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="labels">Labels</Label>
                <Input
                  id="labels"
                  placeholder="Comma-separated labels"
                  value={formData.labels}
                  onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
                  data-testid="input-labels"
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="gap-2"
                data-testid="btn-close"
              >
                <X className="w-4 h-4" />
                Close
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSubmit(true)}
                  className="gap-2 bg-primary"
                  data-testid="btn-save-continue"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & continue
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  className="gap-2 bg-slate-900"
                  data-testid="btn-save"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
          <TabsTrigger value="clients" data-testid="tab-clients">Clients</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Projects</p>
                    <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{projectStats.totalProjects}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Projects</p>
                    <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{projectStats.activeProjects}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Client Projects</p>
                    <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{projectStats.clientProjects}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Completed</p>
                    <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{projectStats.completedProjects}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Project Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Active projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{projectStats.activeProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Completed projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{projectStats.completedProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">On hold projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{projectStats.onHoldProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Cancelled projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{projectStats.cancelledProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Projects List Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10"
                  data-testid="search-projects-input"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {mockProjects.map((project) => (
              <Card key={project.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200" data-testid={`project-card-${project.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FolderKanban className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-heading font-semibold text-slate-900">{project.title}</h3>
                            <Badge className={`${getStatusColor(project.status)} gap-1`}>
                              {getStatusIcon(project.status)}
                              {project.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {project.project_type === 'client' ? 'Client' : 'Internal'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{project.description}</p>
                          <div className="flex flex-wrap items-center gap-4">
                            {project.client_name && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Building2 className="w-4 h-4" />
                                {project.client_name}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              {new Date(project.start_date).toLocaleDateString()} - {new Date(project.deadline).toLocaleDateString()}
                            </div>
                            {project.has_budget && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <DollarSign className="w-4 h-4" />
                                R {project.budget.toLocaleString()}
                              </div>
                            )}
                            {!project.has_budget && (
                              <Badge variant="outline" className="text-xs">No Budget</Badge>
                            )}
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Users className="w-4 h-4" />
                              {project.team_size} members
                            </div>
                            {project.labels.map(label => (
                              <Badge key={label} variant="outline" className="text-xs">{label}</Badge>
                            ))}
                          </div>
                          {project.status === 'active' && (
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-slate-600">Progress</span>
                                <span className="text-xs font-semibold text-slate-900">{project.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search clients..."
                  className="pl-10"
                  data-testid="search-clients-input"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact Person</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Active Projects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoiced</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {mockClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors" data-testid={`client-row-${client.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">{client.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.contact_person}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{client.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-blue-100 text-blue-700">
                            {client.active_projects} / {client.total_projects}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                          R {client.total_invoiced.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${client.outstanding > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            R {client.outstanding.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectsPage;