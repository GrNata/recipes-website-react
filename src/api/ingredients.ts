import { apiClient } from "./axios";
import type { IngredientDto } from '../types';

export const ingredientApi = {
    // Получить вообще все для выпадающего списка
    getAll: async () => {
        const response = await apiClient.get<IngredientDto[]>('/api/ingredients/all');
        return response.data;
    },
    // Поиск ингредиентов с пагинацией (если их тысячи)
    getPaged: async (name?: string, page = 0, size = 10) => {
        const response = await apiClient.get<any>('/api/ingredients', {
            params: { name, page, size }
        });
        return response.data;
    }
};