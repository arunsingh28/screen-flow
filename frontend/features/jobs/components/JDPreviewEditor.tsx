import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Save,
  Edit2,
  Trash2,
  Plus,
  Sparkles,
  Info,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JDFormData } from './JDBuilderForm';

interface GeneratedJD {
  must_have_skills: Array<{
    skill: string;
    proficiency: string;
    confidence: number;
    priority: string;
    reasoning: string;
  }>;
  nice_to_have_skills: Array<{
    skill: string;
    confidence: number;
    why_bonus: string;
  }>;
  key_responsibilities: Array<{
    responsibility: string;
    priority: number;
    time_allocation: string;
  }>;
  education: {
    requirement_level: string;
    degree_level: string;
    field_of_study: string[];
    can_substitute_with_experience: boolean;
    reasoning: string;
  };
  additional_context: {
    industry: string;
    domain_expertise: string[];
    team_size: string;
    reporting_to: string;
    collaboration: string[];
    tools: string[];
    certifications: string[];
    work_environment: string;
  };
  compensation: {
    salary_range_inr: {
      min: number;
      max: number;
      confidence: string;
      note: string;
    };
    equity_rsu: string;
    notice_period_expectation: string;
    other_benefits: string[];
  };
  meta: {
    role_type: string;
    demand_level: string;
    confidence_in_suggestions: string;
    reasoning_summary: string;
  };
}

interface JDPreviewEditorProps {
  formData: JDFormData;
  generatedJD: GeneratedJD;
  onBack: () => void;
  onSave: (editedJD: GeneratedJD) => void;
}

const JDPreviewEditor: React.FC<JDPreviewEditorProps> = ({
  formData,
  generatedJD,
  onBack,
  onSave,
}) => {
  const [editedJD, setEditedJD] = useState<GeneratedJD>(generatedJD);
  const [selectedMustHave, setSelectedMustHave] = useState<Set<number>>(
    new Set(generatedJD.must_have_skills.map((_, i) => i))
  );
  const [selectedNiceToHave, setSelectedNiceToHave] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['must-have', 'responsibilities'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const toggleMustHave = (index: number) => {
    setSelectedMustHave((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleNiceToHave = (index: number) => {
    setSelectedNiceToHave((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const removeResponsibility = (index: number) => {
    setEditedJD((prev) => ({
      ...prev,
      key_responsibilities: prev.key_responsibilities.filter((_, i) => i !== index),
    }));
  };

  const addResponsibility = () => {
    setEditedJD((prev) => ({
      ...prev,
      key_responsibilities: [
        ...prev.key_responsibilities,
        {
          responsibility: '',
          priority: 3,
          time_allocation: '10%',
        },
      ],
    }));
  };

  const updateResponsibility = (index: number, value: string) => {
    setEditedJD((prev) => ({
      ...prev,
      key_responsibilities: prev.key_responsibilities.map((item, i) =>
        i === index ? { ...item, responsibility: value } : item
      ),
    }));
  };

  const handleSave = () => {
    onSave(editedJD);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Review & Customize Your JD
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              We've generated a professional job description based on your inputs. Review and customize as needed.
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Role:</span>
                <p className="font-semibold">{formData.jobTitle}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <p className="font-semibold">{formData.department}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>
                <p className="font-semibold">{formData.seniorityLevel}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span>
                <p className="font-semibold">{formData.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Confidence Banner */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-purple-900 dark:text-purple-100">
            AI Confidence: {editedJD.meta.confidence_in_suggestions.toUpperCase()}
          </p>
          <p className="text-purple-700 dark:text-purple-300 mt-1">
            {editedJD.meta.reasoning_summary}
          </p>
        </div>
      </div>

      {/* Must-Have Skills */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('must-have')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {expandedSections.has('must-have') ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">Must-Have Skills</CardTitle>
              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                {selectedMustHave.size} selected
              </span>
            </div>
          </div>
          <CardDescription>
            Check/uncheck skills to include in your JD. These are the core requirements for the role.
          </CardDescription>
        </CardHeader>
        {expandedSections.has('must-have') && (
          <CardContent className="space-y-3">
            {editedJD.must_have_skills.map((skill, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 border-2 rounded-lg transition-all cursor-pointer hover:shadow-sm',
                  selectedMustHave.has(index)
                    ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800'
                    : 'border-gray-200 bg-gray-50/50 dark:bg-gray-900/20 opacity-60'
                )}
                onClick={() => toggleMustHave(index)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {selectedMustHave.has(index) ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-base">{skill.skill}</h4>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            skill.priority === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          )}
                        >
                          {skill.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {skill.confidence}% confident
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded">
                      {skill.proficiency.charAt(0).toUpperCase() + skill.proficiency.slice(1)} level required
                    </p>
                    <p className="text-sm text-muted-foreground">{skill.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Nice-to-Have Skills */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('nice-to-have')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {expandedSections.has('nice-to-have') ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">Nice-to-Have Skills</CardTitle>
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                {selectedNiceToHave.size} selected
              </span>
            </div>
          </div>
          <CardDescription>
            Bonus skills that make a candidate stand out (optional but valuable)
          </CardDescription>
        </CardHeader>
        {expandedSections.has('nice-to-have') && (
          <CardContent className="space-y-3">
            {editedJD.nice_to_have_skills.map((skill, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 border-2 rounded-lg transition-all cursor-pointer hover:shadow-sm',
                  selectedNiceToHave.has(index)
                    ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800'
                    : 'border-gray-200 bg-gray-50/50 dark:bg-gray-900/20 opacity-60'
                )}
                onClick={() => toggleNiceToHave(index)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {selectedNiceToHave.has(index) ? (
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{skill.skill}</h4>
                      <span className="text-xs text-muted-foreground">{skill.confidence}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{skill.why_bonus}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Key Responsibilities */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('responsibilities')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {expandedSections.has('responsibilities') ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">Key Responsibilities</CardTitle>
            </div>
          </div>
          <CardDescription>
            Day-to-day tasks and expectations. You can edit, reorder, or remove any.
          </CardDescription>
        </CardHeader>
        {expandedSections.has('responsibilities') && (
          <CardContent className="space-y-3">
            {editedJD.key_responsibilities.map((resp, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/20 transition-colors group"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <Textarea
                    value={resp.responsibility}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                    placeholder="Enter responsibility..."
                  />
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">
                      Priority: {resp.priority}/5
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded">
                      Time: {resp.time_allocation}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => removeResponsibility(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={addResponsibility}
            >
              <Plus className="h-4 w-4" />
              Add Responsibility
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Education Requirements */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('education')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('education') ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">Education Requirements</CardTitle>
          </div>
        </CardHeader>
        {expandedSections.has('education') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requirement Level</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editedJD.education.requirement_level}
                  onChange={(e) =>
                    setEditedJD((prev) => ({
                      ...prev,
                      education: { ...prev.education, requirement_level: e.target.value },
                    }))
                  }
                >
                  <option value="required">Required</option>
                  <option value="preferred">Preferred</option>
                  <option value="not_required">Not Required</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Degree Level</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editedJD.education.degree_level}
                  onChange={(e) =>
                    setEditedJD((prev) => ({
                      ...prev,
                      education: { ...prev.education, degree_level: e.target.value },
                    }))
                  }
                >
                  <option value="any">Any</option>
                  <option value="bachelor">Bachelor's</option>
                  <option value="master">Master's</option>
                  <option value="phd">PhD</option>
                  <option value="diploma">Diploma</option>
                  <option value="certification">Certification</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fields of Study</Label>
              <Input
                value={editedJD.education.field_of_study.join(', ')}
                onChange={(e) =>
                  setEditedJD((prev) => ({
                    ...prev,
                    education: {
                      ...prev.education,
                      field_of_study: e.target.value.split(',').map((s) => s.trim()),
                    },
                  }))
                }
                placeholder="e.g., Computer Science, Engineering"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="substitute"
                checked={editedJD.education.can_substitute_with_experience}
                onChange={(e) =>
                  setEditedJD((prev) => ({
                    ...prev,
                    education: {
                      ...prev.education,
                      can_substitute_with_experience: e.target.checked,
                    },
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <label htmlFor="substitute" className="text-sm">
                Can substitute with relevant experience
              </label>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('compensation')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('compensation') ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">Compensation</CardTitle>
          </div>
          <CardDescription>Salary and benefits based on market data</CardDescription>
        </CardHeader>
        {expandedSections.has('compensation') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Salary (₹ LPA)</Label>
                <Input
                  type="number"
                  value={editedJD.compensation.salary_range_inr.min}
                  onChange={(e) =>
                    setEditedJD((prev) => ({
                      ...prev,
                      compensation: {
                        ...prev.compensation,
                        salary_range_inr: {
                          ...prev.compensation.salary_range_inr,
                          min: Number(e.target.value),
                        },
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Salary (₹ LPA)</Label>
                <Input
                  type="number"
                  value={editedJD.compensation.salary_range_inr.max}
                  onChange={(e) =>
                    setEditedJD((prev) => ({
                      ...prev,
                      compensation: {
                        ...prev.compensation,
                        salary_range_inr: {
                          ...prev.compensation.salary_range_inr,
                          max: Number(e.target.value),
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
              <p className="text-blue-900 dark:text-blue-100">
                💡 {editedJD.compensation.salary_range_inr.note}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Equity/RSU</Label>
              <Input
                value={editedJD.compensation.equity_rsu}
                onChange={(e) =>
                  setEditedJD((prev) => ({
                    ...prev,
                    compensation: { ...prev.compensation, equity_rsu: e.target.value },
                  }))
                }
                placeholder="e.g., 0.05% - 0.15%"
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Notice Period</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editedJD.compensation.notice_period_expectation}
                onChange={(e) =>
                  setEditedJD((prev) => ({
                    ...prev,
                    compensation: {
                      ...prev.compensation,
                      notice_period_expectation: e.target.value,
                    },
                  }))
                }
              >
                <option value="15 days">15 days</option>
                <option value="30 days">30 days</option>
                <option value="60 days">60 days</option>
                <option value="90 days">90 days</option>
              </select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Additional Context */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => toggleSection('context')}
        >
          <div className="flex items-center gap-2">
            {expandedSections.has('context') ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">Additional Context</CardTitle>
          </div>
          <CardDescription>Team structure, tools, and work environment</CardDescription>
        </CardHeader>
        {expandedSections.has('context') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team Size</Label>
                <Input
                  value={editedJD.additional_context.team_size}
                  onChange={(e) =>
                    setEditedJD((prev) => ({
                      ...prev,
                      additional_context: {
                        ...prev.additional_context,
                        team_size: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reports To</Label>
                <Input
                  value={editedJD.additional_context.reporting_to}
                  onChange={(e) =>
                    setEditedJD((prev) => ({
                      ...prev,
                      additional_context: {
                        ...prev.additional_context,
                        reporting_to: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tools & Technologies</Label>
              <Textarea
                value={editedJD.additional_context.tools.join(', ')}
                onChange={(e) =>
                  setEditedJD((prev) => ({
                    ...prev,
                    additional_context: {
                      ...prev.additional_context,
                      tools: e.target.value.split(',').map((s) => s.trim()),
                    },
                  }))
                }
                placeholder="Git, Jira, Postman, AWS..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Work Environment</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editedJD.additional_context.work_environment}
                onChange={(e) =>
                  setEditedJD((prev) => ({
                    ...prev,
                    additional_context: {
                      ...prev.additional_context,
                      work_environment: e.target.value,
                    },
                  }))
                }
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 pb-8 sticky bottom-0 bg-background/95 backdrop-blur border-t py-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Form
        </Button>
        <Button onClick={handleSave} size="lg" className="gap-2 shadow-lg">
          <Save className="h-4 w-4" />
          Save Job Description
        </Button>
      </div>
    </div>
  );
};

export default JDPreviewEditor;
