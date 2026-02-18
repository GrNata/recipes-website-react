import axios from 'axios';
import { authApi } from "./auth";

// 1. Создаем базовый клиент axios
export const apiClient = axios.create({
    // Указываем базовый URL вашего Spring Boot сервера.
    // Если используете другой порт, замените 8080 на свой.
    baseURL: 'http://localhost:9090',
    headers: {
        'Content-type': 'application/json',
    },
});

// 2. Добавляем "перехватчик" (interceptor) для ЗАПРОСОВ
apiClient.interceptors.request.use(
    (config) => {
        // Достаем токен из localStorage (мы будем сохранять его туда при успешном логине)
        const token = localStorage.getItem('accessToken');

        // Если токен есть, прикрепляем его к заголовку Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Добавляем "перехватчик" (interceptor) для ОТВЕТОВ - ловит 401 и обновляет токен
apiClient.interceptors.response.use(
    (response) => response, // Если всё ок, просто возвращаем ответ

    async (error) => {
        const originalRequest = error.config;

        // Обработка типичных ошибок, например 401 (Не авторизован / Токен истек) - еще не пытались повторить этот запрос
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.warn('Ошибка 401: Токен недействителен или истек.');

            originalRequest._retry = true; // Ставим метку, чтобы не уйти в бесконечный цикл

            try {
                // Пытаемся получить новый токен
                const data = await authApi.refreshToken();
                console.warn('Получен новый токен.');

                // Сохраняем новые данные
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                // Обновляем заголовок в упавшем запросе и повторяем его
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Если даже refresh token протух — разлогиниваем пользователя
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error)
    }
);