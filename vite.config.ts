import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

// Если браузер запрашивает что-то по адресу /api, незаметно перешли этот запрос на http://localhost:9090
    server: {
        port: 5173, // Стандартный порт локального сервера React
        proxy: {
            // Это наш локальный аналог Nginx
            '/api': {
                target: 'http://localhost:9090', // Куда перенаправлять запросы (ваш Spring Boot)
                changeOrigin: true,              // Меняет заголовок Origin на target URL
                secure: false,                   // Отключаем проверку SSL (у нас же нет https на localhost)
            }
        }
    }
})
