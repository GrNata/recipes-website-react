export const getImageUrl = (imagePath?: string | null): string => {
    // Если картинки нет вообще - отдаем заглушку
    if (!imagePath) return 'https://via.placeholder.com/800x400?text=Нет+фото';

    // Если это старая внешняя картинка (начинается с http) - отдаем как есть
    if (imagePath.startsWith('http')) return imagePath;

    // Иначе приклеиваем наш базовый URL из .env (или localhost на крайний случай)
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
    return `${baseUrl}${imagePath}`;
}