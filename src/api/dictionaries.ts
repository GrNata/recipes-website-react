import {apiClient} from "./axios.ts";
import type {IngredientDto, UnitDto} from "../types";

export const dictionaryApi = {
  getIngredients: async () => {
      // Добавляем параметр size, чтобы получить все записи сразу
      const response =
          await apiClient.get<IngredientDto[]>('/api/ingredients/all?size=100').then(res => res.data);
      return response;
  },

    getUnits: async () => {
      const response = await apiClient.get<UnitDto[]>('/api/units');
      return response.data;
    }
};