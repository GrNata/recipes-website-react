import { apiClient } from "./axios.ts";

//  -------   IMAGE - отправляем её на сервер, получаем короткую ссылку (вида /uploads/recipes/...) и сохраняем эту ссылку в наш общий стейт рецепта. А потом, при нажатии "Сохранить рецепт", отправляем уже привычный JSON.

export const uploadRecipeImage = async (file: File): Promise<string> => {
    // Для файлов всегда создаем FormData
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<{imageUrl: string}>('/api/images/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data.imageUrl;
};