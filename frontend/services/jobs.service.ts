import axiosInstance from '@/lib/axios';

export interface ParseJdResponse {
    content: string;
}

export const jobsApi = {
    parseJd: async (file: File): Promise<ParseJdResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axiosInstance.post<ParseJdResponse>('/jobs/parse-jd', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    generateJD: async (jobDetails: any) => {
        const response = await axiosInstance.post('/jd-builder/build', jobDetails);
        return response.data;
    },

    createJob: async (data: any) => {
        const response = await axiosInstance.post('/jobs/batches', data);
        return response.data;
    },

    requestUpload: async (jobId: string, filename: string, fileSize: number, contentType: string) => {
        const response = await axiosInstance.post(`/jobs/batches/${jobId}/upload-request`, {
            filename,
            file_size_bytes: fileSize,
            content_type: contentType
        });
        return response.data;
    },

    confirmUpload: async (jobId: string, cvId: string) => {
        const response = await axiosInstance.post(`/jobs/batches/${jobId}/upload-complete`, {
            cv_id: cvId
        });
        return response.data;
    },

    uploadToS3: async (presignedUrl: string, file: File, contentType: string) => {
        // Direct upload to S3 using PUT
        await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': contentType
            }
        });
    },

    getJob: async (id: string) => {
        const response = await axiosInstance.get(`/jobs/batches/${id}`);
        return response.data;
    },

    getBatchCVs: async (batchId: string, page = 1, pageSize = 10, status = '', q = '') => {
        const params: any = { page, page_size: pageSize };
        if (status && status !== 'all') params.status = status;
        if (q) params.q = q;

        const response = await axiosInstance.get(`/jobs/batches/${batchId}/cvs`, { params });
        return response.data;
    },

    getJobDetails: async (id: string) => {
        const response = await axiosInstance.get(`/jobs/batches/${id}`);
        return response.data;
    },

    getJobs: async (page = 1, pageSize = 20, isArchived = false) => {
        const response = await axiosInstance.get(`/jobs/batches`, {
            params: { page, page_size: pageSize, is_archived: isArchived }
        });
        return response.data;
    },

    getActivities: async (skip = 0, limit = 50) => {
        const response = await axiosInstance.get(`/jobs/activities`, {
            params: { skip, limit },
            withCredentials: true
        });
        return response.data;
    },

    deleteCVs: async (cvIds: string[]) => {
        const response = await axiosInstance.post(`/jobs/cvs/bulk-delete`, {
            cv_ids: cvIds
        });
        return response.data;
    },

    getDownloadUrl: async (cvId: string) => {
        const response = await axiosInstance.get(`/jobs/cvs/${cvId}/download-url`);
        return response.data;
    },

    updateCVStatus: async (cvId: string, status: string) => {
        const response = await axiosInstance.patch(`/jobs/cvs/${cvId}/status`, {
            status
        });
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await axiosInstance.get('/jobs/stats');
        return response.data;
    },

    getStatsHistory: async (days = 30) => {
        const response = await axiosInstance.get('/jobs/stats/history', {
            params: { days }
        });
        return response.data;
    },

    getAllCVs: async (page = 1, pageSize = 20) => {
        const response = await axiosInstance.get('/jobs/cvs', {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },

    updateJobStatus: async (jobId: string, isActive: boolean) => {
        const response = await axiosInstance.patch(`/jobs/batches/${jobId}/status`, {
            is_active: isActive
        });
        return response.data;
    },

    archiveJob: async (jobId: string, isArchived: boolean) => {
        const response = await axiosInstance.patch(`/jobs/batches/${jobId}/archive`, {
            is_archived: isArchived
        });
        return response.data;
    },

    getCV: async (cvId: string) => {
        const response = await axiosInstance.get(`/jobs/cvs/${cvId}`);
        return response.data;
    },

    retryCV: async (cvId: string) => {
        const response = await axiosInstance.post(`/cv-processing/cv/${cvId}/retry`);
        return response.data;
    }
};
