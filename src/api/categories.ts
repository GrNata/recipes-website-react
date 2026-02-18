import { apiClient } from './axios';

export interface CategoryTypeDto {
    id: number;
    nameType: string;
}

export interface CategoryValueDto {
    id: number;
    typeId: number;
    typeName: string;
    categoryValue: string;
}

export const categoryApi = {
    // Получение всех типов (например: Кухня, Тип блюда) - Публичные методы (для Sidebar)
    getTypes: async () => {
        const response = await apiClient.get<CategoryTypeDto[]>('/api/category-type');
        return response.data;
    },

    getAllValues: async () => {
        try {
            const response = await apiClient.get<CategoryValueDto[]>('api/category-value');
            return response.data;
        } catch (error) {
            console.error("api All Category Values ERROR: ", error);
            throw error; // Чтобы .catch() в Sidebar сработал
        }
    },

    // ADMIN методы (для панели управления)
    createType: async (name: string) => {
        return await apiClient.post('/api/admin/categories-types', { nameType: name});
    },

    createValue: async (typeId: number, value: string) => {
        return await  apiClient.post('/api/admin/category-values', {
            typeId: typeId,
            categoryValue: value
        });
    }
};


