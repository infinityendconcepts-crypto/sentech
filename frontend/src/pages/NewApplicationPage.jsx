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
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  placeholder="Enter surname"
                  value={formData.personal_info.surname}
                  onChange={(e) => updateField('personal_info', 'surname', e.target.value)}
                  data-testid="input-surname"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name(s) *</Label>
                <Input
                  id="name"
                  placeholder="Enter first and middle names"
                  value={formData.personal_info.name}
                  onChange={(e) => updateField('personal_info', 'name', e.target.value)}
                  data-testid="input-name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_number">ID Number *</Label>
                <Input
                  id="id_number"
                  placeholder="Enter 13-digit ID number"
                  value={formData.personal_info.id_number}
                  onChange={(e) => updateField('personal_info', 'id_number', e.target.value)}
                  data-testid="input-id-number"
                  maxLength={13}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="race">Race *</Label>
                <select
                  id="race"
                  value={formData.personal_info.race}
                  onChange={(e) => updateField('personal_info', 'race', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="select-race"
                  required
                >
                  <option value="">Select race</option>
                  <option value="Black">Black</option>
                  <option value="Coloured">Coloured</option>
                  <option value="Indian">Indian</option>
                  <option value="White">White</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <select
                  id="gender"
                  value={formData.personal_info.gender}
                  onChange={(e) => updateField('personal_info', 'gender', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="select-gender"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disability">Disability *</Label>
                <select
                  id="disability"
                  value={formData.personal_info.disability}
                  onChange={(e) => updateField('personal_info', 'disability', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="select-disability"
                  required
                >
                  <option value="">Select option</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="division">Division *</Label>
                <Input
                  id="division"
                  placeholder="e.g., Operations, Finance, HR"
                  value={formData.employment_info.division}
                  onChange={(e) => updateField('employment_info', 'division', e.target.value)}
                  data-testid="input-division"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  placeholder="e.g., Accounting, IT, Procurement"
                  value={formData.employment_info.department}
                  onChange={(e) => updateField('employment_info', 'department', e.target.value)}
                  data-testid="input-department"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="position_description">Position Description *</Label>
                <Input
                  id="position_description"
                  placeholder="Enter your job title or position"
                  value={formData.employment_info.position_description}
                  onChange={(e) => updateField('employment_info', 'position_description', e.target.value)}
                  data-testid="input-position-description"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_appointment">Date of Appointment *</Label>
                <Input
                  id="date_of_appointment"
                  type="date"
                  value={formData.employment_info.date_of_appointment}
                  onChange={(e) => updateField('employment_info', 'date_of_appointment', e.target.value)}
                  data-testid="input-date-of-appointment"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performance_score">Performance Score *</Label>
                <Input
                  id="performance_score"
                  type="number"
                  placeholder="Enter score (0-100)"
                  min="0"
                  max="100"
                  value={formData.employment_info.performance_score}
                  onChange={(e) => updateField('employment_info', 'performance_score', e.target.value)}
                  data-testid="input-performance-score"
                  required
                />
                <p className="text-xs text-slate-600">Enter your most recent performance evaluation score</p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicant_type">Applicant Type *</Label>
                  <select
                    id="applicant_type"
                    value={formData.academic_bursary_info.applicant_type}
                    onChange={(e) => updateField('academic_bursary_info', 'applicant_type', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="select-applicant-type"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="NEW APPLICANT">NEW APPLICANT</option>
                    <option value="CONTINUATION APPLICANT">CONTINUATION APPLICANT</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bursary_status">Bursary Status *</Label>
                  <select
                    id="bursary_status"
                    value={formData.academic_bursary_info.bursary_status}
                    onChange={(e) => updateField('academic_bursary_info', 'bursary_status', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="select-bursary-status"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="institution">Institution *</Label>
                  <Input
                    id="institution"
                    placeholder="e.g., University of Cape Town, UNISA"
                    value={formData.academic_bursary_info.institution}
                    onChange={(e) => updateField('academic_bursary_info', 'institution', e.target.value)}
                    data-testid="input-institution"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="course_of_study">Course of Study *</Label>
                  <Input
                    id="course_of_study"
                    placeholder="e.g., Bachelor of Commerce in Accounting"
                    value={formData.academic_bursary_info.course_of_study}
                    onChange={(e) => updateField('academic_bursary_info', 'course_of_study', e.target.value)}
                    data-testid="input-course-of-study"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="total_amount_requested">Total Amount Requested (R) *</Label>
                  <Input
                    id="total_amount_requested"
                    type="number"
                    placeholder="e.g., 50000"
                    min="0"
                    step="0.01"
                    value={formData.academic_bursary_info.total_amount_requested}
                    onChange={(e) => updateField('academic_bursary_info', 'total_amount_requested', e.target.value)}
                    data-testid="input-total-amount-requested"
                    required
                  />
                  <p className="text-xs text-slate-600">Enter the total bursary amount you are requesting in Rands</p>
                </div>
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