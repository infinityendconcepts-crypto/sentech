import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { applicationsAPI } from '../services/api';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const steps = [
  { number: 1, name: 'Personal Information', description: 'Basic personal and demographic details' },
  { number: 2, name: 'Employment Details', description: 'Current employment information' },
  { number: 3, name: 'Academic & Bursary Details', description: 'Study and bursary information' },
  { number: 4, name: 'Documents & Submission', description: 'Required documents and final submission' },
];

const NewApplicationPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    personal_info: {
      surname: '',
      name: '',
      id_number: '',
      race: '',
      gender: '',
      disability: '',
    },
    employment_info: {
      division: '',
      department: '',
      position_description: '',
      date_of_appointment: '',
      performance_score: '',
    },
    academic_bursary_info: {
      bursary_status: '',
      institution: '',
      course_of_study: '',
      total_amount_requested: '',
      applicant_type: '',
    },
    documents: {
      id_document: '',
      academic_transcript: '',
      proof_of_registration: '',
      other_documents: '',
    },
  });

  const updateField = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await applicationsAPI.create({
        ...formData,
        status: 'draft',
        current_step: currentStep,
      });
      toast.success('Draft saved successfully');
      navigate('/applications');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await applicationsAPI.create({
        ...formData,
        status: 'pending',
        current_step: 4,
      });
      toast.success('Application submitted successfully');
      navigate('/applications');
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6" data-testid="new-application-page">
      <div>
        <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">New Bursary Application</h2>
        <p className="text-slate-600 mt-1">Complete all steps to submit your application</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              currentStep === step.number
                ? 'border-primary bg-primary/5'
                : currentStep > step.number
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white'
            }`}
            data-testid={`step-indicator-${step.number}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  currentStep === step.number
                    ? 'bg-primary text-white'
                    : currentStep > step.number
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > step.number ? <CheckCircle2 className="w-5 h-5" /> : step.number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{step.name}</p>
                <p className="text-xs text-slate-600 truncate">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="font-heading">Step {currentStep}: {steps[currentStep - 1].name}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number</Label>
                <Input
                  id="id_number"
                  placeholder="9001015009087"
                  value={formData.personal_info.id_number}
                  onChange={(e) => updateField('personal_info', 'id_number', e.target.value)}
                  data-testid="input-id-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+27 12 345 6789"
                  value={formData.personal_info.phone}
                  onChange={(e) => updateField('personal_info', 'phone', e.target.value)}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={formData.personal_info.address}
                  onChange={(e) => updateField('personal_info', 'address', e.target.value)}
                  data-testid="input-address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Cape Town"
                  value={formData.personal_info.city}
                  onChange={(e) => updateField('personal_info', 'city', e.target.value)}
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="8001"
                  value={formData.personal_info.postal_code}
                  onChange={(e) => updateField('personal_info', 'postal_code', e.target.value)}
                  data-testid="input-postal-code"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="institution">Educational Institution</Label>
                <Input
                  id="institution"
                  placeholder="University of Cape Town"
                  value={formData.academic_info.institution}
                  onChange={(e) => updateField('academic_info', 'institution', e.target.value)}
                  data-testid="input-institution"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program of Study</Label>
                <Input
                  id="program"
                  placeholder="Bachelor of Engineering"
                  value={formData.academic_info.program}
                  onChange={(e) => updateField('academic_info', 'program', e.target.value)}
                  data-testid="input-program"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year_of_study">Year of Study</Label>
                <Input
                  id="year_of_study"
                  type="number"
                  placeholder="2"
                  value={formData.academic_info.year_of_study}
                  onChange={(e) => updateField('academic_info', 'year_of_study', e.target.value)}
                  data-testid="input-year-of-study"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gpa">Grade Point Average / Percentage</Label>
                <Input
                  id="gpa"
                  placeholder="75%"
                  value={formData.academic_info.gpa}
                  onChange={(e) => updateField('academic_info', 'gpa', e.target.value)}
                  data-testid="input-gpa"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="household_income">Household Income (Annual)</Label>
                  <Input
                    id="household_income"
                    placeholder="R 150,000"
                    value={formData.financial_info.household_income}
                    onChange={(e) => updateField('financial_info', 'household_income', e.target.value)}
                    data-testid="input-household-income"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dependents">Number of Dependents</Label>
                  <Input
                    id="dependents"
                    type="number"
                    placeholder="3"
                    value={formData.financial_info.dependents}
                    onChange={(e) => updateField('financial_info', 'dependents', e.target.value)}
                    data-testid="input-dependents"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional_info">Additional Financial Information</Label>
                <Textarea
                  id="additional_info"
                  placeholder="Provide any additional details about your financial situation..."
                  value={formData.financial_info.additional_info}
                  onChange={(e) => updateField('financial_info', 'additional_info', e.target.value)}
                  rows={4}
                  data-testid="textarea-additional-info"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id_document">ID Document / Passport</Label>
                  <Input
                    id="id_document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'id_document', e.target.files[0]?.name || '')}
                    data-testid="input-id-document"
                  />
                  <p className="text-xs text-slate-600">Upload a copy of your ID document or passport</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_transcript">Academic Transcript</Label>
                  <Input
                    id="academic_transcript"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'academic_transcript', e.target.files[0]?.name || '')}
                    data-testid="input-academic-transcript"
                  />
                  <p className="text-xs text-slate-600">Upload your most recent academic transcript</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proof_of_income">Proof of Income</Label>
                  <Input
                    id="proof_of_income"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'proof_of_income', e.target.files[0]?.name || '')}
                    data-testid="input-proof-of-income"
                  />
                  <p className="text-xs text-slate-600">Upload proof of household income (payslips, tax returns, etc.)</p>
                </div>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Note:</strong> By submitting this application, you confirm that all information provided is
                  accurate and complete.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
              data-testid="prev-step-btn"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft} disabled={loading} data-testid="save-draft-btn">
                Save Draft
              </Button>
              {currentStep < 4 ? (
                <Button onClick={nextStep} className="gap-2" data-testid="next-step-btn">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} data-testid="submit-application-btn">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewApplicationPage;