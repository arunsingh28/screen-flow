import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/auth.service';
import { LoginCredentials, SignupData, AuthResponse } from '@/types/auth';
import { ROUTES } from '@/config/routes.constants';

export const useLogin = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
        onSuccess: (data: AuthResponse) => {
            localStorage.setItem('access_token', data.token.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate(ROUTES.DASHBOARD);
        },
    });
};

export const useSignup = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: SignupData) => authApi.signup(data),
        onSuccess: (data: AuthResponse) => {
            localStorage.setItem('access_token', data.token.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate(ROUTES.DASHBOARD);
        },
    });
};

export const useLogout = () => {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            navigate(ROUTES.LOGIN);
        },
    });
};
