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

    uploadToS3: async (presignedUrl: string, file: File) => {
        // Direct upload to S3 using PUT
        await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
    },

    getJob: async (id: string) => {
        const response = await axiosInstance.get(`/jobs/batches/${id}`);
        return response.data;
    },

    getJobDetails: async (id: string) => {
        const response = await axiosInstance.get(`/jobs/batches/${id}/details`);
        return response.data;
    },

    getJobs: async (page = 1, pageSize = 20) => {
        const response = await axiosInstance.get(`/jobs/batches`, {
            params: { page, page_size: pageSize }
        });
        return response.data;
    },

    getActivities: async (skip = 0, limit = 50) => {
        const response = await axiosInstance.get(`/jobs/activities`, {
            params: { skip, limit }
        });
        return response.data;
    }
};
