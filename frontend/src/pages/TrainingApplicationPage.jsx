import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { trainingApplicationsAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, User, Briefcase, GraduationCap, Upload, Eye, Search, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const { user } = useAuth();
  const [applicationLocked, setApplicationLocked] = useState(false);
  const [appIsLocked, setAppIsLocked] = useState(false);
  const [appStatus, setAppStatus] = useState('draft');
  const isAdmin = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));
  const isAdminOrHead = isAdmin || !!user?.is_head;
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
      type_of_employment: '',
      date_of_appointment: '',
      years_of_service: '',
      performance_score: '',
    },
    training_info: {
      training_date: '',
      training_delivery: '',
      service_provider: '',
      training_type: '',
      total_amount: '',
      supplier_type: '',
    },
    documents: {
      signed_performance_contract: '',
      quotation: '',
      sbd4_form: '',
      sbd1_form: '',
      consent_form: '',
      csd_report: '',
      bbbee_certificate: '',
      motivation: '',
      scope_of_work: '',
      other_documents: '',
    },
    additional_expenses: {
      flights: '',
      accommodation: '',
      car_hire_or_shuttle: '',
      catering: '',
      flights_notes: '',
      accommodation_notes: '',
      car_hire_or_shuttle_notes: '',
      catering_notes: '',
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
          setAppStatus(app.status || 'draft');
          setAppIsLocked(!!app.is_locked);
          if (app.is_locked && app.status !== 'draft' && !user?.roles?.some(r => ['super_admin','admin'].includes(r))) {
            setApplicationLocked(true);
          }
          setFormData({
            personal_info: app.personal_info || {
              surname: '', name: '', id_number: '', race: '', gender: '', disability: '', disability_description: '', medical_certificate: '', district_municipality: ''
            },
            employment_info: app.employment_info || {
              division: '', department: '', position_description: '', type_of_employment: '', date_of_appointment: '', years_of_service: '', performance_score: ''
            },
            training_info: {
              training_date: app.training_info?.training_date || app.training_info?.training_status || '',
              training_delivery: app.training_info?.training_delivery || '',
              service_provider: app.training_info?.service_provider || '',
              training_type: app.training_info?.training_type || '',
              total_amount: app.training_info?.total_amount || '',
              supplier_type: app.training_info?.supplier_type || '',
            },
            documents: app.documents || {
              signed_performance_contract: '', quotation: '', sbd4_form: '', sbd1_form: '', consent_form: '', csd_report: '', bbbee_certificate: '', motivation: '', scope_of_work: '', other_documents: ''
            },
            additional_expenses: app.additional_expenses || {
              flights: '', accommodation: '', car_hire_or_shuttle: '', catering: '', flights_notes: '', accommodation_notes: '', car_hire_or_shuttle_notes: '', catering_notes: ''
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

  const handleToggleLock = async () => {
    try {
      if (appIsLocked) {
        await trainingApplicationsAPI.unlock(id);
        setAppIsLocked(false);
        setApplicationLocked(false);
        toast.success('Application unlocked — applicant notified');
      } else {
        await trainingApplicationsAPI.lock(id);
        setAppIsLocked(true);
        toast.success('Application locked');
      }
    } catch { toast.error('Failed to update lock status'); }
  };


  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Auto-populate employee details when SA ID number is entered (13 digits)
  const [lookingUp, setLookingUp] = useState(false);
  const handleIdNumberChange = async (value) => {
    updateField('personal_info', 'id_number', value);
    if (value.length === 13) {
      setLookingUp(true);
      try {
        const res = await usersAPI.lookupByIdNumber(value);
        const data = res.data;
        if (data.found) {
          setFormData(prev => ({
            ...prev,
            personal_info: {
              ...prev.personal_info,
              id_number: value,
              surname: data.surname || prev.personal_info.surname,
              name: data.name || prev.personal_info.name,
              race: data.race || prev.personal_info.race,
              gender: data.gender || prev.personal_info.gender,
            },
            employment_info: {
              ...prev.employment_info,
              division: data.division || prev.employment_info.division,
              department: data.department || prev.employment_info.department,
              position_description: data.position || prev.employment_info.position_description,
              years_of_service: data.years_of_service ? String(data.years_of_service) : prev.employment_info.years_of_service,
            },
          }));
          toast.success('Employee details auto-populated');
        }
      } catch {
        // Not found — user fills manually
      } finally {
        setLookingUp(false);
      }
    }
  };

  // Convert file to base64 and store in form
  const handleFileUpload = (section, field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateField(section, field, JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
      }));
    };
    reader.readAsDataURL(file);
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

  // Auto-calculate years of service when date_of_appointment changes
  const handleDateOfAppointment = (value) => {
    updateField('employment_info', 'date_of_appointment', value);
    if (value) {
      const appointDate = new Date(value);
      const now = new Date();
      const diffYears = (now - appointDate) / (365.25 * 24 * 60 * 60 * 1000);
      updateField('employment_info', 'years_of_service', diffYears.toFixed(1));
    }
  };

  const handleNext = () => {
    // Step 2 validation — employment eligibility checks
    if (currentStep === 2) {
      const emp = formData.employment_info;
      const score = parseFloat(emp.performance_score);
      const employmentType = emp.type_of_employment;
      const yearsOfService = parseFloat(emp.years_of_service) || 0;

      if (score && score < 3) {
        toast.error('You are not eligible to apply. Your performance score must be 3 or above.');
        return;
      }
      if (employmentType === 'Temporary Contract') {
        toast.error('Employees on a Temporary Contract are not eligible to apply for training.');
        return;
      }
      if (employmentType === 'Permanent' && yearsOfService < 1) {
        toast.error('Permanent employees must have at least 1 year of service to be eligible. Your current service: ' + yearsOfService.toFixed(1) + ' years.');
        return;
      }
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  // Compute eligibility for greying out Next/Submit buttons
  const getEligibility = () => {
    const emp = formData.employment_info;
    const score = parseFloat(emp.performance_score);
    const employmentType = emp.type_of_employment;
    const yearsOfService = parseFloat(emp.years_of_service) || 0;
    if (score && score < 3) return false;
    if (employmentType === 'Temporary Contract') return false;
    if (employmentType === 'Permanent' && yearsOfService > 0 && yearsOfService < 1) return false;
    return true;
  };
  const isEligible = getEligibility();

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Calculate if training is over R15,000
  const totalAmount = parseFloat(formData.training_info.total_amount) || 0;
  const isOverThreshold = totalAmount > 15000;
  const supplierType = formData.training_info.supplier_type;
  const isScmRoute = supplierType === 'scm_route';
  const isInternalTraining = supplierType === 'internal_training';
  const isPreferredInternational = supplierType === 'preferred_international';

  if (loadingApplication) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="training-application-page">
      {/* Admin/Head lock control bar */}
      {isEditing && isAdminOrHead && appStatus !== 'draft' && (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${appIsLocked ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`} data-testid="admin-lock-bar">
          <div className="flex items-center gap-3">
            {appIsLocked ? <Lock className="w-5 h-5 text-rose-600" /> : <Unlock className="w-5 h-5 text-emerald-600" />}
            <div>
              <p className={`text-sm font-semibold ${appIsLocked ? 'text-rose-800' : 'text-emerald-800'}`}>
                {appIsLocked ? 'Application is locked' : 'Application is unlocked'}
              </p>
              <p className={`text-xs ${appIsLocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                {appIsLocked ? 'Employee cannot edit. Click unlock to allow editing.' : 'Employee can edit this application.'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className={`gap-1.5 ${appIsLocked ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'text-rose-700 border-rose-300 hover:bg-rose-100'}`}
            onClick={handleToggleLock} data-testid="toggle-lock-btn">
            {appIsLocked ? <><Unlock className="w-4 h-4" /> Unlock</> : <><Lock className="w-4 h-4" /> Lock</>}
          </Button>
        </div>
      )}
      {/* Employee lock warning */}
      {applicationLocked && !isAdminOrHead && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg" data-testid="locked-banner">
          <Lock className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">This application is locked</p>
            <p className="text-xs text-rose-600">An admin or group leader must unlock it before you can make changes.</p>
          </div>
        </div>
      )}
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
                <Label htmlFor="id_number">ID Number * {lookingUp && <span className="text-primary text-xs ml-1">Looking up...</span>}</Label>
                <Input
                  id="id_number"
                  placeholder="Enter 13-digit ID number"
                  value={formData.personal_info.id_number}
                  onChange={(e) => handleIdNumberChange(e.target.value)}
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
                      onChange={(e) => handleFileUpload('personal_info', 'medical_certificate', e.target.files[0])}
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
                <Label htmlFor="type_of_employment">Type of Employment *</Label>
                <select
                  id="type_of_employment"
                  value={formData.employment_info.type_of_employment}
                  onChange={(e) => updateField('employment_info', 'type_of_employment', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="select-type-of-employment"
                  required
                >
                  <option value="">Select type of employment</option>
                  <option value="Permanent">Permanent</option>
                  <option value="5-year fixed term contract">5-year fixed term contract</option>
                  <option value="3-year fixed term contract">3-year fixed term contract</option>
                  <option value="Temporary Contract">Temporary Contract</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_appointment">Date of Appointment *</Label>
                <Input
                  id="date_of_appointment"
                  type="date"
                  value={formData.employment_info.date_of_appointment}
                  onChange={(e) => handleDateOfAppointment(e.target.value)}
                  data-testid="input-date-of-appointment"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_of_service">Years of Service</Label>
                <Input
                  id="years_of_service"
                  value={formData.employment_info.years_of_service ? `${formData.employment_info.years_of_service} years` : ''}
                  readOnly
                  className="bg-slate-50"
                  data-testid="input-years-of-service"
                  placeholder="Auto-calculated from date of appointment"
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
                {formData.employment_info.performance_score && parseFloat(formData.employment_info.performance_score) < 3 ? (
                  <p className="text-xs text-rose-600 font-medium">Score below 3 — not eligible to proceed</p>
                ) : (
                  <p className="text-xs text-slate-600">Select your most recent performance evaluation score</p>
                )}
                {formData.employment_info.type_of_employment === 'Temporary Contract' && (
                  <p className="text-xs text-rose-600 font-medium">Temporary Contract employees are not eligible to apply</p>
                )}
                {formData.employment_info.type_of_employment === 'Permanent' &&
                  formData.employment_info.years_of_service && parseFloat(formData.employment_info.years_of_service) < 1 && (
                  <p className="text-xs text-rose-600 font-medium">Less than 1 year of service — not eligible to apply</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Training Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Supplier Type - At the top */}
              <div className="space-y-2">
                <Label htmlFor="supplier_type">Supplier Type *</Label>
                <select
                  id="supplier_type"
                  value={formData.training_info.supplier_type}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateField('training_info', 'supplier_type', val);
                    if (val === 'internal_training') {
                      updateField('training_info', 'service_provider', 'Sentech');
                    } else if (formData.training_info.service_provider === 'Sentech') {
                      updateField('training_info', 'service_provider', '');
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  data-testid="select-supplier-type"
                  required
                >
                  <option value="">Select supplier type</option>
                  <option value="preferred_local">Preferred supplier (Local)</option>
                  <option value="preferred_international">Preferred supplier (International)</option>
                  <option value="scm_route">SCM route</option>
                  <option value="internal_training">Internal Training</option>
                </select>
              </div>

              {/* SCM Route Info Box */}
              {isScmRoute && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-purple-600" />
                    <div>
                      <h4 className="font-semibold text-purple-900">SCM Route Selected</h4>
                      <p className="text-sm mt-1 text-purple-800">
                        Since you selected the SCM route, you only need to upload the Scope of Work document in Step 4.
                        All other fields and documents will be handled through the SCM process.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Training Info Box */}
              {isInternalTraining && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-emerald-600" />
                    <div>
                      <h4 className="font-semibold text-emerald-900">Internal Training Selected</h4>
                      <p className="text-sm mt-1 text-emerald-800">
                        Internal training (Sentech) does not require any document uploads. The supplier name has been set to Sentech automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Other fields - disabled when SCM or Internal Training is selected */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training_date" className={isScmRoute ? 'text-slate-400' : ''}>
                    Training Date {!isScmRoute && '*'}
                  </Label>
                  <Input
                    id="training_date"
                    type="date"
                    value={formData.training_info.training_date}
                    onChange={(e) => updateField('training_info', 'training_date', e.target.value)}
                    className={isScmRoute ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                    data-testid="input-training-date"
                    disabled={isScmRoute}
                    required={!isScmRoute}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training_delivery" className={isScmRoute ? 'text-slate-400' : ''}>
                    Training Delivery {!isScmRoute && '*'}
                  </Label>
                  <select
                    id="training_delivery"
                    value={formData.training_info.training_delivery}
                    onChange={(e) => updateField('training_info', 'training_delivery', e.target.value)}
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isScmRoute
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 bg-white'
                    }`}
                    data-testid="select-training-delivery"
                    disabled={isScmRoute}
                    required={!isScmRoute}
                  >
                    <option value="">Select delivery mode</option>
                    <option value="digital">Digital</option>
                    <option value="non-digital">Non-digital</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_provider" className={(isScmRoute || isInternalTraining) ? 'text-slate-400' : ''}>
                    Service Provider {!(isScmRoute || isInternalTraining) && '*'}
                  </Label>
                  <Input
                    id="service_provider"
                    placeholder="Enter service provider name"
                    value={formData.training_info.service_provider}
                    onChange={(e) => updateField('training_info', 'service_provider', e.target.value)}
                    className={(isScmRoute || isInternalTraining) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                    data-testid="input-service-provider"
                    disabled={isScmRoute || isInternalTraining}
                    required={!(isScmRoute || isInternalTraining)}
                  />
                  {isInternalTraining && <p className="text-xs text-emerald-600">Auto-set to Sentech for internal training</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training_type" className={isScmRoute ? 'text-slate-400' : ''}>
                    Training Type {!isScmRoute && '*'}
                  </Label>
                  <Input
                    id="training_type"
                    placeholder="e.g., Project Management, Excel Advanced"
                    value={formData.training_info.training_type}
                    onChange={(e) => updateField('training_info', 'training_type', e.target.value)}
                    className={isScmRoute ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                    data-testid="input-training-type"
                    disabled={isScmRoute}
                    required={!isScmRoute}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_amount" className={(isScmRoute || isInternalTraining) ? 'text-slate-400' : ''}>
                    Total Amount (R) {!(isScmRoute || isInternalTraining) && '*'}
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    placeholder="e.g., 15000"
                    value={formData.training_info.total_amount}
                    onChange={(e) => updateField('training_info', 'total_amount', e.target.value)}
                    className={(isScmRoute || isInternalTraining) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                    data-testid="input-total-amount"
                    disabled={isScmRoute || isInternalTraining}
                    required={!(isScmRoute || isInternalTraining)}
                  />
                  {!(isScmRoute || isInternalTraining) && <p className="text-xs text-slate-600">Enter the total training cost including VAT</p>}
                </div>
              </div>

              {/* Document Requirements Info - Only show for preferred suppliers */}
              {!isScmRoute && !isInternalTraining && supplierType && (
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
                        {isOverThreshold
                          ? <li className="font-semibold">Motivation (replaces Performance Contract for amounts over R15,000)</li>
                          : <li>Signed Performance Contract</li>
                        }
                        <li>Quotation</li>
                        <li>{isPreferredInternational ? 'SBD 1 Form' : 'SBD 4 Form'}</li>
                        <li>Consent Form</li>
                        <li>CSD Report</li>
                        <li>BBBEE Certificate</li>
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
              {/* Internal Training - No documents needed */}
              {isInternalTraining ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 mt-0.5 text-emerald-600" />
                      <div>
                        <h4 className="font-semibold text-emerald-900">Internal Training — No Documents Required</h4>
                        <p className="text-sm mt-1 text-emerald-800">
                          Since you selected Internal Training (Sentech), no document uploads are required. You may proceed to submit your application.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isScmRoute ? (
                /* SCM Route - Only show Scope of Work */
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 mt-0.5 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-purple-900">SCM Route Selected</h4>
                        <p className="text-sm mt-1 text-purple-800">
                          Since you selected the SCM route, please upload only the Scope of Work document.
                          All other documents will be handled through the SCM process.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scope_of_work">
                      Scope of Work *
                      <Badge className="ml-2 bg-purple-100 text-purple-700">Required for SCM Route</Badge>
                    </Label>
                    <Input
                      id="scope_of_work"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('documents', 'scope_of_work', e.target.files[0])}
                      data-testid="input-scope-of-work"
                      required
                    />
                    <p className="text-xs text-slate-600">Upload the scope of work document for the SCM process</p>
                  </div>
                </div>
              ) : (
                /* Preferred Supplier (Local/International) - Show document uploads */
                <div className="space-y-4">
                  {/* Conditional: Motivation (>R15k) OR Performance Contract (<=R15k) */}
                  {isOverThreshold ? (
                    <div className="space-y-2">
                      <Label htmlFor="motivation">
                        Motivation *
                        <Badge className="ml-2 bg-amber-100 text-amber-700">Required — training over R15,000</Badge>
                      </Label>
                      <Input
                        id="motivation"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('documents', 'motivation', e.target.files[0])}
                        data-testid="input-motivation"
                        required
                      />
                      <p className="text-xs text-slate-600">Upload a motivation letter explaining the need for this training (replaces performance contract for amounts over R15,000)</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="signed_performance_contract">Signed Performance Contract *</Label>
                      <Input
                        id="signed_performance_contract"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('documents', 'signed_performance_contract', e.target.files[0])}
                        data-testid="input-signed-performance-contract"
                        required
                      />
                      <p className="text-xs text-slate-600">Upload your signed performance contract</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="quotation">Quotation *</Label>
                    <Input
                      id="quotation"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('documents', 'quotation', e.target.files[0])}
                      data-testid="input-quotation"
                      required
                    />
                    <p className="text-xs text-slate-600">Upload the quotation from the service provider</p>
                  </div>

                  {isPreferredInternational ? (
                    <div className="space-y-2">
                      <Label htmlFor="sbd1_form">SBD 1 Form *</Label>
                      <Input
                        id="sbd1_form"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('documents', 'sbd1_form', e.target.files[0])}
                        data-testid="input-sbd1-form"
                        required
                      />
                      <p className="text-xs text-slate-600">Upload the completed SBD 1 form (required for international suppliers)</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="sbd4_form">SBD 4 Form *</Label>
                      <Input
                        id="sbd4_form"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('documents', 'sbd4_form', e.target.files[0])}
                        data-testid="input-sbd4-form"
                        required
                      />
                      <p className="text-xs text-slate-600">Upload the completed SBD 4 declaration form</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="consent_form">Consent Form *</Label>
                    <Input
                      id="consent_form"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('documents', 'consent_form', e.target.files[0])}
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
                      onChange={(e) => handleFileUpload('documents', 'csd_report', e.target.files[0])}
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
                      onChange={(e) => handleFileUpload('documents', 'bbbee_certificate', e.target.files[0])}
                      data-testid="input-bbbee-certificate"
                      required
                    />
                    <p className="text-xs text-slate-600">Upload the service provider&apos;s BBBEE certificate</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="other_documents">Other Supporting Documents (Optional)</Label>
                    <Input
                      id="other_documents"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => handleFileUpload('documents', 'other_documents', e.target.files[0])}
                      data-testid="input-other-documents"
                    />
                    <p className="text-xs text-slate-600">Upload any other relevant supporting documents</p>
                  </div>
                </div>
              )}
              
              {/* Additional Training Expenses */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">Additional Training Expenses</h3>
                  <Badge className="bg-blue-100 text-blue-700">Optional</Badge>
                </div>
                <p className="text-sm text-slate-600 -mt-2">Other costs associated with this training. Leave blank if not applicable.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Label htmlFor="expense_flights">Flights</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">R</span>
                      <Input
                        id="expense_flights"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.additional_expenses.flights}
                        onChange={(e) => updateField('additional_expenses', 'flights', e.target.value)}
                        data-testid="input-expense-flights"
                      />
                    </div>
                    <Input
                      placeholder="Notes (e.g., return trip JHB-CPT)"
                      value={formData.additional_expenses.flights_notes}
                      onChange={(e) => updateField('additional_expenses', 'flights_notes', e.target.value)}
                      data-testid="input-expense-flights-notes"
                    />
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Label htmlFor="expense_accommodation">Accommodation</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">R</span>
                      <Input
                        id="expense_accommodation"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.additional_expenses.accommodation}
                        onChange={(e) => updateField('additional_expenses', 'accommodation', e.target.value)}
                        data-testid="input-expense-accommodation"
                      />
                    </div>
                    <Input
                      placeholder="Notes (e.g., 3 nights hotel)"
                      value={formData.additional_expenses.accommodation_notes}
                      onChange={(e) => updateField('additional_expenses', 'accommodation_notes', e.target.value)}
                      data-testid="input-expense-accommodation-notes"
                    />
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Label htmlFor="expense_car_hire">Car Hire or Shuttle</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">R</span>
                      <Input
                        id="expense_car_hire"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.additional_expenses.car_hire_or_shuttle}
                        onChange={(e) => updateField('additional_expenses', 'car_hire_or_shuttle', e.target.value)}
                        data-testid="input-expense-car-hire"
                      />
                    </div>
                    <Input
                      placeholder="Notes (e.g., airport shuttle service)"
                      value={formData.additional_expenses.car_hire_or_shuttle_notes}
                      onChange={(e) => updateField('additional_expenses', 'car_hire_or_shuttle_notes', e.target.value)}
                      data-testid="input-expense-car-hire-notes"
                    />
                  </div>

                  <div className="space-y-2 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <Label htmlFor="expense_catering">Catering</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-500">R</span>
                      <Input
                        id="expense_catering"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.additional_expenses.catering}
                        onChange={(e) => updateField('additional_expenses', 'catering', e.target.value)}
                        data-testid="input-expense-catering"
                      />
                    </div>
                    <Input
                      placeholder="Notes (e.g., lunch for 5 days)"
                      value={formData.additional_expenses.catering_notes}
                      onChange={(e) => updateField('additional_expenses', 'catering_notes', e.target.value)}
                      data-testid="input-expense-catering-notes"
                    />
                  </div>
                </div>

                {/* Total Additional Expenses */}
                {(parseFloat(formData.additional_expenses.flights || 0) + parseFloat(formData.additional_expenses.accommodation || 0) + parseFloat(formData.additional_expenses.car_hire_or_shuttle || 0) + parseFloat(formData.additional_expenses.catering || 0)) > 0 && (
                  <div className="flex justify-end">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-right">
                      <span className="text-sm text-blue-700">Total Additional Expenses: </span>
                      <span className="text-lg font-bold text-blue-900" data-testid="total-additional-expenses">
                        R {(parseFloat(formData.additional_expenses.flights || 0) + parseFloat(formData.additional_expenses.accommodation || 0) + parseFloat(formData.additional_expenses.car_hire_or_shuttle || 0) + parseFloat(formData.additional_expenses.catering || 0)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
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
                <Button onClick={handleNext} className="gap-2" disabled={currentStep === 2 && !isEligible}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || !isEligible} data-testid="submit-application-btn">
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
            <DialogDescription>Review all entered information before submission</DialogDescription>
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
                <div><span className="text-slate-500">Training Date:</span> {formData.training_info.training_date}</div>
                <div><span className="text-slate-500">Training Delivery:</span> {formData.training_info.training_delivery === 'digital' ? 'Digital' : formData.training_info.training_delivery === 'non-digital' ? 'Non-digital' : ''}</div>
                <div><span className="text-slate-500">Service Provider:</span> {formData.training_info.service_provider}</div>
                <div><span className="text-slate-500">Training Type:</span> {formData.training_info.training_type}</div>
                <div><span className="text-slate-500">Amount:</span> R{formData.training_info.total_amount}</div>
                <div><span className="text-slate-500">Supplier Type:</span> {
                  formData.training_info.supplier_type === 'preferred_local' ? 'Preferred supplier (Local)' :
                  formData.training_info.supplier_type === 'preferred_international' ? 'Preferred supplier (International)' :
                  formData.training_info.supplier_type === 'scm_route' ? 'SCM route' :
                  formData.training_info.supplier_type === 'internal_training' ? 'Internal Training (Sentech)' :
                  formData.training_info.supplier_type
                }</div>
              </div>
            </div>
            {(parseFloat(formData.additional_expenses?.flights || 0) + parseFloat(formData.additional_expenses?.accommodation || 0) + parseFloat(formData.additional_expenses?.car_hire_or_shuttle || 0) + parseFloat(formData.additional_expenses?.catering || 0)) > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">Additional Training Expenses</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {parseFloat(formData.additional_expenses?.flights || 0) > 0 && <div><span className="text-slate-500">Flights:</span> R{parseFloat(formData.additional_expenses.flights).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{formData.additional_expenses.flights_notes ? ` — ${formData.additional_expenses.flights_notes}` : ''}</div>}
                  {parseFloat(formData.additional_expenses?.accommodation || 0) > 0 && <div><span className="text-slate-500">Accommodation:</span> R{parseFloat(formData.additional_expenses.accommodation).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{formData.additional_expenses.accommodation_notes ? ` — ${formData.additional_expenses.accommodation_notes}` : ''}</div>}
                  {parseFloat(formData.additional_expenses?.car_hire_or_shuttle || 0) > 0 && <div><span className="text-slate-500">Car Hire/Shuttle:</span> R{parseFloat(formData.additional_expenses.car_hire_or_shuttle).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{formData.additional_expenses.car_hire_or_shuttle_notes ? ` — ${formData.additional_expenses.car_hire_or_shuttle_notes}` : ''}</div>}
                  {parseFloat(formData.additional_expenses?.catering || 0) > 0 && <div><span className="text-slate-500">Catering:</span> R{parseFloat(formData.additional_expenses.catering).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}{formData.additional_expenses.catering_notes ? ` — ${formData.additional_expenses.catering_notes}` : ''}</div>}
                </div>
              </div>
            )}
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
