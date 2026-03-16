import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      VitePWA({
          registerType: 'autoUpdate', // Приложение само обновится у пользователей, когда вы зальете новый код
          includeAssets: ['man-cook.svg', 'man-cook-192.png'], // Кешируем иконки для оффлайна
          manifest: {
              name: 'Книга Рецептов',       // Полное название (при загрузке)
              short_name: 'Рецепты',        // Короткое название (под иконкой на телефоне)
              description: 'Ваша личная кулинарная книга',
              theme_color: '#F7F0EC',       // Цвет верхней панели (шторки) в телефоне
              background_color: '#F7F0EC',  // Цвет фона при запуске (Splash screen)
              display: 'standalone',        // Открывать как отдельное приложение (без браузерной строки)
              icons: [
                  {
                      src: '/man-cook-192.png',
                      sizes: '192x192',
                      type: 'image/png'
                  },
                  {
                      src: '/man-cook-512.png',
                      sizes: '512x512',
                      type: 'image/png',
                      purpose: 'any maskable' // Android использует это для адаптации иконки под системную форму
                  }
              ]
          }
      })
  ],

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
