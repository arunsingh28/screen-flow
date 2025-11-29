import axiosInstance from '@/lib/axios';

export interface UserProfile {
    id: string;
    email: string;
    company_name?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    location?: string;
    bio?: string;
    job_title?: string;
    department?: string;
    profile_image_url?: string;
    created_at: string;
}

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    location?: string;
    bio?: string;
    job_title?: string;
    department?: string;
    company_name?: string;
    profile_image_url?: string;
}

export const userService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await axiosInstance.get<UserProfile>('/users/me');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
        const response = await axiosInstance.put<UserProfile>('/users/me', data);
        return response.data;
    },

    getAvatarUploadUrl: async (filename: string, contentType: string): Promise<{ upload_url: string; s3_key: string }> => {
        const response = await axiosInstance.post<{ upload_url: string; s3_key: string }>('/users/me/avatar/upload-url', {
            filename,
            content_type: contentType,
        });
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const response = await axiosInstance.post<{ message: string }>('/users/me/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return response.data;
    },
};
