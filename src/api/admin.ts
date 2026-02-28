import {apiClient} from "./axios";
import {s} from "vite/dist/node/chunks/moduleRunnerTransport";
import type {BlockUserRequest, IngredientDto, RecipeDto, UpdateUserRoleRequest} from "../types";
import type {PageResponse} from "./recipes.ts";

export const adminApi = {
    getAllUsers: async () => {
        const response = await apiClient.get('/api/admin/users');
        return response.data;
    },

    filterUsers: async (params: {
        role?: string;
        blocked?: boolean;
        email?: string;
        lastLoginFrom?: string;
        lastLoginTo?: string;
    })=> {
        const response = await apiClient.get('/api/admin/users/filter', { params });
        return response.data;
    },

    getUserByEmail: async(email: string) => {
        const response = await apiClient.get(`/api/admin/users/by_email/${email}`);
        return response.data;
    },

    getUsersByRole: async(role: string) => {
        const response = await apiClient.get(`/api/admin/users/role"`, { role });
        return response.data;
    },

    updateUserRole: async(userId: number, request: UpdateUserRoleRequest) => {
        await apiClient.put(`/api/admin/users/${userId}/roles`, request);
    },

    updateBlockedStatus: async(userId: number, request: BlockUserRequest) => {
        const response = await apiClient.put(`/api/admin/users/${userId}/block`,  request );
        return response.data;
    },

     deleteUser: async(userId: number) => {
        await apiClient.delete(`/api/admin/users/${userId}`);
     },

    // --- СТАТИСТИКА И ЛОГИ ---
    // ЛОГИ
    getStatics: async () => {
        const response = await apiClient.get(`/api/admin/statistics`);
        return response.data;
    },

    // На основе AdminAuditController.kt
    getAuditLogs: async () => {
        const response = await apiClient.get(`/api/admin/audit`);
        return response.data;
    },

    filterAuditLogs: async (params: { actionType?: string; entityType?: string; from?: string; to?: string}) => {
        const response = await apiClient.get(`/api/admin/audit/filter`, { params });
        return response.data;
    },

    // СТАТИСТИКА
    getStatistics: async () => {
        const response = await apiClient.get('/api/admin/statistics');
        return response.data;
    },
    //    Рейтинг USERS по рейтингу их рецептов
    getTopUsersByRating: async (page = 0, size = 5) => {
        const response = await apiClient.get('/api/admin/users/rating', {
            params: { page, size }      // Это превратится в ?page=0&size=5
        });
        return response.data
    },


    // Здесь позже добавим методы для Категорий и Ингредиентов
//     ИНГРЕДИЕНТЫ
    getAllIngredients: async () => {
        const response = await apiClient.get('/api/admin/ingredients');
        return response.data;
    },

    // Поиск ингредиентов с пагинацией (если их тысячи)
    getPagedIngredients: async (name?: string, page = 0, size = 10): Promise<PageResponse<IngredientDto>>  => {
        const response = await apiClient.get<any>('/api/admin/ingredients/page', {
            params: { name, page, size }
        });
        return response.data;
    },

    createIngredient: async (data: { name: string, nameEng?: string, energyKcal100g?: number }) => {
        const response = await apiClient.post('/api/admin/ingredients', data);
        return response.data;
    },
    updateIngredient: async (id: number, data: { name: string, nameEng?: string, energyKcal100g?: number }) => {
        const response = await apiClient.put(`/api/admin/ingredients/${id}`, data);
        return response.data;
    },

    deleteIngredient: async (id: number) => {
        await apiClient.delete(`/api/admin/ingredients/${id}`);
    },


    //     КАТЕГОРИИ
    getCategoryTypes: async () => {
        const response = await apiClient.get('/api/admin/categories-types');
        return response.data;
    },

    createCategoryType: async (data: { nameType: string }) => {
        const response = await apiClient.post(`/api/admin/categories-types`, data);
        return response.data;
    },

    updateCategoryType: async (id: number, data: { nameType: string}) => {
        const response = await apiClient.put(`/api/admin/categories-types/${id}`, data);
        return response.data;
    },

    deleteCategoryType: async (id: number) => {
        await apiClient.delete(`/api/admin/categories-types/${id}`);
    },

    getAllCategoryValues: async () => {
        const response = await apiClient.get('/api/admin/category-values');
        return response.data;
    },

    // getCategoryValuesByTypeId: async (typeId: number) => {
    //     const response = await apiClient.get('')
    // }

    createCategoryValue: async (data: {typeId: number,  typeName: string, categoryValue: string} ) => {
        console.log('API: data = ', data)

        const response = await apiClient.post(`/api/admin/category-values`, data);
        return response.data;
    },

    updateCategoryValue: async (id: number, data: {typeId: number,  typeName: string, categoryValue: string}) => {
        const response = await apiClient.put(`/api/admin/category-values/${id}`, data);
        return response.data;
    },

    deleteCategoryValue: async (valueId: number) => {
        await apiClient.delete(`/api/admin/category-values/${valueId}`);
    },


};