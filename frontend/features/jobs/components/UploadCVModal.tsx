import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, File, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { jobsApi } from '@/services/jobs.service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UploadCVModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId: string;
    onUploadComplete: () => void;
}

const UploadCVModal: React.FC<UploadCVModalProps> = ({ isOpen, onClose, jobId, onUploadComplete }) => {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; failed: number }>({ current: 0, total: 0, failed: 0 });
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsSubmitting(true);
        setError(null);
        setUploadProgress({ current: 0, total: files.length, failed: 0 });

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

                successCount++;
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
                failedCount++;
            }
            setUploadProgress(prev => ({ ...prev, current: prev.current + 1, failed: failedCount }));
        }

        setIsSubmitting(false);

        if (failedCount === 0) {
            onUploadComplete();
            onClose();
            setFiles([]);
            toast.success("CVs uploaded successfully");
        } else {
            setError(`Uploaded ${successCount} files, but ${failedCount} failed. Please try again.`);
            // Keep failed files or clear all? For now, clear all to simplify, user can re-add.
            // Ideally we should filter out successful ones.
            setFiles(prev => prev.slice(successCount));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upload CVs</DialogTitle>
                    <DialogDescription>
                        Add more candidates to this job. Supported formats: PDF, DOCX.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Upload Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Drag Drop Zone */}
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer",
                            dragActive
                                ? "border-primary bg-primary/5 scale-[1.01]"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
                            isSubmitting && "opacity-50 pointer-events-none"
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
                            disabled={isSubmitting}
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600">
                                <Upload className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold">Drop CVs here or click to browse</h3>
                                <p className="text-xs text-muted-foreground">
                                    Max 10MB per file
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{files.length} files selected</span>
                                {!isSubmitting && (
                                    <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-red-500 h-auto p-0 hover:bg-transparent hover:text-red-600">
                                        Clear all
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border dark:border-gray-700 rounded-lg bg-card text-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        {!isSubmitting && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFile(index)}
                                                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress Bar (Simple) */}
                    {isSubmitting && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Uploading...</span>
                                <span>{uploadProgress.current} / {uploadProgress.total}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={files.length === 0 || isSubmitting}
                        className="gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Upload {files.length > 0 && `(${files.length})`}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UploadCVModal;
