import axiosInstance from '@/lib/axios';

export interface Plan {
    _id: string;
    name: string;
    code: string;
    price: number;
    currency: string;
    description?: string;
    defaults: {
        credits: number;
        scan_limit: number;
        seats: number;
    };
    modules: {
        [key: string]: boolean;
    };
}

export const planApi = {
    listPlans: async (): Promise<Plan[]> => {
        const response = await axiosInstance.get<Plan[]>('/plans');
        return response.data;
    },

    selectPlan: async (planCode: string, orgName?: string): Promise<{ success: boolean; organization: any }> => {
        const response = await axiosInstance.post('/plans/select', { plan_code: planCode, org_name: orgName });
        return response.data;
    }
};
