import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  X,
  Briefcase,
  Building,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  Users,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { parseFile } from '@/lib/fileParser';
import { jobsApi } from '@/services/jobs.service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROUTES, getJobDetailsPath } from '@/config/routes.constants';
import { useCredits } from '@/contexts/CreditContext';
import { JDBuilder, JobDetails } from '../components/JDBuilder';
import { SearchableSelect } from '@/components/ui/searchable-select';

const DEPARTMENTS = [
  "Engineering",
  "Software Development",
  "IT Support",
  "Infrastructure",
  "Data Science",
  "AI / ML",
  "Cybersecurity",
  "Quality Assurance",
  "DevOps / SRE",

  "Sales",
  "Business Development",
  "Pre-sales",
  "Account Management",
  "Customer Success",

  "Marketing",
  "Content",
  "Performance Marketing",
  "SEO",
  "Brand",
  "Product Marketing",
  "Growth",

  "Operations",
  "Admin",
  "Logistics",
  "Procurement",
  "Supply Chain",
  "Facilities Management",

  "Product",
  "Project Management",
  "Program Management",

  "Design",
  "UI/UX",
  "Graphic Design",
  "Motion Design",
  "Creative",

  "Human Resources",
  "Talent Acquisition",
  "L&D (Learning & Development)",
  "HR Operations",

  "Finance",
  "Accounting",
  "Audit",
  "Legal",
  "Compliance",
  "Investor Relations",

  "Support",
  "Customer Service",
  "Call Center",

  "Medical",
  "Nursing",
  "Pharmacy",
  "Clinical Operations",

  "Manufacturing",
  "Production",
  "Quality Control",

  "Research & Development",
  "Scientific Research",

  "Other"
];
const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
  "Temporary",
  "Consultant",
  "Volunteer",
  "Apprenticeship",
  "Seasonal"
];
const SENIORITY_LEVELS = [
  "Intern",
  "Trainee",
  "Entry",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Principal",
  "Staff",
  "Manager",
  "Senior Manager",
  "Director",
  "Senior Director",
  "VP",
  "SVP",
  "C-level (CXO)",
  "Founder",
  "Executive"
];

const COMPANY_TYPES = [
  "Early Startup",
  "Seed Stage",
  "Series A",
  "Series B",
  "Growth Startup",
  "Unicorn",
  "Mid-size",
  "Enterprise",
  "MNC",
  "SMB",
  "Agency",
  "Consulting Firm",
  "Government",
  "Public Sector",
  "Non-profit",
  "NGO",
  "Educational Institution"
];
const INDUSTRIES = [
  "Technology",
  "FinTech",
  "HealthTech",
  "EdTech",
  "E-commerce",
  "SaaS",
  "AI / ML",
  "Enterprise Software",
  "Cybersecurity",
  "Blockchain",
  "IoT",
  "Gaming",
  "Biotech",
  "Pharmaceuticals",
  "Healthcare",
  "Hospitality",
  "Travel",
  "Retail",
  "Manufacturing",
  "Automotive",
  "Telecommunications",
  "Energy",
  "Oil & Gas",
  "Aerospace",
  "Agriculture",
  "Construction",
  "Media",
  "Entertainment",
  "Logistics",
  "Transportation",
  "Education",
  "Finance",
  "Banking",
  "Insurance",
  "Real Estate",
  "Legal",
  "Food & Beverages",
  "Non-profit",
  "Government",
  "Other"
];

const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshCredits } = useCredits();
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jdError, setJdError] = useState<string | null>(null);

  const jdInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    jobTitle: '',
    department: '',
    employmentType: 'Full-time',
    location: '',
    seniorityLevel: 'Mid',
    experienceRange: [3, 5],
    companyType: 'Growth Startup',
    priorRoles: '',
    industry: ''
  });

  const [description, setDescription] = useState('');
  const [jdSource, setJdSource] = useState<'upload' | 'builder'>('upload');

  const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setJdFile(file);
      setIsParsing(true);

      try {
        const text = await parseFile(file);
        setJdText(text);
        setJdError(null);
      } catch (error) {
        console.error("Failed to parse JD:", error);
        setJdError("Failed to extract text from the file. Please try copy-pasting manually or use a different file format.");
        setJdFile(null);
      } finally {
        setIsParsing(false);
      }
    }
  };

  const handleJdGenerated = (data: { description: string; jdText: string }) => {
    setDescription(data.description);
    setJdText(data.jdText);
    // Switch to upload view to show the generated text
    setJdSource('upload');
  };

  const handleSubmit = async () => {
    if (!jobDetails.jobTitle || !jobDetails.department || !jdText) {
      setError("Please fill in all required fields and provide a job description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create Job
      const jobResponse = await jobsApi.createJob({
        title: jobDetails.jobTitle,
        department: jobDetails.department,
        description: description || `Hiring for ${jobDetails.jobTitle}`,
        location: jobDetails.location,
        jd_text: jdText,
        employment_type: jobDetails.employmentType,
        seniority_level: jobDetails.seniorityLevel,
        experience_range: jobDetails.experienceRange,
        company_type: jobDetails.companyType,
        industry: jobDetails.industry,
        prior_roles: jobDetails.priorRoles,
      });

      // Refresh credits
      await refreshCredits();

      // Navigate to the new job page
      navigate(getJobDetailsPath(jobResponse.id));
    } catch (err: any) {
      console.error("Failed to create job:", err);
      setError(err.response?.data?.detail || "Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Job</h1>
        <p className="text-muted-foreground mt-2">
          Define the role and requirements. You can upload CVs after creating the job.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-8">
        {/* Job Details Section */}
        <Card className="dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Job Details
            </CardTitle>
            <CardDescription>Basic information about the position</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Senior Frontend Engineer"
                    className="pl-9"
                    value={jobDetails.jobTitle}
                    onChange={(e) => setJobDetails({ ...jobDetails, jobTitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <SearchableSelect
                    options={DEPARTMENTS}
                    value={jobDetails.department}
                    onChange={(val) => setJobDetails({ ...jobDetails, department: val })}
                    placeholder="Select Department"
                    searchPlaceholder="Search department..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <div className="relative">
                  <SearchableSelect
                    options={EMPLOYMENT_TYPES}
                    value={jobDetails.employmentType}
                    onChange={(val) => setJobDetails({ ...jobDetails, employmentType: val })}
                    placeholder="Select Employment Type"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g. Bangalore / Remote"
                    className="pl-9"
                    value={jobDetails.location}
                    onChange={(e) => setJobDetails({ ...jobDetails, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seniorityLevel">Seniority Level</Label>
                <div className="relative">
                  <SearchableSelect
                    options={SENIORITY_LEVELS}
                    value={jobDetails.seniorityLevel}
                    onChange={(val) => setJobDetails({ ...jobDetails, seniorityLevel: val })}
                    placeholder="Select Seniority Level"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Experience (Years): {jobDetails.experienceRange[0]} - {jobDetails.experienceRange[1]}</Label>
                <Slider
                  value={jobDetails.experienceRange}
                  min={0}
                  max={20}
                  step={1}
                  minStepsBetweenThumbs={1}
                  className="py-4"
                  onValueChange={(val) => setJobDetails({ ...jobDetails, experienceRange: val })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type</Label>
                <div className="relative">
                  <SearchableSelect
                    options={COMPANY_TYPES}
                    value={jobDetails.companyType}
                    onChange={(val) => setJobDetails({ ...jobDetails, companyType: val })}
                    placeholder="Select Company Type"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry / Domain</Label>
                <div className="relative">
                  <SearchableSelect
                    options={INDUSTRIES}
                    value={jobDetails.industry}
                    onChange={(val) => setJobDetails({ ...jobDetails, industry: val })}
                    placeholder="Select Industry"
                    searchPlaceholder="Search industry..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priorRoles">Prior Role Titles (Optional)</Label>
              <Input
                id="priorRoles"
                placeholder="e.g. SDE, Backend Engineer"
                value={jobDetails.priorRoles}
                onChange={(e) => setJobDetails({ ...jobDetails, priorRoles: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description (Internal)</Label>
              <Textarea
                id="description"
                placeholder="Internal notes about this hiring round..."
                className="resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Description Section */}
        <Card className="dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Job Description (JD)
            </CardTitle>
            <CardDescription>Provide the detailed job description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jdError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{jdError}</AlertDescription>
              </Alert>
            )}
            <div className="grid w-full grid-cols-2 mb-4 p-1 bg-muted rounded-lg gap-1">
              <button
                onClick={() => setJdSource('upload')}
                className={cn(
                  "py-1.5 text-sm font-medium rounded-md transition-all",
                  jdSource === 'upload'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Upload / Paste
              </button>
              <button
                onClick={() => setJdSource('builder')}
                className={cn(
                  "py-1.5 text-sm font-medium rounded-md transition-all",
                  jdSource === 'builder'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                AI Builder
              </button>
            </div>

            {jdSource === 'builder' ? (
              <JDBuilder jobDetails={jobDetails} onJdGenerated={handleJdGenerated} />
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="jdText">Full Job Description <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      {jdFile && jdText && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Extracted from file
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {jdText ? `${jdText.length} characters` : '0 characters'}
                      </span>
                    </div>
                  </div>
                  <Textarea
                    id="jdText"
                    placeholder="Paste the full job description here..."
                    className={cn(
                      "min-h-[300px] font-mono text-sm transition-all",
                      jdFile && jdText && "border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800"
                    )}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or import from file</span>
                  </div>
                </div>

                {!jdFile ? (
                  <div
                    className="border-2 border-dashed dark:border-gray-700 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => jdInputRef.current?.click()}
                  >
                    <input
                      ref={jdInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={handleJdUpload}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        {isParsing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {isParsing ? 'Extracting text...' : 'Click to upload JD'}
                      </div>
                      <div className="text-xs text-muted-foreground">PDF, DOCX, TXT</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-600 flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-sm truncate font-medium">{jdFile.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setJdFile(null); setJdText(''); }} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate(ROUTES.JOBS_LIST)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !jobDetails.jobTitle || !jobDetails.department || !jdText}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Job...
              </>
            ) : (
              'Create Job'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobPage;