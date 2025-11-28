import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/auth.service';
import { LoginCredentials, SignupData, AuthResponse } from '@/types/auth';
import { ROUTES } from '@/config/routes.constants';

export const useLogin = () => {
    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    return useMutation({
        mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
        onSuccess: (data: AuthResponse) => {
            setAuthData(data.user, data.token.access_token);
            navigate(ROUTES.DASHBOARD);
        },
    });
};

export const useSignup = () => {
    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    return useMutation({
        mutationFn: (data: SignupData) => authApi.signup(data),
        onSuccess: (data: AuthResponse) => {
            setAuthData(data.user, data.token.access_token);
            navigate(ROUTES.DASHBOARD);
        },
    });
};

export const useLogout = () => {
    const navigate = useNavigate();
    const { clearAuth } = useAuth();

    return useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            clearAuth();
            navigate(ROUTES.LOGIN);
        },
    });
};
