import { apiClient } from "./axios";
import type { RecipeDto } from "../types";
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

// //     Редактировать рецепт
//     updateRecipe: async (id: number, recipe: UpdateRecipeRequest) => {
//         const response = await apiClient.put(`/api/recipes/${id}`);
//     }

//     Создать рецепт
//     createRecipe: async ()
};