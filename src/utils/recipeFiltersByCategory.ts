import type {RecipeDto} from "../types";

/**
 * Фильтрует рецепты по Типу категории И конкретному Значению.
 */

export const filterRecipesByStrictCategory = (
    recipes: RecipeDto[],
    typeName: string | null,
    valueName: string | null
) : RecipeDto[] => {
    if (!typeName) return recipes;
    if (!valueName) return recipes;

    return recipes.filter(recipe => {
        // Проверяем, есть ли у рецепта в Map значение, где тип и само значение совпадают с выбранными
        return Object.values(recipe.categoryValues).some(
            cat => cat.typeName === typeName && cat.categoryValue === valueName
        );
    });
};