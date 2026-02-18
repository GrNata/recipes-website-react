import type {RecipeDto} from "../types";

/**
 * Группирует рецепты по значению конкретного типа категории.
 * Если у рецепта нет категории такого типа, он попадает в "Прочее".
 */
export const groupRecipesByCategoryType = (
    recipes: RecipeDto[],
    typeName: string | null
): Record<string, RecipeDto[]> => {

//     Если тип не выбран, возвращаем все рецепты в одной группе "Все"
    if (!typeName) {
        return { "Всего рецептов": recipes};
    }

    return recipes.reduce((groups, recipe) => {
        // Ищем значение категории, которое соответствует выбранному типу (например, "Кухня")
        // Так как categoryValues — это Map (объект), используем Object.values
        const categoryEntry = Object.values(recipe.categoryValues).find(
            (cat) => cat.typeName === typeName
        );

        const groupName = categoryEntry ? categoryEntry.categoryValue : "Прочее";

        if (!groups[groupName]) {
            groups[groupName] = [];
        }

        groups[groupName].push(recipe);
        return groups
    }, {} as Record<string, RecipeDto[]>);
};