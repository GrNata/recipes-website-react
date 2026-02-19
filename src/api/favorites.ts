import { apiClient } from "./axios";
import type { RecipeDto } from '../types';

export const favoriteApi = {
    // Получить список избранных рецептов
    getFavorites: async () => {
        const response = await apiClient.get<RecipeDto[]>('/api/favorites');
        return response.data;
    },

    // Добавить в избранное
    addFavorite: async (recipeId: number) => {
        await apiClient.post(`/api/favorites/${recipeId}`)
    },

    // Удалить из избранного
    removeFavorite: async (recipeId : number) => {
        await apiClient.delete(`/api/favorites/${recipeId}`)
    }
};