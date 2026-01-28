import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FileCheck
} from 'lucide-react';

const SponsorsPage = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

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

      {/* Overview Dashboard */}
      <div className="space-y-6">
        {/* Contact Statistics */}
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
      </div>

      {/* Sponsor List */}
      <div className="mt-8">
        <h3 className="text-lg font-heading font-semibold text-slate-900 mb-4">All Sponsors</h3>
        {loading ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <p className="text-slate-600">Loading sponsors...</p>
            </CardContent>
          </Card>
        ) : sponsors.length === 0 ? (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No sponsors yet</h3>
              <p className="text-slate-600">Start by adding your first sponsor organization</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsors.map((sponsor) => (
              <Card key={sponsor.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-slate-900 truncate">{sponsor.name}</h3>
                      <p className="text-sm text-slate-600 truncate">{sponsor.organization}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{sponsor.contact_email}</span>
                    </div>
                    {sponsor.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span>{sponsor.contact_phone}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500">Contribution: R{sponsor.total_contribution?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorsPage;