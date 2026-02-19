import { recipeApi } from "../api/recipes";
import type { RecipeDto } from "../types";

/**
 * Функция для выполнения запроса к API с параметрами поиска.
 */
export const fetchSearchedRecipes = async (
    name?: string,
    ingredient?: string
): Promise<RecipeDto[]> => {
    // Если оба поля пустые, бэкенд вернет все рецепты
    // Явно указываем, что мы ждем массив RecipeDto
    // const data = await recipeApi.search(name, ingredient);
    const data = await recipeApi.search(name);

    console.log("SEARCH..  data: ", data)

    // return (data as any).content || data;
    return (data).content || data;
};