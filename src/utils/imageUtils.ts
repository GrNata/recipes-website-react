export const getImageUrl = (imagePath?: string | null): string => {
    // Если картинки нет вообще - отдаем заглушку
    if (!imagePath) return 'https://via.placeholder.com/800x400?text=Нет+фото';

    // Если это старая внешняя картинка (начинается с http) - отдаем как есть
    if (imagePath.startsWith('http')) return imagePath;

    // Иначе приклеиваем наш базовый URL из .env (или localhost на крайний случай)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';

    // 3. Проверяем: если путь от бэкенда УЖЕ содержит /api,
    // то не нужно добавлять его еще раз из baseUrl
    if (imagePath.startsWith('/api')) {
        return imagePath;
    }

    // 4. Если в пути нет /api, склеиваем

    return `${baseUrl}${imagePath}`;
}