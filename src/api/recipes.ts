import { apiClient } from "./axios";
import type {RecipeDto} from "../types";

//Интерфейс для пагинации (Spring Boot Page)
export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;     //  текущая страница
}

export const recipeApi = {
//     Получение всех рецептов c пагинацией
//     getAll: async (page: number = 0, size: number = 10) => {
    search: async (name?: string, ingredient?: string) => {
        const response =
            // await apiClient.get<PageResponse<RecipeDto>>('/api/recipes', {
            await apiClient.get<PageResponse<RecipeDto>>('/api/recipes/search', {
            params: { name, ingredient }
            // params: { page, size }
        });
        console.log("recipes: response.data:", response.data)
        return response.data;
    }
};