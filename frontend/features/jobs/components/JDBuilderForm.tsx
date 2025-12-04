import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface JDBuilderFormProps {
  onGenerate: (formData: JDFormData) => void;
  onBack: () => void;
}

export interface JDFormData {
  jobTitle: string;
  department: string;
  employmentType: string;
  location: string;
  seniorityLevel: string;
  experienceRange: [number, number];
  companyType: string;
  priorRoleTitles: string;
  industry: string;
}

const JDBuilderForm: React.FC<JDBuilderFormProps> = ({ onGenerate, onBack }) => {
  const [formData, setFormData] = useState<JDFormData>({
    jobTitle: '',
    department: '',
    employmentType: '',
    location: '',
    seniorityLevel: '',
    experienceRange: [2, 5],
    companyType: '',
    priorRoleTitles: '',
    industry: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof JDFormData, string>>>({});

  const departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'Operations',
    'Product',
    'Design',
    'HR',
    'Finance',
    'Other',
  ];

  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];

  const seniorityLevels = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];

  const companyTypes = [
    'Early Startup',
    'Growth Startup',
    'Mid-size',
    'MNC',
    'Agency',
    'Non-profit',
  ];

  const industries = [
    'FinTech',
    'HealthTech',
    'E-commerce',
    'SaaS',
    'EdTech',
    'Enterprise Software',
    'Gaming',
    'Media & Entertainment',
    'Other',
  ];

  const handleChange = (field: keyof JDFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof JDFormData, string>> = {};

    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment type is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.seniorityLevel) newErrors.seniorityLevel = 'Seniority level is required';
    if (!formData.companyType) newErrors.companyType = 'Company type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = () => {
    if (validate()) {
      onGenerate(formData);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Job Description Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Answer a few questions and we'll generate a professional JD tailored for your role
          </p>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Tell us about the role</CardTitle>
          <CardDescription>
            Fill in the details below. We'll use this to create a realistic, market-ready job description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="text-sm font-medium">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="jobTitle"
              placeholder="e.g., Senior Frontend Engineer"
              value={formData.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
              className={errors.jobTitle ? 'border-red-500' : ''}
            />
            {errors.jobTitle && (
              <p className="text-xs text-red-500">{errors.jobTitle}</p>
            )}
          </div>

          {/* Department and Employment Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-medium">
                Department <span className="text-red-500">*</span>
              </Label>
              <select
                id="department"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-xs text-red-500">{errors.department}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType" className="text-sm font-medium">
                Employment Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="employmentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.employmentType}
                onChange={(e) => handleChange('employmentType', e.target.value)}
              >
                <option value="">Select type</option>
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.employmentType && (
                <p className="text-xs text-red-500">{errors.employmentType}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              placeholder="e.g., Bangalore / Remote / Hybrid - Mumbai"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-xs text-red-500">{errors.location}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Tip: Be specific - this affects salary expectations and candidate pool
            </p>
          </div>

          {/* Seniority Level and Company Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seniorityLevel" className="text-sm font-medium">
                Seniority Level <span className="text-red-500">*</span>
              </Label>
              <select
                id="seniorityLevel"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.seniorityLevel}
                onChange={(e) => handleChange('seniorityLevel', e.target.value)}
              >
                <option value="">Select level</option>
                {seniorityLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {errors.seniorityLevel && (
                <p className="text-xs text-red-500">{errors.seniorityLevel}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyType" className="text-sm font-medium">
                Company Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="companyType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.companyType}
                onChange={(e) => handleChange('companyType', e.target.value)}
              >
                <option value="">Select type</option>
                {companyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.companyType && (
                <p className="text-xs text-red-500">{errors.companyType}</p>
              )}
            </div>
          </div>

          {/* Years of Experience Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Years of Experience</Label>
              <span className="text-sm font-medium text-primary">
                {formData.experienceRange[0]} - {formData.experienceRange[1]} years
              </span>
            </div>
            <Slider
              value={formData.experienceRange}
              onValueChange={(value) => handleChange('experienceRange', value as [number, number])}
              min={0}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 years</span>
              <span>20+ years</span>
            </div>
          </div>

          {/* Industry (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-sm font-medium">
              Industry / Domain <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <select
              id="industry"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
            >
              <option value="">Select industry (optional)</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Helps us suggest industry-specific skills and tools
            </p>
          </div>

          {/* Prior Role Titles (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="priorRoles" className="text-sm font-medium">
              Prior Role Titles <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="priorRoles"
              placeholder="e.g., SDE, Backend Engineer, Software Developer"
              value={formData.priorRoleTitles}
              onChange={(e) => handleChange('priorRoleTitles', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              What similar roles have candidates held? Helps us match relevant experience
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleGenerate} size="lg" className="gap-2 shadow-lg">
          <Sparkles className="h-4 w-4" />
          Generate Job Description
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default JDBuilderForm;
