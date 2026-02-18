import React, { useEffect, useState } from "react";
import { Heart } from 'lucide-react';   //  иконка сердце
import { useAuth} from "../../context/AuthContext";
import { recipeApi } from "../../api/recipes";
import type {RecipeDto} from "../../types";
import { groupRecipesByCategoryType } from "../../utils/recipeUtils";
import { filterRecipesByStrictCategory } from "../../utils/recipeFiltersByCategory";
import { SidebarCategory } from "../../components/sidebar/SidebarCategory";
import { fetchSearchedRecipes } from "../../utils/searchRecipeByNameOrIngredient";
import {useLocation} from "react-router-dom";
import style from "./RecipeList.module.css";
import {IngredientSelectorComponent} from "../../components/ingredientSelector/IngredientSelectorComponent.tsx";

const RecipeList: React.FC = () => {
    const [recipes, setRecipes] = useState<RecipeDto[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const { isAuthenticated } = useAuth();  //  поверка логина

    // Получаем параметр search из URL: ?search=борщ
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');
    // const searchQuery = queryParams.get('searchQuery');

    useEffect(() => {
        const loadRecipes = async () => {
            setLoading(true);
            try {
                let data;
                if (searchQuery) {
                    // Вызываем поиск по обоим полям (имя или ингредиент)
                    data = await fetchSearchedRecipes(searchQuery, searchQuery);
                } else {
                    // Обычная загрузка всех рецептов
                    const response = await recipeApi.search();

                    console.log("RecipesList: data all: ", response.content)

                    // Учитываем структуру PageResponse
                    data = (response).content || response;
                    // data = response;
                }
                // @ts-ignore
                setRecipes(data);
            } catch (error) {
                console.error("Ошибка при загрузке рецептов:", error);
            } finally {
                setLoading(false);
            }
        };
        loadRecipes();
    }, [searchQuery]);  // Перезагружаем при изменении поиска

    // 1. Сначала фильтруем, если выбрано конкретное значение
    const filteredRecipes = selectedValue
        ? filterRecipesByStrictCategory(recipes, selectedType, selectedValue)
        : recipes;

    // Применяем функцию группировки рецептов по категориям
    const groupedData = groupRecipesByCategoryType(filteredRecipes, selectedType);

    // В будущем здесь будет запрос к API для добавления в избранное
    const toggleFavorite = (recipeId: number) => {
        console.log("Toggle favorite for:", recipeId)
    }

    const handleIngredientSearch = async (ids: number[]) => {
        setLoading(true);
        try {
            if (ids.length === 0) {
                // Если нажали "Сбросить всё", загружаем обычный поиск или все рецепты
                const response = await fetchSearchedRecipes();
                // const response = await fetchSearchedRecipes(searchQuery, searchQuery);
                setRecipes(response);
                // setRecipes(response.content || response);
            } else  {
                // Выполняем POST запрос по ингредиентам
                const data = await recipeApi.searchByIngredients(ids);
                setRecipes(data);
            }
        } catch (e) {
            console.error('Ошибка при поиске рецептов по ингредиентам: ', e);
        } finally {
            setLoading(false);
        }
    }

// --- УДАЛЯЕМ ЭТУ СТРОКУ, ОНА СБРАСЫВАЕТ СТЕЙТ ---
//     if (loading) return <div> Загрузка рецептов... </div>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh'}}>
            {/* Sidebar остается фиксированным 240px */}
            <SidebarCategory
                onSelectType={setSelectedType}
                onSelectValue={setSelectedValue}
                selectedType={selectedType}
                selectedValue={selectedValue}
            />

            {/* Основной контент
            нужно сдвинуть сетку рецептов вправо, чтобы освободить место для Sidebar
            */}
            <main className={style.pageContainer} style={{
                marginLeft: '240px',    // Место под Sidebar
                flexGrow: 1,        // Занимать все оставшееся место
                minWidth: 0,    // Позволяет контейнеру сжиматься внутри flex
                width: '100%',
                padding: '20px', // Внутренний отступ от краев
                display: "flex",
                flexDirection: 'column'
            }}>

                <div style={{paddingTop: '30px'}}>
                    <IngredientSelectorComponent onSearch={handleIngredientSearch}/>
                </div>


                <h1 className={style.title}>
                    {/*{searchQuery ? `Результаты поиска: ${searchQuery}` : 'Все рецепты!'}*/}

                    <span className={style.title1}>Р е  </span>
                    <span className={style.title2}>ц е п </span>
                    <span className={style.title3}>т ы</span>
                </h1>

                {Object.entries(groupedData).map(([groupName, groupRecipes]) => (
                    // Убираем группу "Прочее", если она не нужна
                    groupName !== "Прочее" && (

                    <div key={groupName} style={{ marginBottom: '40px' }}>
                        <h2 style={{ borderBottom: '2px solid #D2787A', paddingBottom: '5px', color: '#123C69'}}>
                            {groupName} ({groupRecipes.length})
                        </h2>

                            <div className={style.grid}>
                                {/*{recipes.map(recipe => (*/}
                                {groupRecipes.map(recipe => (
                                    <div key={recipe.id} className={style.card}>
                                        {/*Верх только для залогиненных*/}
                                        <div className={style.favoriteRow}>
                                            { isAuthenticated && (
                                                <button className={style.heartBtn}
                                                        onClick={() => toggleFavorite(recipe.id)}
                                                >
                                                    <Heart
                                                        size={24}
                                                        color="red"
                                                        fill={recipe.id % 2 === 0 ? "red" : "none"} //  Временная логика
                                                        />
                                                </button>
                                            )}
                                        </div>

                                        {/*Середина дву колонки*/}
                                        <div className={style.mainContent}>
                                            <div className={style.leftCol}>
                                                <img
                                                    src={recipe.image || 'https://via.placeholder.com/100'}
                                                    alt={recipe.name}
                                                    className={style.recipePhoto}
                                                />
                                            </div>
                                            <div className={style.righCol}>
                                                <h3 className={style.recipeName}>{recipe.name}</h3>
                                                <p className={style.info}>{recipe.description}</p>
                                            </div>
                                        </div>

                                        {/*Строка ингредиенты*/}
                                        <div className={style.ingredientsRow}>
                                            {(recipe.ingredients)
                                                .map(ingredient => ingredient.name).join(', ')
                                            }
                                        </div>

                                        {/*Низ: Дата и Автор*/}
                                        <div className={style.footerRow}>
                                            <span>⏱ {recipe.createdAt}</span>
                                            <span>{recipe.author.username}</span>
                                        </div>

                                        <button className={style.viewButton}>Смотреть детали</button>

                                        {/*    <p><strong>Категория:</strong>*/}
                                        {/*        {Object.values(recipe.categoryValues)*/}
                                        {/*            .map(cat => cat.categoryValue)*/}
                                        {/*            .join(', ')*/}
                                        {/*        }*/}
                                        {/*    </p>*/}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </main>
        </div>
    );
};

export default RecipeList;