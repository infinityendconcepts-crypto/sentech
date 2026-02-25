import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { trainingApplicationsAPI } from '../services/api';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, User, Briefcase, GraduationCap, Upload, Eye, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// South African District Municipalities
const DISTRICT_MUNICIPALITIES = [
  "1724 RADIOKOP, ROODEPOORT - City of Johannesburg Metropolitan Municipality",
  "7500 PLATTEKLOOF EXT 3, PAROW - City of Cape Town Metropolitan Municipality",
  "9301 NAVAL VIEW, BLOEMFONTEIN - Mangaung Metropolitan Municipality",
  "4051 BROADWAY, DURBAN NORTH - eThekwini Metropolitan Municipality",
  "2351 ERMELO, ERMELO - Gert Sibande District Municipality",
  "5247 VINCENT, EAST LONDON - Buffalo City Metropolitan Municipality",
  "6529 LOERIE PARK, GEORGE - Garden Route District Municipality",
  "0699 POLOKWANE, POLOKWANE - Capricorn District Municipality",
  "6001 GLENDINNINGVALE, PORT ELIZABETH - Nelson Mandela Bay Metropolitan Municipality",
  "3100 VRYHEID, VRYHEID - Amajuba District Municipality",
  "8601 VRYBURG, VRYBURG - Dr Ruth Segomotsi Mompati District Municipality",
  "5900 MIDROS, MIDDELBURG - Chris Hani District Municipality",
  "8801 RAND, UPINGTON - Namakwa District Municipality",
  "8160 VREDENDAL, VREDENDAL - City of Cape Town Metropolitan Municipality",
];

const steps = [
  { number: 1, name: 'Personal Information', description: 'Basic personal and demographic details', icon: User },
  { number: 2, name: 'Employment Details', description: 'Current employment information', icon: Briefcase },
  { number: 3, name: 'Academic & Service Details', description: 'Training information', icon: GraduationCap },
  { number: 4, name: 'Documents & Submission', description: 'Required documents and final submission', icon: Upload },
];

const TrainingApplicationPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    personal_info: {
      surname: '',
      name: '',
      id_number: '',
      race: '',
      gender: '',
      disability: '',
      disability_description: '',
      medical_certificate: '',
      district_municipality: '',
    },
    employment_info: {
      division: '',
      department: '',
      position_description: '',
      date_of_appointment: '',
      performance_score: '',
    },
    training_info: {
      training_status: '',
      service_provider: '',
      training_type: '',
      total_amount: '',
      supplier_type: '', // 'preferred_supplier' or 'rfq_required'
    },
    documents: {
      signed_performance_contract: '',
      quotation: '',
      sbd4_form: '',
      consent_form: '',
      csd_report: '',
      bbbee_certificate: '',
      motivation: '',
      scope_of_work: '',
      other_documents: '',
    },
  });

  // Search state for district municipality dropdown
  const [municipalitySearch, setMunicipalitySearch] = useState('');
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false);

  const filteredMunicipalities = DISTRICT_MUNICIPALITIES.filter(m =>
    m.toLowerCase().includes(municipalitySearch.toLowerCase())
  );

  // Load existing application data when editing
  useEffect(() => {
    if (isEditing) {
      setLoadingApplication(true);
      trainingApplicationsAPI.getOne(id)
        .then(response => {
          const app = response.data;
          setFormData({
            personal_info: app.personal_info || {
              surname: '', name: '', id_number: '', race: '', gender: '', disability: '', disability_description: '', medical_certificate: '', district_municipality: ''
            },
            employment_info: app.employment_info || {
              division: '', department: '', position_description: '', date_of_appointment: '', performance_score: ''
            },
            training_info: app.training_info || {
              training_status: '', service_provider: '', training_type: '', total_amount: '', supplier_type: ''
            },
            documents: app.documents || {
              signed_performance_contract: '', quotation: '', sbd4_form: '', consent_form: '', csd_report: '', bbbee_certificate: '', motivation: '', scope_of_work: '', other_documents: ''
            },
          });
          if (app.current_step) {
            setCurrentStep(app.current_step);
          }
        })
        .catch(error => {
          console.error('Failed to load application:', error);
          toast.error('Failed to load application');
        })
        .finally(() => {
          setLoadingApplication(false);
        });
    }
  }, [id, isEditing]);

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        status: 'pending',
        current_step: 4,
      };
      
      if (isEditing) {
        await trainingApplicationsAPI.update(id, submissionData);
        toast.success('Training application updated and submitted successfully!');
      } else {
        await trainingApplicationsAPI.create(submissionData);
        toast.success('Training application submitted successfully!');
      }
      navigate('/training-applications');
    } catch (error) {
      toast.error('Failed to submit training application');
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const draftData = {
        ...formData,
        status: 'draft',
        current_step: currentStep,
      };
      
      if (isEditing) {
        await trainingApplicationsAPI.update(id, draftData);
        toast.success('Draft saved successfully!');
      } else {
        await trainingApplicationsAPI.create(draftData);
        toast.success('Draft saved successfully!');
      }
      navigate('/training-applications');
    } catch (error) {
      toast.error('Failed to save draft');
      console.error('Save draft error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Calculate if training is over R15,000
  const totalAmount = parseFloat(formData.training_info.total_amount) || 0;
  const isOverThreshold = totalAmount > 15000;
  const isRFQRequired = formData.training_info.supplier_type === 'rfq_required';

  if (loadingApplication) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="training-application-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">
            {isEditing ? 'Edit Training Application' : 'New Training Application'}
          </h2>
          <p className="text-slate-600 mt-1">Complete all steps to submit your training application</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setShowSummary(true)} data-testid="view-summary-btn">
          <Eye className="w-4 h-4" />
          View Summary
        </Button>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          
          return (
            <Card 
              key={step.number}
              className={`relative cursor-pointer transition-all duration-200 ${
                isActive ? 'ring-2 ring-primary bg-primary/5' : 
                isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
              }`}
              onClick={() => setCurrentStep(step.number)}
              data-testid={`step-indicator-${step.number}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary text-white' : 
                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Content */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>Step {currentStep}: {steps[currentStep - 1].name}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Personal Information */}
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
              <div className="space-y-2 relative">
                <Label htmlFor="district_municipality">District Municipality *</Label>
                <div className="relative">
                  <Input
                    id="district_municipality"
                    placeholder="Search and select municipality..."
                    value={showMunicipalityDropdown ? municipalitySearch : formData.personal_info.district_municipality}
                    onChange={(e) => {
                      setMunicipalitySearch(e.target.value);
                      setShowMunicipalityDropdown(true);
                    }}
                    onFocus={() => {
                      setShowMunicipalityDropdown(true);
                      setMunicipalitySearch('');
                    }}
                    data-testid="input-district-municipality"
                    required
                  />
                  <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>
                {showMunicipalityDropdown && (
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white border border-slate-200 rounded-md shadow-lg">
                    {filteredMunicipalities.length > 0 ? (
                      filteredMunicipalities.map((municipality) => (
                        <button
                          key={municipality}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100"
                          onClick={() => {
                            updateField('personal_info', 'district_municipality', municipality);
                            setShowMunicipalityDropdown(false);
                            setMunicipalitySearch('');
                          }}
                        >
                          {municipality}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500">No municipalities found</div>
                    )}
                  </div>
                )}
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
              {formData.personal_info.disability === 'Yes' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="disability_description">Disability Description *</Label>
                    <Textarea
                      id="disability_description"
                      placeholder="Please describe your disability"
                      value={formData.personal_info.disability_description}
                      onChange={(e) => updateField('personal_info', 'disability_description', e.target.value)}
                      data-testid="input-disability-description"
                      rows={3}
                      required
                    />
                    <p className="text-xs text-slate-600">Provide details about your disability to help us accommodate your needs</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical_certificate">
                      Medical Certificate *
                      <Badge className="ml-2 bg-amber-100 text-amber-700">Required for Disability</Badge>
                    </Label>
                    <Input
                      id="medical_certificate"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateField('personal_info', 'medical_certificate', e.target.files[0]?.name || '')}
                      data-testid="input-medical-certificate"
                      required
                    />
                    <p className="text-xs text-slate-600">Upload a medical certificate confirming your disability</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Employment Details */}
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
                <Label htmlFor="performance_score">Performance Score (1-5) *</Label>
                <select
                  id="performance_score"
                  value={formData.employment_info.performance_score}
                  onChange={(e) => updateField('employment_info', 'performance_score', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="select-performance-score"
                  required
                >
                  <option value="">Select score</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
                <p className="text-xs text-slate-600">Select your most recent performance evaluation score</p>
              </div>
            </div>
          )}

          {/* Step 3: Training Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training_status">Training Status *</Label>
                  <select
                    id="training_status"
                    value={formData.training_info.training_status}
                    onChange={(e) => updateField('training_info', 'training_status', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="select-training-status"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="new">New Training</option>
                    <option value="continuation">Continuation</option>
                    <option value="upgrade">Upgrade/Advanced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_provider">Service Provider *</Label>
                  <Input
                    id="service_provider"
                    placeholder="Enter service provider name"
                    value={formData.training_info.service_provider}
                    onChange={(e) => updateField('training_info', 'service_provider', e.target.value)}
                    data-testid="input-service-provider"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training_type">Training Type *</Label>
                  <Input
                    id="training_type"
                    placeholder="e.g., Project Management, Excel Advanced"
                    value={formData.training_info.training_type}
                    onChange={(e) => updateField('training_info', 'training_type', e.target.value)}
                    data-testid="input-training-type"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total Amount (R) *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.training_info.total_amount}
                    onChange={(e) => updateField('training_info', 'total_amount', e.target.value)}
                    data-testid="input-total-amount"
                    required
                  />
                  <p className="text-xs text-slate-600">Enter the total training cost including VAT</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="supplier_type">Supplier Type *</Label>
                  <select
                    id="supplier_type"
                    value={formData.training_info.supplier_type}
                    onChange={(e) => updateField('training_info', 'supplier_type', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="select-supplier-type"
                    required
                  >
                    <option value="">Select supplier type</option>
                    <option value="preferred_supplier">Preferred Supplier</option>
                    <option value="rfq_required">RFQ Required (SCM Route)</option>
                  </select>
                </div>
              </div>

              {/* Document Requirements Info */}
              <div className={`rounded-lg p-4 ${isOverThreshold ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 mt-0.5 ${isOverThreshold ? 'text-amber-600' : 'text-blue-600'}`} />
                  <div>
                    <h4 className={`font-semibold ${isOverThreshold ? 'text-amber-900' : 'text-blue-900'}`}>
                      Required Documents for {isOverThreshold ? 'Training over R15,000' : 'Training under R15,000'}
                    </h4>
                    <p className={`text-sm mt-1 ${isOverThreshold ? 'text-amber-800' : 'text-blue-800'}`}>
                      Based on your training amount, please ensure you upload the following documents in Step 4:
                    </p>
                    <ul className={`text-sm mt-2 space-y-1 ml-4 list-disc ${isOverThreshold ? 'text-amber-700' : 'text-blue-700'}`}>
                      <li>Quotation</li>
                      <li>SBD 4 Form</li>
                      <li>Consent Form</li>
                      <li>CSD Report</li>
                      <li>BBBEE Certificate</li>
                      {isOverThreshold && <li className="font-semibold">Motivation (Required for amounts over R15,000)</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {isRFQRequired && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-purple-600" />
                    <div>
                      <h4 className="font-semibold text-purple-900">RFQ Route Selected</h4>
                      <p className="text-sm mt-1 text-purple-800">
                        Since you require SCM to go the RFQ route, please also upload:
                      </p>
                      <ul className="text-sm mt-2 space-y-1 ml-4 list-disc text-purple-700">
                        <li className="font-semibold">Scope of Work</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signed_performance_contract">Signed Performance Contract *</Label>
                  <Input
                    id="signed_performance_contract"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'signed_performance_contract', e.target.files[0]?.name || '')}
                    data-testid="input-signed-performance-contract"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload your signed performance contract</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quotation">Quotation *</Label>
                  <Input
                    id="quotation"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'quotation', e.target.files[0]?.name || '')}
                    data-testid="input-quotation"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload the quotation from the service provider</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sbd4_form">SBD 4 Form *</Label>
                  <Input
                    id="sbd4_form"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'sbd4_form', e.target.files[0]?.name || '')}
                    data-testid="input-sbd4-form"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload the completed SBD 4 declaration form</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consent_form">Consent Form *</Label>
                  <Input
                    id="consent_form"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'consent_form', e.target.files[0]?.name || '')}
                    data-testid="input-consent-form"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload the signed consent form</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csd_report">CSD Report *</Label>
                  <Input
                    id="csd_report"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'csd_report', e.target.files[0]?.name || '')}
                    data-testid="input-csd-report"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload the Central Supplier Database (CSD) report</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bbbee_certificate">BBBEE Certificate *</Label>
                  <Input
                    id="bbbee_certificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'bbbee_certificate', e.target.files[0]?.name || '')}
                    data-testid="input-bbbee-certificate"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload the service provider&apos;s BBBEE certificate</p>
                </div>

                {/* Motivation - Required for training over R15,000 */}
                {isOverThreshold && (
                  <div className="space-y-2">
                    <Label htmlFor="motivation">
                      Motivation *
                      <Badge className="ml-2 bg-amber-100 text-amber-700">Required for amounts over R15,000</Badge>
                    </Label>
                    <Input
                      id="motivation"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateField('documents', 'motivation', e.target.files[0]?.name || '')}
                      data-testid="input-motivation"
                      required
                    />
                    <p className="text-xs text-slate-600">Upload your motivation letter explaining the need for this training</p>
                  </div>
                )}

                {/* Scope of Work - Required if RFQ is selected */}
                {isRFQRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="scope_of_work">
                      Scope of Work *
                      <Badge className="ml-2 bg-purple-100 text-purple-700">Required for RFQ Route</Badge>
                    </Label>
                    <Input
                      id="scope_of_work"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateField('documents', 'scope_of_work', e.target.files[0]?.name || '')}
                      data-testid="input-scope-of-work"
                      required
                    />
                    <p className="text-xs text-slate-600">Upload the scope of work document for the RFQ process</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="other_documents">Other Supporting Documents (Optional)</Label>
                  <Input
                    id="other_documents"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={(e) => updateField('documents', 'other_documents', e.target.files[0]?.name || '')}
                    data-testid="input-other-documents"
                  />
                  <p className="text-xs text-slate-600">Upload any other relevant supporting documents</p>
                </div>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Declaration</h4>
                <p className="text-sm text-slate-700 mb-3">
                  By submitting this training application, I declare that:
                </p>
                <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                  <li>All information provided is accurate, complete, and truthful</li>
                  <li>I understand that providing false information may result in the cancellation of my training request</li>
                  <li>I consent to the verification of the information provided</li>
                  <li>I agree to comply with all training terms and conditions</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                Save Draft
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNext} className="gap-2">
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

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Training Application Summary
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Personal Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Name:</span> {formData.personal_info.surname} {formData.personal_info.name}</div>
                <div><span className="text-slate-500">ID:</span> {formData.personal_info.id_number}</div>
                <div><span className="text-slate-500">Municipality:</span> {formData.personal_info.district_municipality}</div>
                <div><span className="text-slate-500">Disability:</span> {formData.personal_info.disability}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Employment Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Division:</span> {formData.employment_info.division}</div>
                <div><span className="text-slate-500">Department:</span> {formData.employment_info.department}</div>
                <div><span className="text-slate-500">Position:</span> {formData.employment_info.position_description}</div>
                <div><span className="text-slate-500">Score:</span> {formData.employment_info.performance_score}</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Training Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Status:</span> {formData.training_info.training_status}</div>
                <div><span className="text-slate-500">Service Provider:</span> {formData.training_info.service_provider}</div>
                <div><span className="text-slate-500">Training Type:</span> {formData.training_info.training_type}</div>
                <div><span className="text-slate-500">Amount:</span> R{formData.training_info.total_amount}</div>
                <div><span className="text-slate-500">Supplier Type:</span> {formData.training_info.supplier_type}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSummary(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingApplicationPage;
