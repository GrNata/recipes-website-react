import { apiClient } from "./axios";
import type { FeedbackResponse, FeedbackStatus } from "../types";
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
    }
};