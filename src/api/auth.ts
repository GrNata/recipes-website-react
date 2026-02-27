import { apiClient } from './axios';
// import { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse } from '../types/index';
// import { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse } from '../types/index';
import type {LoginRequest, RegisterRequest, RegisterResponse} from '../types';

//Интерфейс, cooтветствующий TokenResponse.kt (и API)
export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    userInfo: {
        email: string;
        roles: string[];
        username: string;
    };
}

export const authApi = {
//     Вызов POST /api/auth/login
    async login(data: LoginRequest): Promise<TokenResponse> {
        const response =
            await apiClient.post<TokenResponse>('/api/auth/login', data);

    //     Сразу сохраняем токены в браузер
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userEmail', response.data.userInfo.email);
        localStorage.setItem('username', response.data.userInfo.username);

        console.log('auth: login: userEmail: ', localStorage.getItem('userEmail'));
        console.log('auth: login: username: ', localStorage.getItem('username'));
        return response.data
    },

//     Вызов POST /api/auth/register
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        const response =
            await apiClient.post<RegisterResponse>('/api/auth/register', data);
        return response.data;
    },

//     Выход из системы
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('username');

    },
    // По-хорошему тут еще нужно сделать запрос на /api/auth/logout на сервер,
    // но для очистки фронтенда достаточно удалить данные


//     Для автоматического обновления токена нам нужно реализовать механизм Interceptors (перехватчиков) в Axios.
//     Логика простая: если запрос возвращает ошибку 401 Unauthorized, мы приостанавливаем его,
//     обновляем токен через refreshToken и повторяем запрос уже с новым токеном.
//     добавить вызов эндпоинта для обновления токена. Обычно это POST /api/auth/refresh
    async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw  new Error('No refresh token available');

        // Отправляем запрос на обновление.
        // Важно: здесь мы передаем refreshToken, чтобы сервер выдал новую пару
        const response = await apiClient.post<TokenResponse>('/api/auth/refresh-token', {
            refreshToken: refreshToken
        });
        return response.data;
    }
}