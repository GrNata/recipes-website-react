import React, { useEffect, useState } from "react";
import { Heart, Edit, Trash2, PlusCircle } from 'lucide-react';   //  иконка сердце
import { useAuth} from "../../context/AuthContext";
import { recipeApi } from "../../api/recipes";
import { favoriteApi } from "../../api/favorites";
import type {RecipeDto} from "../../types";
import { groupRecipesByCategoryType } from "../../utils/recipeUtils";
import { filterRecipesByStrictCategory } from "../../utils/recipeFiltersByCategory";
import { SidebarCategory } from "../../components/sidebar/SidebarCategory";
import { fetchSearchedRecipes } from "../../utils/searchRecipeByNameOrIngredient";
import { useLocation, useNavigate } from "react-router-dom";
import style from "./RecipeList.module.css";
import {IngredientSelectorComponent} from "../../components/ingredientSelector/IngredientSelectorComponent.tsx";


const RecipeList: React.FC = () => {
    const [recipes, setRecipes] = useState<RecipeDto[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Стейт для хранения ID рецептов, которые добавлены в избранное
    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

    const { isAuthenticated } = useAuth();  //  поверка логина

    // Получаем параметр search из URL: ?search=борщ
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');

    // Определяем, на какой мы странице - '/' или '/favorites', или '/my-recipes'
    const isFavoritesPage = location.pathname === '/favorites';
    const isMyRecipesPage = location.pathname === '/my-recipes';

    // 1. Загрузка списка рецептов (Главная ИЛИ Избранное)
    useEffect(() => {
        const loadRecipes = async () => {
            setLoading(true);
            try {
                let data;

                if (isFavoritesPage) {
                    // 1. Загружаем ВСЕ избранные рецепты с бэкенда
                    data = await favoriteApi.getFavorites();

                    // 2. ДОБАВЛЯЕМ ЛОКАЛЬНУЮ ФИЛЬТРАЦИЮ ПО ТЕКСТУ!
                    if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        data = data.filter((r: RecipeDto) =>
                            r.name.toLowerCase().includes(query) ||
                            r.ingredients.some(ing => ing.name.toLowerCase().includes(query))
                        );
                    }

                } else if(isMyRecipesPage) {
                    const response = await recipeApi.getMyRecipes();
                    data = response.content || response;        // Достаем из Page

                    // Локальная фильтрация по тексту для Моих рецептов
                    if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        data = data.filter((r: RecipeDto) =>
                            r.name.toLowerCase().includes(q) ||
                            r.ingredients.some(ing => ing.name.toLowerCase().includes(q))
                        );
                    }
                } else if (searchQuery) {
                    // Вызываем поиск по обоим полям (имя или ингредиент)
                    data = await fetchSearchedRecipes(searchQuery, searchQuery);
                } else {
                    // Обычная загрузка всех рецептов
                    const response = await recipeApi.search();
                    // Учитываем структуру PageResponse
                    data = (response).content || response;
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
    }, [searchQuery, isFavoritesPage, isMyRecipesPage]);  // Перезагружаем при изменении поиска или нужной страницы

    // 2. Загрузка ID избранных рецептов (чтобы закрасить сердечки)
    useEffect(() => {
        if (isAuthenticated) {
            console.log('recipeList: useEffect isAuthenticated')
            favoriteApi.getFavorites().then(favs => {
                // Собираем все ID в Set для быстрого поиска
                setFavoritedIds(new Set(favs.map(r => r.id)));
            }).catch(console.error);
            console.log('recipeList: useEffect isAuthenticated setFavoritedIds: ', favoritedIds)
        } else {
            setFavoritedIds(new Set());     // Очищаем, если не залогинен
        }
    }, [isAuthenticated]);

    // 3. Логика клика по сердечку
    const toggleFavorite  =async (e: React.MouseEvent, recipeId: number) => {
        // Добавляем параметр (e: React.MouseEvent)
            e.preventDefault();
            e.stopPropagation(); // Блокируем клик, чтобы он не ушел на саму карточку

            console.log("Клик по сердечку! ID рецепта:", recipeId);
            console.log("Текущее избранное:", Array.from(favoritedIds));

        try {
            if (favoritedIds.has(recipeId)) {
                // Если уже в избранном -> Удаляем
                await favoriteApi.removeFavorite(recipeId);
                setFavoritedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(recipeId);
                    return newSet;
                });
                // Если мы прямо сейчас на странице "Избранное", убираем карточку с экрана
                if (isFavoritesPage) {
                    setRecipes(prev => prev.filter(r => r.id !== recipeId));
                }
            } else {
                // Если нет в избранном -> Добавляем
                await favoriteApi.addFavorite(recipeId);
                setFavoritedIds(prev => new Set(prev).add(recipeId));
            }
        } catch (e) {
            console.error("Ошибка при обновлении избранного:", e);
        }
    }

    // Функция для подсветки текста - при поиске по названию
    const highlightText = (test: string, highlight: string | null) => {
        // Если поиска нет, просто возвращаем обычный текст
        if (!highlight || !highlight.trim()) {
            return test;
        }
        // Создаем регулярное выражение для поиска без учета регистра ('gi' - global, ignore case)
        const regex = new RegExp(`(${highlight})`, `gi`);

        // Разбиваем строку на массив частей: совпадения и обычный текст
        const parts = test.split(regex);

        return parts.map((part, index) =>
            // Если часть совпадает с регуляркой, оборачиваем в стилизованный тег
            regex.test(part) ? (
                <span key={index} style={{backgroundColor: '#EDC7B&', color: '#4F3786', borderRadius: '3px', padding: '0 2px'}} >
                    {part}
                </span>
            ) : (
                <span key={index}>{part}</span>
            )
        );
    }

    // 1. Сначала фильтруем, если выбрано конкретное значение
    const filteredRecipes = selectedValue
        ? filterRecipesByStrictCategory(recipes, selectedType, selectedValue)
        : recipes;

    // Применяем функцию группировки рецептов по категориям
    const groupedData = groupRecipesByCategoryType(filteredRecipes, selectedType);

    const handleIngredientSearch = async (ids: number[]) => {
        setLoading(true);
        try {
            console.log('Search isFavoritesPage: ', isFavoritesPage)
            if (isFavoritesPage || isMyRecipesPage) {
                // 1. Скачиваем базу для фильтрации СТРАНИЦЫ "ИЗБРАННОЕ" или "МЩИ РКЦЕПТЫ"
                // let favs = await favoriteApi.getFavorites();
                let baseData = isFavoritesPage
                    ? await favoriteApi.getFavorites()
                    : (await recipeApi.getMyRecipes()).content;

                // Если есть текст в строке поиска TopBar, учитываем и его
                console.log('Search searchQuery: ', searchQuery)
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    console.log('Search favorite name q: ', q)
                    baseData = baseData.filter(r =>
                        r.name.toLowerCase().includes(q) ||
                        r.ingredients.some(i => i.name.toLowerCase().includes(q))
                    );
                    console.log('Search favorite name baseData: ', baseData)
                }
                // Если выбраны ингредиенты-чипсы, фильтруем по ним
                if (ids.length > 0) {
                    // Рецепт должен содержать ВСЕ выбранные ингредиенты
                    baseData = baseData.filter(recipe =>
                        ids.every(id => recipe.ingredients.some(ing => ing.id === id))
                    );
                }
                setRecipes(baseData);
            } else {
                // 2. ФИЛЬТРАЦИЯ ЧЕРЕЗ БЭКЕНД ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
                if (ids.length === 0) {
                    const response = searchQuery
                        ? await fetchSearchedRecipes(searchQuery)
                        : await recipeApi.search();
                    // @ts-ignore
                    setRecipes(response.content || response);
                } else {
                    const data = await recipeApi.searchByIngredients(ids);
                    setRecipes(data);
                }
            }
        } catch (e) {
            console.error('Ошибка при поиске рецептов по ингредиентам: ', e);
        } finally {
            setLoading(false);
        }
    }

//     Функиция удаления рецепта
    const handleDeleteRecipe = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm("Вы уверены, что хотите удалить этот рецепт?")) {
            try {
                await recipeApi.deleteRecipe(id);
            //     Удаляет карточку мгновенно
                setRecipes(prev => prev.filter(r => r.id !== id));
            } catch (error) {
                console.error("Ошибка при удалении рецепта:", error);
                alert("Не удалось удалить рецепт.");
            }
        }
    };

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
                    {/* Скрываем поиск по ингредиентам на странице избранного, если хотим */}
                    {/*{!isFavoritesPage && <IngredientSelectorComponent onSearch={handleIngredientSearch}/>}*/}
                    <IngredientSelectorComponent onSearch={handleIngredientSearch}/>
                </div>

                {/* Заголовок и кнопка создания */}
                <div className={style.blockTitleAndCreate}>
                    <h1 className={style.title}>
                        {isFavoritesPage ? <span className={style.title}>Избранное ⭐</span> :
                            isMyRecipesPage ? <span className={style.title}>Мои рецепты 📝</span> :
                                (
                            <>
                                <span className={style.title7}>Р </span>
                                <span className={style.title6}>е </span>
                                <span className={style.title5}>ц </span>
                                <span className={style.title4}>е </span>
                                <span className={style.title5}>п </span>
                                <span className={style.title6}>т </span>
                                <span className={style.title7}>ы</span>
                            </>
                    )}
                    </h1>

                    {/* Кнопка Добавить рецепт */}
                    {isMyRecipesPage && (
                        <button
                            // onClick={() => console.log("Создание рецепта")}
                            onClick={() => navigate('/recipe/new')}
                            className={style.btnCreate}
                        >
                            <PlusCircle size={20} /> Создать рецепт
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{textAlign: 'center', marginTop: '50px', fontSize: '1.2rem', color: '#123C69'}}>
                        ⏳ Загрузка вкусных рецептов...
                    </div>
                ) : recipes.length === 0 && isFavoritesPage ? (
                    <div style={{textAlign: 'center', marginTop: '50px', fontSize: '1.2rem', color: '#123C69'}}>
                        У вас пока нет избранных рецептов 💔
                    </div>
                ) : (

                    Object.entries(groupedData).map(([groupName, groupRecipes]) => (
                        // Убираем группу "Прочее", если она не нужна
                        groupName !== "Прочее" && (

                        <div key={groupName} style={{ marginBottom: '40px' }}>
                            <h2 style={{ borderBottom: '2px solid #D2787A', paddingBottom: '5px', color: '#123C69'}}>
                                {groupName} ({groupRecipes.length})
                            </h2>

                                <div className={style.grid}>
                                    {groupRecipes.map(recipe => (
                                        <div key={recipe.id} className={style.card}>

                                            {/*Верх только для залогиненных*/}
                                            <div className={style.favoriteRow}>

                                                {/* Кнопки Редактировать и Удалить (Только в Моих рецептах) */}
                                                {isMyRecipesPage && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // console.log("Редактирование рецепта")}}
                                                                navigate(`/recipe/edit/${recipe.id}`);
                                                            }}
                                                            className={style.editBtn}
                                                        >
                                                            <Edit size={20} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteRecipe(e, recipe.id)}
                                                            className={style.deleteBtn}
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </>
                                                )}

                                                { isAuthenticated && (
                                                    <button className={style.heartBtn}
                                                            onClick={(e) => toggleFavorite(e, recipe.id)}
                                                    >
                                                        <Heart
                                                            size={24}
                                                            color="red"
                                                            fill={favoritedIds.has(recipe.id) ? "red" : "none"} //  Временная логика
                                                            />
                                                    </button>
                                                )}
                                            </div>

                                            {/*Середина две колонки*/}
                                            <div className={style.mainContent}>
                                                <div className={style.leftCol}>
                                                    <img
                                                        src={recipe.image || 'https://via.placeholder.com/100'}
                                                        alt={recipe.name}
                                                        className={style.recipePhoto}
                                                    />
                                                </div>
                                                <div className={style.righCol}>
                                                    <h3 className={style.recipeName}>
                                                        {highlightText(recipe.name, searchQuery)}
                                                    </h3>
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

                                            <button
                                                className={style.viewButton}
                                                onClick={() => navigate(`/recipe/${recipe.id}`)}
                                            >
                                                Смотреть детали
                                            </button>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))
                )}
            </main>
        </div>
    );
};

export default RecipeList;