import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { sponsorsAPI } from '../services/api';
import { Users, Plus, Mail, Phone } from 'lucide-react';

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
  );
};

export default SponsorsPage;