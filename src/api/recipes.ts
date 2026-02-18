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

    // Поиск по списку ID ингредиентов (POST)
    searchByIngredients: async (ingredientIds: number[]) => {
        const response = await apiClient.post<RecipeDto[]>('/api/recipes/search/by-ingredients', {
            ingredientIds
        });
        return response.data;
    }
};