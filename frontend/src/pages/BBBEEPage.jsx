import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { bbbeeAPI } from '../services/api';
import { Award, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

const BBBEEPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await bbbeeAPI.getAll();
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch BBBEE records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    if (level <= 2) return 'bg-emerald-100 text-emerald-700';
    if (level <= 4) return 'bg-blue-100 text-blue-700';
    if (level <= 6) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6" data-testid="bbbee-page">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">BBBEE Compliance</h2>
          <p className="text-slate-600 mt-1">Track BBBEE scoring and verification records</p>
        </div>
        <Button className="gap-2" data-testid="add-bbbee-record-btn">
          <Plus className="w-4 h-4" />
          Add Record
        </Button>
      </div>

      {loading ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center">
            <p className="text-slate-600">Loading BBBEE records...</p>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">No BBBEE records found</h3>
            <p className="text-slate-600">Start by adding your first BBBEE verification record</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {records.map((record) => (
            <Card key={record.id} className="bg-white border-slate-200 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-slate-900">{record.organization_name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge className={`${getLevelColor(record.bbbee_level)} text-xs`}>
                          Level {record.bbbee_level}
                        </Badge>
                        <span className="text-sm text-slate-600">Score: {record.score}</span>
                        <Badge className={record.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                          {record.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                          {record.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                        <span>Verified: {new Date(record.verification_date).toLocaleDateString()}</span>
                        <span>Expires: {new Date(record.expiry_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BBBEEPage;