export interface User {
    id: string;
    email: string;
    company_name: string;
    created_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    company_name: string;
    referral_code?: string;
}

export interface AuthResponse {
    user: User;
    token: {
        access_token: string;
    };
}

export interface RefreshTokenResponse {
    access_token: string;
}
