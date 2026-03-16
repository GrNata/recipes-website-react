import axios, {} from 'axios';
// import { authApi } from "./auth";

// 1. Создаем базовый клиент axios
export const apiClient = axios.create({
    // Указываем базовый URL вашего Spring Boot сервера.
    // Если используете другой порт, замените 8080 на свой.
    // baseURL: 'http://localhost:9090',
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-type': 'application/json',
    },
});

// --- ПЕРЕМЕННЫЕ ДЛЯ ОЧЕРЕДИ ЗАПРОСОВ ---
let isRefreshing = false; // Флаг: идет ли сейчас обновление токена?
let failedQueue: any[] = []; // Очередь запросов, которые ждут новый токен

// Функция для обработки накопившейся очереди
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// 2. Добавляем "перехватчик" (interceptor) для ЗАПРОСОВ
apiClient.interceptors.request.use(
    (config) => {
        // Достаем токен из localStorage (мы будем сохранять его туда при успешном логине)
        const token = localStorage.getItem('accessToken');

        // Если токен есть, прикрепляем его к заголовку Authorization
        // if (token) {
        if (token && config.headers) {
            // Надежное присваивание заголовка
            config.headers.Authorization = `Bearer ${token}`;

            console.log('TOKEN: добавлен в заголовок accessToken: ', token)
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Добавляем "перехватчик" (interceptor) для ОТВЕТОВ - ловит 401 и обновляет токен
// 3. Перехватчик ОТВЕТОВ (Умная обработка 401 и 403)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if ((error.response?.status === 401
            || error.response?.status === 403)
            && !originalRequest._retry) {

            // Если процесс обновления УЖЕ ИДЕТ, ставим текущий запрос в очередь
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    // Жесткая перезапись заголовка для очереди
                    originalRequest.headers.Authorization = `Bearer ${token}`;

                    console.log('TOKEN: добавлен в заголовок refreshToken: ', token)

                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            // Если мы тут, значит мы ПЕРВЫЙ упавший запрос. Начинаем обновление.
            // Начинаем процесс обновления (закрываем двери для других запросов)
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error("No refresh token");

                // ВАЖНО: Используем чистый axios для обновления
                const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`, {
                    refreshToken: refreshToken
                });

                const data = response.data;
                console.warn('Получен новый токен.');

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                // Токен получен! Отпускаем всю очередь ожидающих запросов
                processQueue(null, data.accessToken);

                // 🔥 Жесткая перезапись заголовка перед повторной отправкой
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

                console.log('TOKEN: добавлен в заголовок Жесткая перезапись заголовка перед повторной отправкой: ', data.accessToken)

                return apiClient(originalRequest);

            } catch (refreshError) {
                // Если рефреш-токен тоже протух:
                processQueue(refreshError, null);

                // 1. Очищаем локальное хранилище
                localStorage.clear();

                // 2. 🔥 ВАЖНО: Отправляем сигнал React-у, чтобы он мгновенно стер имя из TopBar!
                window.dispatchEvent(new Event('auth-logout'));

                // 3. Перебрасываем на логин
                window.location.href = '/login';

                return Promise.reject(refreshError);
            } finally {
                // В любом случае снимаем блокировку
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// apiClient.interceptors.response.use(
//     (response) => response, // Если всё ок, просто возвращаем ответ
//
//     async (error) => {
//         // Запоминаем оригинальный запрос, который упал с ошибкой
//         const originalRequest = error.config;
//
//         // Обработка типичных ошибок, например 401 (Не авторизован / Токен истек) - еще не пытались повторить этот запрос
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             console.warn('Ошибка 401: Токен недействителен или истек.');
//
//             originalRequest._retry = true; // Ставим метку, чтобы не уйти в бесконечный цикл
//
//             try {
//                 // Пытаемся получить новый токен
//                 // const data = await authApi.refreshToken();
//                 const refreshToken = localStorage.getItem('refreshToken');
//                 // console.warn('Получен новый токен.');
//
//                 // ВАЖНО: Используем ЧИСТЫЙ axios, а не apiClient!
//                 // Укажите правильный URL вашего бэкенда (можно взять из import.meta.env)
//                 // const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
//                 const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh-token`, {
//                     refreshToken: refreshToken
//                 });
//                 const data = response.data;
//                 console.warn('Получен новый токен.');
//
//                 // Сохраняем новые данные
//                 localStorage.setItem('accessToken', data.accessToken);
//                 localStorage.setItem('refreshToken', data.refreshToken);
//
//                 // Обновляем заголовок в упавшем запросе и повторяем его
//                 originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
//                 return apiClient(originalRequest);
//             } catch (refreshError) {
//                 // Если даже refresh token протух — разлогиниваем пользователя
//                 localStorage.clear();
//                 window.location.href = '/login';
//                 return Promise.reject(refreshError);
//             }
//         }
//         return Promise.reject(error)
//     }
// );