import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban } from 'lucide-react';

const PlaceholderPage = ({ title, description, icon: Icon }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="text-slate-600 mt-1">{description}</p>
      </div>
      <Card className="bg-white border-slate-200">
        <CardContent className="p-12 text-center">
          <Icon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600">This feature is coming soon. Stay tuned!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;