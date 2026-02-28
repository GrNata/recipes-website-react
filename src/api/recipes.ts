import { apiClient } from "./axios";
import type {CreateRecipeRequest, RecipeDto, UpdateRecipeRequest} from "../types";
// import {authApi} from "./auth.ts";
// import {authApi} from "./auth.ts";

//Интерфейс для пагинации (Spring Boot Page)
export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;     //  текущая страница
}

export interface RecipeSearchByIngredientRequest {
    ingredientId: number[];
}

export const recipeApi = {
//     Получение всех рецептов c пагинацией
//     getAll: async (page: number = 0, size: number = 10) => {
    search: async (name?: string, ingredient?: string) => {
        const response = await apiClient.get<PageResponse<RecipeDto>>('/api/recipes/search', {
            params: { name, ingredient }
        });
        return response.data;
    },

    // Получение рецепта по ID
    getById: async (id: number) => {
        const response = await apiClient.get<RecipeDto>(`/api/recipes/${id}`);
        return response.data;
    },

    // Поиск по списку ID ингредиентов (POST)
    searchByIngredients: async (ingredientIds: number[]) => {
        const response = await apiClient.post<RecipeDto[]>('/api/recipes/search/by-ingredients', {
            ingredientIds
        });
        return response.data;
    },

    // Получить "Мои рецепты" (временно берем 100 штук, чтобы локально фильтровать)
    getMyRecipes: async (page = 0, size = 100) => {
        const response = await apiClient.get(`/api/recipes/my/recipes?page=${page}&size=${size}`);
        return response.data;
    },

    // Удалить рецепт
    deleteRecipe: async (id: number) => {
        await apiClient.delete(`/api/recipes/${id}`);
    },

//     Редактировать рецепт
    updateRecipe: async (id: number, recipeData: any) => {
        const response = await apiClient.put(`/api/recipes/${id}`, recipeData);
        return response.data;
    },

//     Создать рецепт
    createRecipe: async (recipeData: any) => {
        const response = await apiClient.post<RecipeDto>('/api/recipes', recipeData);
        return response.data;
    },

//     Добавить рейтинг рецепту
    rateRecipe: async (recipeId: number, score: number) => {
        return await apiClient.post(`/api/recipes/${recipeId}/rate`, { score })
    },


//     -------- Модерация --------
    // Получить рецепты на модерации
    getPendingPecipes : async () => {
        const response = await apiClient.get('/api/recipes/moderation/pending');
        return response.data;
    },

//      Одобрить рецепт
    approveRecipe: async (id: number) => {
        await apiClient.patch(`/api/recipes/${id}/approve`);
    },

//    Oтклонить рецепт
    rejectRecipe: async (id: number) => {
        await apiClient.patch(`/api/recipes/${id}/reject`);
    },

//     Пользователь отправляет на модерацию (из DRAFT в PENDING)
    sendToModeration: async (id: number) => {
        await apiClient.patch(`/api/recipes/${id}/send-to-moderation`);
    }
};