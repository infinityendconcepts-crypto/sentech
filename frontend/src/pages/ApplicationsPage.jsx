import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applicationsAPI } from '../services/api';
import { FileText, Plus, Search, Clock, CheckCircle2, XCircle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await applicationsAPI.getAll();
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(
    (app) =>
      app.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="applications-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Applications</h2>
          <p className="text-slate-600 mt-1">Manage and track your bursary applications</p>
        </div>
        <Link to="/applications/new">
          <Button className="gap-2" data-testid="new-application-btn">
            <Plus className="w-4 h-4" />
            New Application
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-slate-200">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search applications by email or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-applications-input"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">Loading applications...</p>
          </CardContent>
        </Card>
      ) : filteredApplications.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No applications found</h3>
            <p className="text-slate-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Start by creating your first application'}
            </p>
            {!searchQuery && (
              <Link to="/applications/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Application
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="bg-white border-slate-200 hover:shadow-md transition-all duration-200"
              data-testid={`application-card-${application.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-slate-900">Application #{application.id.slice(0, 8)}</h3>
                        <p className="text-sm text-slate-600 mt-1">{application.user_email}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={`${getStatusColor(application.status)} gap-1 text-xs`}>
                            {getStatusIcon(application.status)}
                            {application.status}
                          </Badge>
                          <span className="text-xs text-slate-500">Step {application.current_step} of 4</span>
                          <span className="text-xs text-slate-500">
                            {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/applications/${application.id}`}>
                      <Button variant="outline" size="sm" data-testid={`view-application-${application.id}`}>
                        View Details
                      </Button>
                    </Link>
                    {application.status === 'draft' && (
                      <Link to={`/applications/${application.id}/edit`}>
                        <Button size="sm" className="gap-2">
                          <Edit className="w-4 h-4" />
                          Continue
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;