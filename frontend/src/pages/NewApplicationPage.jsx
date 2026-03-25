import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { applicationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, User, Briefcase, GraduationCap, Upload, Eye, Search, Lock, Unlock } from 'lucide-react';
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
  { number: 3, name: 'Academic & Bursary Details', description: 'Study and bursary information', icon: GraduationCap },
  { number: 4, name: 'Documents & Submission', description: 'Required documents and final submission', icon: Upload },
];

const NewApplicationPage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const { user } = useAuth();
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
    academic_bursary_info: {
      bursary_status: '',
      institution: '',
      course_of_study: '',
      total_amount_requested: '',
      applicant_type: '',
    },
    documents: {
      signed_performance_contract: '',
      academic_transcript: '',
      proof_of_registration: '',
      quotation_amount_requested: '',
      motivation_document: '',
      other_documents: '',
    },
  });

  // Search state for district municipality dropdown
  const [municipalitySearch, setMunicipalitySearch] = useState('');
  const [showMunicipalityDropdown, setShowMunicipalityDropdown] = useState(false);

  const filteredMunicipalities = DISTRICT_MUNICIPALITIES.filter(m =>
    m.toLowerCase().includes(municipalitySearch.toLowerCase())
  );

  const [applicationLocked, setApplicationLocked] = useState(false);
  const [appIsLocked, setAppIsLocked] = useState(false);
  const [appStatus, setAppStatus] = useState('draft');
  const isAdmin = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  // Load existing application data when editing
  useEffect(() => {
    if (isEditing) {
      setLoadingApplication(true);
      applicationsAPI.getOne(id)
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
              division: '', department: '', position_description: '', date_of_appointment: '', performance_score: ''
            },
            academic_bursary_info: app.academic_bursary_info || {
              bursary_status: '', institution: '', course_of_study: '', total_amount_requested: '', applicant_type: ''
            },
            documents: app.documents || {
              signed_performance_contract: '', academic_transcript: '', proof_of_registration: '', quotation_amount_requested: '', motivation_document: '', other_documents: ''
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
        await applicationsAPI.unlock(id);
        setAppIsLocked(false);
        setApplicationLocked(false);
        toast.success('Application unlocked — applicant notified');
      } else {
        await applicationsAPI.lock(id);
        setAppIsLocked(true);
        toast.success('Application locked');
      }
    } catch { toast.error('Failed to update lock status'); }
  };


  const updateField = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const isNewApplicant = formData.academic_bursary_info.applicant_type === 'NEW APPLICANT';
  const isContinuationApplicant = formData.academic_bursary_info.applicant_type === 'CONTINUATION';

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      if (isEditing) {
        await applicationsAPI.update(id, {
          ...formData,
          current_step: currentStep,
        });
        toast.success('Application saved successfully');
      } else {
        await applicationsAPI.create({
          ...formData,
          status: 'draft',
          current_step: currentStep,
        });
        toast.success('Draft saved successfully');
      }
      navigate('/applications');
    } catch (error) {
      toast.error('Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isEditing) {
        await applicationsAPI.update(id, {
          ...formData,
          status: 'pending',
          current_step: 4,
        });
      } else {
        await applicationsAPI.create({
          ...formData,
          status: 'pending',
          current_step: 4,
        });
      }
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

  const getSummarySection = (title, data) => {
    const entries = Object.entries(data).filter(([key, value]) => value && value !== '');
    if (entries.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h4 className="font-semibold text-slate-900 mb-3 border-b pb-2">{title}</h4>
        <div className="grid grid-cols-2 gap-3">
          {entries.map(([key, value]) => (
            <div key={key}>
              <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</p>
              <p className="text-sm font-medium text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loadingApplication) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="new-application-page">
      {/* Admin/Head lock control bar */}
      {isEditing && isAdmin && appStatus !== 'draft' && (
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
      {applicationLocked && !isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg" data-testid="locked-banner">
          <Lock className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-800">This application is locked</p>
            <p className="text-xs text-rose-600">An admin or group leader must unlock it before you can make changes.</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">
            {isEditing ? 'Continue Application' : 'New Bursary Application'}
          </h2>
          <p className="text-slate-600 mt-1">Complete all steps to submit your application</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowSummary(true)}
          data-testid="view-summary-btn"
        >
          <Eye className="w-4 h-4" />
          View Summary
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
              currentStep === step.number
                ? 'border-primary bg-primary/5'
                : currentStep > step.number
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white'
            }`}
            onClick={() => setCurrentStep(step.number)}
            data-testid={`step-indicator-${step.number}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  currentStep === step.number
                    ? 'bg-primary text-white'
                    : currentStep > step.number
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {currentStep > step.number ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
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

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicant_type">Applicant Type *</Label>
                  <select
                    id="applicant_type"
                    value={formData.academic_bursary_info.applicant_type}
                    onChange={(e) => {
                      updateField('academic_bursary_info', 'applicant_type', e.target.value);
                      // Reset bursary status for new applicants
                      if (e.target.value === 'NEW APPLICANT') {
                        updateField('academic_bursary_info', 'bursary_status', '');
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    data-testid="select-applicant-type"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="NEW APPLICANT">NEW APPLICANT</option>
                    <option value="CONTINUATION">CONTINUATION</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bursary_status">
                    Bursary Status {isContinuationApplicant ? '*' : '(Not applicable for new applicants)'}
                  </Label>
                  <select
                    id="bursary_status"
                    value={formData.academic_bursary_info.bursary_status}
                    onChange={(e) => updateField('academic_bursary_info', 'bursary_status', e.target.value)}
                    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isNewApplicant 
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'border-slate-200 bg-white'
                    }`}
                    data-testid="select-bursary-status"
                    disabled={isNewApplicant}
                    required={isContinuationApplicant}
                  >
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                  {isNewApplicant && (
                    <p className="text-xs text-amber-600">Bursary status is disabled for new applicants</p>
                  )}
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
                
                {/* Academic Transcript - Only for Continuation Applicants */}
                {isContinuationApplicant && (
                  <div className="space-y-2">
                    <Label htmlFor="academic_transcript">
                      Academic Transcript / Statement of Results *
                      <Badge className="ml-2 bg-blue-100 text-blue-700">Continuation Applicants Only</Badge>
                    </Label>
                    <Input
                      id="academic_transcript"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateField('documents', 'academic_transcript', e.target.files[0]?.name || '')}
                      data-testid="input-academic-transcript"
                      required
                    />
                    <p className="text-xs text-slate-600">Upload your most recent academic transcript or statement of results</p>
                  </div>
                )}

                {isNewApplicant && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Academic transcript is not required for new applicants. You will be required to submit it when you become a continuation applicant.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="proof_of_registration">Proof of Registration / Acceptance Letter *</Label>
                  <Input
                    id="proof_of_registration"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'proof_of_registration', e.target.files[0]?.name || '')}
                    data-testid="input-proof-of-registration"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload your Proof of Registration / Acceptance Letter from the institution</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quotation_amount_requested">Quotation Amount Requested *</Label>
                  <Input
                    id="quotation_amount_requested"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'quotation_amount_requested', e.target.files[0]?.name || '')}
                    data-testid="input-quotation-amount-requested"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload your quotation or fee statement showing the amount requested</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motivation_document">Motivation Document *</Label>
                  <Input
                    id="motivation_document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => updateField('documents', 'motivation_document', e.target.files[0]?.name || '')}
                    data-testid="input-motivation-document"
                    required
                  />
                  <p className="text-xs text-slate-600">Upload your motivation letter explaining why you are applying for this bursary</p>
                </div>
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
                  By submitting this application, I declare that:
                </p>
                <ul className="text-sm text-slate-700 space-y-1 ml-4 list-disc">
                  <li>All information provided is accurate, complete, and truthful</li>
                  <li>I understand that providing false information may result in the cancellation of my bursary</li>
                  <li>I consent to the verification of the information provided</li>
                  <li>I agree to comply with all bursary terms and conditions</li>
                </ul>
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

      {/* Application Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Application Summary
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {getSummarySection('Personal Information', formData.personal_info)}
            {getSummarySection('Employment Details', formData.employment_info)}
            {getSummarySection('Academic & Bursary Information', formData.academic_bursary_info)}
            {getSummarySection('Documents', formData.documents)}
            
            {Object.values(formData).every(section => 
              Object.values(section).every(val => !val || val === '')
            ) && (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No information entered yet. Start filling out the form to see your summary.</p>
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

export default NewApplicationPage;
