import {apiClient} from "./axios";
import {s} from "vite/dist/node/chunks/moduleRunnerTransport";
import type {BlockUserRequest, UpdateUserRoleRequest} from "../types";

export const adminApi = {
    getAllUsers: async () => {
        const response = await apiClient.get('/api/admin/users');
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
    }

    // Здесь позже добавим методы для Категорий и Ингредиентов
//     ИНГРЕДИЕНТЫ
    getAllIngredients: async () => {
        const response = await apiClient.get('/api/admin/ingredients');
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
};