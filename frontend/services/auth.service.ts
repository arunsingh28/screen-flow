import axiosInstance from '@/lib/axios';
import { LoginCredentials, SignupData, AuthResponse } from '@/types/auth';

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    signup: async (data: SignupData): Promise<AuthResponse> => {
        const response = await axiosInstance.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await axiosInstance.post('/auth/logout');
    },

    refreshToken: async (): Promise<{ access_token: string }> => {
        const response = await axiosInstance.post<{ access_token: string }>('/auth/refresh');
        return response.data;
    },
};
