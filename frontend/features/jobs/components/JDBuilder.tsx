import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles, FileText } from 'lucide-react';
import JDBuilderForm, { JDFormData } from './JDBuilderForm';
import JDPreviewEditor from './JDPreviewEditor';

interface JDBuilderProps {
  onComplete: (jdText: string) => void;
  onUploadJD: () => void;
}

type Step = 'choose' | 'form' | 'preview';

// Mock function to simulate AI generation (replace with actual API call)
const generateMockJD = (formData: JDFormData) => {
  return {
    must_have_skills: [
      {
        skill: 'React.js',
        proficiency: 'advanced',
        confidence: 95,
        priority: 'high',
        reasoning: `${formData.seniorityLevel} ${formData.jobTitle} at ${formData.companyType} requires production React.js experience for building modern UIs`,
      },
      {
        skill: 'TypeScript',
        proficiency: 'advanced',
        confidence: 90,
        priority: 'high',
        reasoning: 'Type safety is critical for scalable frontend development in growth companies',
      },
      {
        skill: 'State Management (Redux/Zustand)',
        proficiency: 'intermediate',
        confidence: 85,
        priority: 'high',
        reasoning: 'Complex applications need robust state management solutions',
      },
      {
        skill: 'REST API Integration',
        proficiency: 'advanced',
        confidence: 90,
        priority: 'high',
        reasoning: 'Frontend needs to communicate with backend services efficiently',
      },
      {
        skill: 'Git Version Control',
        proficiency: 'intermediate',
        confidence: 95,
        priority: 'medium',
        reasoning: 'Essential for team collaboration and code management',
      },
    ],
    nice_to_have_skills: [
      {
        skill: 'GraphQL',
        confidence: 75,
        why_bonus: 'Modern API query language increasingly adopted in the industry',
      },
      {
        skill: 'Next.js/Remix',
        confidence: 70,
        why_bonus: 'SSR frameworks improve SEO and performance for production apps',
      },
      {
        skill: 'Testing (Jest/React Testing Library)',
        confidence: 80,
        why_bonus: 'Quality code requires good test coverage',
      },
      {
        skill: 'CI/CD (GitHub Actions/Jenkins)',
        confidence: 65,
        why_bonus: 'Understanding deployment pipelines improves development workflow',
      },
    ],
    key_responsibilities: [
      {
        responsibility: `Build and maintain ${formData.companyType === 'Early Startup' ? 'MVP features and iterate quickly' : 'production-grade features'} for our web application`,
        priority: 5,
        time_allocation: '40%',
      },
      {
        responsibility: 'Collaborate with design and backend teams to implement pixel-perfect, performant UIs',
        priority: 4,
        time_allocation: '25%',
      },
      {
        responsibility: `${formData.seniorityLevel === 'Senior' || formData.seniorityLevel === 'Lead' ? 'Mentor junior engineers and conduct code reviews' : 'Participate in code reviews and learn best practices'}`,
        priority: formData.seniorityLevel === 'Senior' ? 4 : 3,
        time_allocation: formData.seniorityLevel === 'Senior' ? '20%' : '15%',
      },
      {
        responsibility: 'Write clean, maintainable, and well-tested code following best practices',
        priority: 4,
        time_allocation: '15%',
      },
      {
        responsibility: 'Participate in sprint planning, standups, and retrospectives',
        priority: 3,
        time_allocation: '10%',
      },
    ],
    education: {
      requirement_level: 'preferred',
      degree_level: 'bachelor',
      field_of_study: ['Computer Science', 'Software Engineering', 'Information Technology'],
      can_substitute_with_experience: true,
      reasoning: `For ${formData.seniorityLevel} roles, practical experience often matters more than formal education`,
    },
    additional_context: {
      industry: formData.industry || 'Technology',
      domain_expertise: formData.industry ? [`${formData.industry} domain knowledge`] : ['Web Development'],
      team_size: formData.companyType === 'Early Startup' ? '3-5 engineers' : formData.companyType === 'MNC' ? '15-20 engineers' : '6-10 engineers',
      reporting_to: formData.seniorityLevel === 'Lead' ? 'Engineering Manager / CTO' : formData.seniorityLevel === 'Senior' ? 'Tech Lead / Engineering Manager' : 'Senior Engineer / Tech Lead',
      collaboration: ['Product Team', 'Design Team', 'Backend Engineers', 'QA Team'],
      tools: ['Git', 'VS Code', 'Chrome DevTools', 'Jira/Linear', 'Figma', 'Slack/Teams'],
      certifications: [],
      work_environment: formData.location.toLowerCase().includes('remote') ? 'remote' : formData.location.toLowerCase().includes('hybrid') ? 'hybrid' : 'onsite',
    },
    compensation: {
      salary_range_inr: {
        min: calculateMinSalary(formData),
        max: calculateMaxSalary(formData),
        confidence: 'high',
        note: `Based on ${formData.location}, ${formData.seniorityLevel} level, ${formData.companyType} company type in ${formData.department}`,
      },
      equity_rsu: formData.companyType.includes('Startup') ? '0.05% - 0.25%' : formData.companyType === 'MNC' ? 'RSUs based on level' : 'Not applicable',
      notice_period_expectation: formData.seniorityLevel === 'Lead' || formData.seniorityLevel === 'Executive' ? '60 days' : formData.seniorityLevel === 'Senior' ? '45 days' : '30 days',
      other_benefits: [
        'Health Insurance',
        'Learning & Development Budget',
        formData.location.toLowerCase().includes('remote') ? 'Remote Work Allowance' : 'Commute Allowance',
        'Flexible Working Hours',
        'Annual Performance Bonus',
      ],
    },
    meta: {
      role_type: formData.department === 'Engineering' ? 'technical' : formData.department === 'Sales' ? 'sales' : 'non-technical',
      demand_level: 'high',
      confidence_in_suggestions: 'high',
      reasoning_summary: `Generated for a ${formData.seniorityLevel} ${formData.jobTitle} role in ${formData.department} at a ${formData.companyType} based in ${formData.location}. Expectations calibrated for ${formData.experienceRange[0]}-${formData.experienceRange[1]} years of experience.`,
    },
  };
};

// Helper function to calculate salary ranges
const calculateMinSalary = (formData: JDFormData): number => {
  let base = 8; // Base salary in LPA

  // Seniority multiplier
  const seniorityMultiplier: Record<string, number> = {
    Entry: 1,
    Mid: 1.8,
    Senior: 2.8,
    Lead: 4,
    Executive: 6,
  };

  // Company type multiplier
  const companyMultiplier: Record<string, number> = {
    'Early Startup': 0.8,
    'Growth Startup': 1,
    'Mid-size': 1.1,
    MNC: 1.3,
    Agency: 0.9,
    'Non-profit': 0.7,
  };

  // Location multiplier
  let locationMultiplier = 1;
  if (formData.location.toLowerCase().includes('bangalore') || formData.location.toLowerCase().includes('mumbai')) {
    locationMultiplier = 1.2;
  } else if (formData.location.toLowerCase().includes('remote')) {
    locationMultiplier = 1.1;
  }

  return Math.round(
    base * (seniorityMultiplier[formData.seniorityLevel] || 1) * (companyMultiplier[formData.companyType] || 1) * locationMultiplier
  );
};

const calculateMaxSalary = (formData: JDFormData): number => {
  return Math.round(calculateMinSalary(formData) * 1.4);
};

const JDBuilder: React.FC<JDBuilderProps> = ({ onComplete, onUploadJD }) => {
  const [step, setStep] = useState<Step>('choose');
  const [formData, setFormData] = useState<JDFormData | null>(null);
  const [generatedJD, setGeneratedJD] = useState<any>(null);

  const handleChooseBuilder = () => {
    setStep('form');
  };

  const handleGenerate = (data: JDFormData) => {
    setFormData(data);
    // Simulate AI generation (replace with actual API call)
    const mockJD = generateMockJD(data);
    setGeneratedJD(mockJD);
    setStep('preview');
  };

  const handleSave = (editedJD: any) => {
    // Convert the edited JD structure to text format
    const jdText = convertJDToText(formData!, editedJD);
    onComplete(jdText);
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  const handleBackToChoose = () => {
    setStep('choose');
    setFormData(null);
    setGeneratedJD(null);
  };

  // Helper function to convert structured JD to text
  const convertJDToText = (formData: JDFormData, jd: any): string => {
    let text = `Job Title: ${formData.jobTitle}\n`;
    text += `Department: ${formData.department}\n`;
    text += `Location: ${formData.location}\n`;
    text += `Employment Type: ${formData.employmentType}\n`;
    text += `Experience: ${formData.experienceRange[0]}-${formData.experienceRange[1]} years\n\n`;

    text += `Role Overview:\n${jd.meta.reasoning_summary}\n\n`;

    text += `Key Responsibilities:\n`;
    jd.key_responsibilities.forEach((resp: any, i: number) => {
      text += `${i + 1}. ${resp.responsibility}\n`;
    });
    text += '\n';

    text += `Must-Have Skills:\n`;
    jd.must_have_skills.forEach((skill: any) => {
      text += `- ${skill.skill} (${skill.proficiency})\n`;
    });
    text += '\n';

    if (jd.nice_to_have_skills.length > 0) {
      text += `Nice-to-Have Skills:\n`;
      jd.nice_to_have_skills.forEach((skill: any) => {
        text += `- ${skill.skill}\n`;
      });
      text += '\n';
    }

    text += `Education: ${jd.education.degree_level} in ${jd.education.field_of_study.join(', ')}\n`;
    text += `Can substitute with experience: ${jd.education.can_substitute_with_experience ? 'Yes' : 'No'}\n\n`;

    text += `Compensation: ₹${jd.compensation.salary_range_inr.min}L - ₹${jd.compensation.salary_range_inr.max}L per annum\n`;
    if (jd.compensation.equity_rsu !== 'Not applicable') {
      text += `Equity: ${jd.compensation.equity_rsu}\n`;
    }
    text += `\n`;

    text += `Work Environment: ${jd.additional_context.work_environment}\n`;
    text += `Team Size: ${jd.additional_context.team_size}\n`;
    text += `Tools: ${jd.additional_context.tools.join(', ')}\n`;

    return text;
  };

  if (step === 'choose') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">How would you like to create your Job Description?</h2>
          <p className="text-muted-foreground">
            Choose the method that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* AI Builder Option */}
          <Card className="border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
            <button
              onClick={handleChooseBuilder}
              className="w-full p-8 text-left space-y-4"
            >
              <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI Job Description Builder</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Answer a few questions and let AI generate a professional, market-ready JD tailored to your needs.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-full">
                    ⚡ Fast
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-full">
                    🎯 Context-Aware
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-full">
                    ✏️ Editable
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600 group-hover:gap-3 transition-all">
                Get Started <span>→</span>
              </div>
            </button>
          </Card>

          {/* Upload Option */}
          <Card className="border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer group">
            <button
              onClick={onUploadJD}
              className="w-full p-8 text-left space-y-4"
            >
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Own JD</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Have a JD ready? Upload your PDF, DOCX, or TXT file and we'll extract the content automatically.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                    📄 PDF/DOCX
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                    🔄 Auto-Extract
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                    ⚡ Quick
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:gap-3 transition-all">
                Upload File <span>→</span>
              </div>
            </button>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto pt-4">
          💡 <strong>Pro Tip:</strong> Use the AI Builder if you want data-driven suggestions for skills, salaries,
          and responsibilities based on 2025 market trends. Upload your own JD if you already have a polished version.
        </div>
      </div>
    );
  }

  if (step === 'form') {
    return <JDBuilderForm onGenerate={handleGenerate} onBack={handleBackToChoose} />;
  }

  if (step === 'preview' && generatedJD && formData) {
    return (
      <JDPreviewEditor
        formData={formData}
        generatedJD={generatedJD}
        onBack={handleBackToForm}
        onSave={handleSave}
      />
    );
  }

  return null;
};

export default JDBuilder;
