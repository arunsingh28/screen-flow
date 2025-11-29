import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  X,
  Briefcase,
  Building,
  Info,
  CheckCircle2,
  File,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { parseFile } from '@/lib/fileParser';
import { jobsApi } from '@/services/jobs.service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROUTES } from '@/config/routes.constants';
import { useCredits } from '@/contexts/CreditContext';

const CreateJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshCredits } = useCredits();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; failed: number }>({ current: 0, total: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setJdFile(file);
      setIsParsing(true);

      try {
        const text = await parseFile(file);
        setJdText(text);
        alert("JD Parsed Successfully: The job description text has been extracted from the file.");
      } catch (error) {
        console.error("Failed to parse JD:", error);
        alert("Parsing Failed: Could not extract text from the file. Please try copy-pasting manually.");
      } finally {
        setIsParsing(false);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!jobTitle || !jdText) {
      setError("Please fill in the Job Title and Job Description.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress({ current: 0, total: files.length, failed: 0 });

    try {
      // 1. Create Job
      const jobData = {
        title: jobTitle,
        department: department,
        location: location,
        description: description,
        job_description_text: jdText,
        tags: []
      };

      const job = await jobsApi.createJob(jobData);
      const jobId = job.id;

      // Refresh credits after job creation (1 credit)
      await refreshCredits();

      // 2. Upload Files
      let successCount = 0;
      let failedCount = 0;

      for (const file of files) {
        try {
          const contentType = file.type || 'application/pdf';
          // Request Upload URL
          const { cv_id, presigned_url } = await jobsApi.requestUpload(
            jobId,
            file.name,
            file.size,
            contentType
          );

          // Upload to S3
          await jobsApi.uploadToS3(presigned_url, file, contentType);

          // Confirm Upload
          await jobsApi.confirmUpload(jobId, cv_id);

          // Refresh credits after each successful upload (2 credits)
          await refreshCredits();

          successCount++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          failedCount++;
        }
        setUploadProgress(prev => ({ ...prev, current: prev.current + 1, failed: failedCount }));
      }

      // Final refresh to ensure everything is synced
      await refreshCredits();

      // 3. Navigate
      if (failedCount > 0) {
        alert(`Job created, but ${failedCount} files failed to upload. Redirecting to job page.`);
      }

      navigate(`/jobs/${jobId}`);

    } catch (err: any) {
      console.error("Job creation failed:", err);
      setError(err.response?.data?.detail || "Failed to create job. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          Create New Job
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Set up a new screening project. Upload the Job Description (JD) and candidate CVs to start the AI matching process.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Job Details & JD */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="dark:border-gray-700">
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Define the role requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="title"
                    placeholder="e.g. Senior Frontend Engineer"
                    className="pl-9"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="department"
                    placeholder="e.g. Engineering"
                    className="pl-9"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
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

          <Card className="dark:border-gray-700">
            <CardHeader>
              <CardTitle>Job Description (JD)</CardTitle>
              <CardDescription>Paste the JD text or upload a file to extract content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="jdText">Full Job Description</Label>
                  <span className="text-xs text-muted-foreground">
                    {jdText ? `${jdText.length} characters` : '0 characters'}
                  </span>
                </div>
                <Textarea
                  id="jdText"
                  placeholder="Paste the full job description here..."
                  className="min-h-[200px] font-mono text-sm"
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
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bulk Upload */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full flex flex-col dark:border-gray-700">
            <CardHeader>
              <CardTitle>Candidate CVs</CardTitle>
              <CardDescription>Upload resumes in bulk for screening</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Drag Drop Zone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-10 transition-all text-center cursor-pointer",
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInput}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Drop CVs here or click to browse</h3>
                    <p className="text-sm text-muted-foreground">
                      Support for PDF, DOCX, DOC (Max 10MB per file)
                    </p>
                  </div>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{files.length} files selected</span>
                    <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-red-500 h-auto p-0 hover:bg-transparent hover:text-red-600">
                      Clear all
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border dark:border-gray-700 rounded-lg bg-card hover:bg-accent/50 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {files.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 space-y-2 py-10">
                  <Info className="h-8 w-8" />
                  <p>No files selected yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t dark:border-gray-700 flex flex-col gap-4 z-10">
        {error && (
          <Alert variant="destructive" className="mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-end gap-4 px-4">
          <Button variant="outline" size="lg" onClick={() => navigate(ROUTES.JOBS_LIST)}>Cancel</Button>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-blue-500/20"
            disabled={!jobTitle || files.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Create Job & Analyze {files.length > 0 && `(${files.length})`}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobPage;