import { apiClient } from "./axios.ts";

export const homeApi = {
    // Случайные рецепты для главного баннера (Hero)
    getRandomRecipes: async (limit = 3) => {
        const response = await apiClient.get('/api/public/home/random-recipes',
            { params: {limit}}
        );
        return response.data;
    },

    // Топ рецептов по рейтингу
    getTopRecipes: async (limit = 4) => {
        const response = await apiClient.get('/api/public/home/top-recipes',
            { params: { limit} }
        );
        return response.data;
    },

    // Топ авторов
    getTopAuthor: async (limit = 5) => {
        const response = await apiClient.get('/api/public/home/top-author',
            { params: { limit }}
        );
        return response.data;
    }
};