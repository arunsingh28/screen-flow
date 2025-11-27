import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Briefcase, 
  Building, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  File
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../lib/utils';

const CreateJobPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');

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

  const handleJdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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
          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Job Description (JD)</CardTitle>
              <CardDescription>Upload the JD file for AI context</CardDescription>
            </CardHeader>
            <CardContent>
              {!jdFile ? (
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => jdInputRef.current?.click()}
                >
                  <input 
                    ref={jdInputRef}
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleJdUpload}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium">Click to upload JD</div>
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
                  <Button variant="ghost" size="icon" onClick={() => setJdFile(null)} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Bulk Upload */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full flex flex-col">
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
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group">
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
      <div className="sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t flex justify-end gap-4 z-10">
         <Button variant="outline" size="lg">Cancel</Button>
         <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-blue-500/20"
            disabled={!jobTitle || files.length === 0}
         >
            <CheckCircle2 className="h-4 w-4" />
            Create Job & Analyze {files.length > 0 && `(${files.length})`}
         </Button>
      </div>
    </div>
  );
};

export default CreateJobPage;