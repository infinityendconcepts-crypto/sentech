import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { sponsorsAPI } from '../services/api';
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  UserCheck,
  CalendarDays,
  Receipt,
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  FileText,
  Ticket,
  ShoppingCart,
  FileCheck,
  Building2,
  Tag,
  DollarSign,
  Search
} from 'lucide-react';

const SponsorsPage = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const response = await sponsorsAPI.getAll();
      setSponsors(response.data);
    } catch (error) {
      console.error('Failed to fetch sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for overview stats
  const overviewStats = {
    totalSponsors: sponsors.length,
    totalContacts: 45,
    contactsToday: 8,
    contactsPast7Days: 23,
    invoicesUnpaid: 12,
    invoicesPartiallyPaid: 5,
    invoicesOverdue: 3,
    openProjects: 3,
    completedProjects: 0,
    holdProjects: 0,
    canceledProjects: 0,
    openEstimates: 0,
    acceptedEstimates: 0,
    newEstimateRequests: 0,
    estimatesInProgress: 0,
    sponsorsWithTickets: 1,
    ticketsPercentage: 20,
    sponsorsWithOrders: 0,
    ordersPercentage: 0,
    openProposals: 0,
    acceptedProposals: 0,
    rejectedProposals: 0
  };

  // Mock sponsors data
  const mockSponsors = [
    {
      id: '1',
      companyName: 'Tech Corp Foundation',
      primaryContact: 'John Smith',
      phone: '+27 11 123 4567',
      sponsorGroups: ['Education', 'Technology'],
      labels: ['Premium', 'Active'],
      projects: 5,
      totalInvoiced: 250000,
      paymentReceived: 200000,
      due: 50000
    },
    {
      id: '2',
      companyName: 'Innovation Partners',
      primaryContact: 'Sarah Johnson',
      phone: '+27 21 987 6543',
      sponsorGroups: ['STEM', 'Research'],
      labels: ['Active'],
      projects: 3,
      totalInvoiced: 180000,
      paymentReceived: 180000,
      due: 0
    },
    {
      id: '3',
      companyName: 'Future Leaders Fund',
      primaryContact: 'Michael Chen',
      phone: '+27 31 555 1234',
      sponsorGroups: ['Leadership', 'Development'],
      labels: ['New', 'Pending'],
      projects: 1,
      totalInvoiced: 75000,
      paymentReceived: 25000,
      due: 50000
    }
  ];

  // Mock contacts data
  const mockContacts = [
    {
      id: '1',
      name: 'John',
      surname: 'Smith',
      jobTitle: 'Program Director',
      company: 'Tech Corp Foundation',
      email: 'john.smith@techcorp.com',
      phone: '+27 11 123 4567'
    },
    {
      id: '2',
      name: 'Sarah',
      surname: 'Johnson',
      jobTitle: 'Partnership Manager',
      company: 'Innovation Partners',
      email: 'sarah.j@innovationpartners.com',
      phone: '+27 21 987 6543'
    },
    {
      id: '3',
      name: 'Michael',
      surname: 'Chen',
      jobTitle: 'CSR Lead',
      company: 'Future Leaders Fund',
      email: 'michael.chen@futureleaders.org',
      phone: '+27 31 555 1234'
    },
    {
      id: '4',
      name: 'Lisa',
      surname: 'Van Der Merwe',
      jobTitle: 'Finance Manager',
      company: 'Tech Corp Foundation',
      email: 'lisa.vdm@techcorp.com',
      phone: '+27 11 123 4568'
    },
    {
      id: '5',
      name: 'David',
      surname: 'Nkosi',
      jobTitle: 'Education Coordinator',
      company: 'Innovation Partners',
      email: 'david.nkosi@innovationpartners.com',
      phone: '+27 21 987 6544'
    }
  ];

  return (
    <div className="space-y-6" data-testid="sponsors-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Sponsors</h2>
          <p className="text-slate-600 mt-1">Manage sponsor organizations and contributions</p>
        </div>
        <Button className="gap-2" data-testid="add-sponsor-btn">
          <Plus className="w-4 h-4" />
          Add Sponsor
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="sponsors" data-testid="tab-sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="contacts" data-testid="tab-contacts">Contacts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Statistics */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Sponsors</p>
                      <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{overviewStats.totalSponsors}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Contacts</p>
                      <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{overviewStats.totalContacts}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Contacts Logged In Today</p>
                      <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{overviewStats.contactsToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Contacts Past 7 Days</p>
                      <p className="text-3xl font-heading font-bold text-slate-900 mt-2">{overviewStats.contactsPast7Days}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                      <CalendarDays className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Invoices */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Sponsor Invoices</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Unpaid</p>
                      <p className="text-2xl font-heading font-bold text-slate-900 mt-2">{overviewStats.invoicesUnpaid}</p>
                    </div>
                    <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-rose-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Partially Paid</p>
                      <p className="text-2xl font-heading font-bold text-slate-900 mt-2">{overviewStats.invoicesPartiallyPaid}</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Overdue Invoices</p>
                      <p className="text-2xl font-heading font-bold text-slate-900 mt-2">{overviewStats.invoicesOverdue}</p>
                    </div>
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Projects */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FolderKanban className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Sponsors has open projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.openProjects}</p>
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
                      <p className="text-sm text-slate-600">Sponsors has completed projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.completedProjects}</p>
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
                      <p className="text-sm text-slate-600">Sponsors has hold projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.holdProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Sponsors has canceled projects</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.canceledProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Estimates */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Estimates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Sponsor has open estimates</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.openEstimates}</p>
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
                      <p className="text-sm text-slate-600">Sponsors has accepted estimates</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.acceptedEstimates}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Sponsors has new estimate requests</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.newEstimateRequests}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Sponsors has estimate requests in progress</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.estimatesInProgress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tickets and Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  Sponsors has open tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-heading font-bold text-slate-900">{overviewStats.ticketsPercentage}%</p>
                  <p className="text-sm text-slate-600">of total sponsors</p>
                </div>
                <p className="text-2xl font-heading font-bold text-primary mt-2">{overviewStats.sponsorsWithTickets}</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Sponsors has new orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-heading font-bold text-slate-900">{overviewStats.ordersPercentage}%</p>
                  <p className="text-sm text-slate-600">of total sponsors</p>
                </div>
                <p className="text-2xl font-heading font-bold text-primary mt-2">{overviewStats.sponsorsWithOrders}</p>
              </CardContent>
            </Card>
          </div>

          {/* Proposals */}
          <div>
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">Proposals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Sponsors has open proposals</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.openProposals}</p>
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
                      <p className="text-sm text-slate-600">Sponsors has accepted proposals</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.acceptedProposals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Sponsors has rejected proposals</p>
                      <p className="text-xl font-heading font-bold text-slate-900">{overviewStats.rejectedProposals}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Sponsors List Tab */}
        <TabsContent value="sponsors" className="space-y-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search sponsors..."
                  className="pl-10"
                  data-testid="search-sponsors-input"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Primary Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sponsor Groups</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Labels</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Projects</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invoiced</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Payment Received</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {mockSponsors.map((sponsor) => (
                      <tr key={sponsor.id} className="hover:bg-slate-50 transition-colors" data-testid={`sponsor-row-${sponsor.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">{sponsor.companyName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{sponsor.primaryContact}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{sponsor.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {sponsor.sponsorGroups.map((group, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {sponsor.labels.map((label, idx) => (
                              <Badge key={idx} className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{sponsor.projects}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">R {sponsor.totalInvoiced.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">R {sponsor.paymentReceived.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${sponsor.due > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                            R {sponsor.due.toLocaleString()}
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

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search contacts..."
                  className="pl-10"
                  data-testid="search-contacts-input"
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Surname</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Job Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone Number</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {mockContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50 transition-colors" data-testid={`contact-row-${contact.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{contact.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{contact.surname}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{contact.jobTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-900">{contact.company}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{contact.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{contact.phone}</span>
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
      </Tabs>
    </div>
  );
};

export default SponsorsPage;