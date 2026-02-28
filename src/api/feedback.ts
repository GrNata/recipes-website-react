import { apiClient } from "./axios";
import type {FeedbackRequest, FeedbackResponse, FeedbackStatus} from "../types";
import type { PageResponse } from "./recipes";


export const feedbackApi = {
    // Получить страницу тикетов (по умолчанию 0 страница, 10 элементов)
    getAllTickets: async (page: number = 0, size: number = 10): Promise<PageResponse<FeedbackResponse>> => {
        const response = await apiClient.get<PageResponse<FeedbackResponse>>(`/api/admin/feedback?page=${page}&size=${size}`);
        return response.data;
    },

    // Обновить статус тикета
    updateStatus: async (id: number, status: FeedbackStatus): Promise<void> => {
        await apiClient.put(`/api/admin/feedback/${id}/status`, { status });
    },

//     Отправка сообщения от пользователя
    createFeedback: async (data: FeedbackRequest): Promise<void> => {
        await apiClient.post('/api/feedback', data);
    },

    getPagedFeedback: async (
        page = 0,
        size = 10,
        filters?: {
            search?: string;
            topic?: string;
            status?: string;
            dateFrom?: string;
            dateTo?: string
        }
    ) => {
        const response = await apiClient.get<any>('/api/admin/feedback/page', {
            params: {
                page,
                size,
                search: filters?.search || undefined,
                topic: filters?.topic || undefined,
                status: filters?.status || undefined,
                dateFrom: filters?.dateFrom || undefined,
                dateTo: filters?.dateTo || undefined
            }
        });
        return response.data;
    },
};