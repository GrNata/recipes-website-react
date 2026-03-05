import React, { useEffect, useState } from "react";
import {
    Heart,
    Edit,
    Trash2,
    PlusCircle,
    FlagIcon,
    Menu,
    ChevronLeft,
    Search,
    ChevronDown,
    ChevronUp
} from 'lucide-react';   //  иконка сердце
import { useAuth} from "../../context/AuthContext";
import { recipeApi } from "../../api/recipes";
import { favoriteApi } from "../../api/favorites";
import type { RecipeDto } from "../../types";
import { groupRecipesByCategoryType } from "../../utils/recipeUtils";
import { filterRecipesByStrictCategory } from "../../utils/recipeFiltersByCategory";
import { SidebarCategory } from "../../components/sidebar/SidebarCategory";
import { fetchSearchedRecipes } from "../../utils/searchRecipeByNameOrIngredient";
import { useLocation, useNavigate} from "react-router-dom";
import { toast } from "react-hot-toast";
import 'react-toastify/dist/ReactToastify.css';
import style from "./RecipeList.module.css";
import {IngredientSelectorComponent} from "../../components/ingredientSelector/IngredientSelectorComponent";
import {getImageUrl} from "../../utils/imageUtils.ts";
import { StarRating} from "../../components/rating/StartRatingProps";


const RecipeList: React.FC = () => {
    const [recipes, setRecipes] = useState<RecipeDto[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    // открыт ли сайдбар (по умолчанию открыт)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // открыт ли поиск по ингредиентам (по умолчанию закрыт)
    const [isIngredientSearchOpen, setIsIngredientSearchOpen] = useState(false);
    // Использован поиск (ингредиенты или по названиям) или все рецепты
    const [isAllOrSearch, setAllOrSearch] = useState(true);


    // Стейт для хранения ID рецептов, которые добавлены в избранное
    const [favoritedIds, setFavoritedIds] = useState<Set<number>>(new Set());

    const { isAuthenticated } = useAuth();  //  поверка логина

    // При удалении
    const [deletingId, setDeletingId] = useState<number | null>(null);

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
            setAllOrSearch(true);
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
                    // data = await fetchSearchedRecipes(searchQuery, searchQuery);
                    data = await fetchSearchedRecipes(searchQuery);
                } else {
                    // Обычная загрузка всех рецептов
                    const response = await recipeApi.search();
                    // Учитываем структуру PageResponse
                    data = (response).content || response;
                }

                //  ФИЛЬТРАЦИЯ ПО СТАТУСУ
                // Если мы НЕ на странице "Мои рецепты", оставляем только APPROVED
                if (!isMyRecipesPage) {
                    data = data.filter((r: RecipeDto) => r.status === 'APPROVED');
                }

                if (!data) {
                    return (
                        <div>
                            К сожадению ничего не найдено.
                        </div>
                    )
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

        try {
            if (favoritedIds.has(recipeId)) {
                // Если уже в избранном -> Удаляем
                await favoriteApi.removeFavorite(recipeId);
                toast.success('Удалено из избранного', { icon: '💔' });
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
                toast.success('Добавлено в избранное!', { icon: '❤️' });
                setFavoritedIds(prev => new Set(prev).add(recipeId));
            }
        } catch (e) {
            toast.error('Не удалось обновить избранное.');
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
            if (isFavoritesPage || isMyRecipesPage) {
                // 1. Скачиваем базу для фильтрации СТРАНИЦЫ "ИЗБРАННОЕ" или "МЩИ РКЦЕПТЫ"
                // let favs = await favoriteApi.getFavorites();
                let baseData = isFavoritesPage
                    ? await favoriteApi.getFavorites()
                    : (await recipeApi.getMyRecipes()).content;

                // Если есть текст в строке поиска TopBar, учитываем и его
                if (searchQuery) {
                    setAllOrSearch(false);
                    const q = searchQuery.toLowerCase();
                    baseData = baseData.filter(r =>
                        r.name.toLowerCase().includes(q) ||
                        r.ingredients.some(i => i.name.toLowerCase().includes(q))
                    );
                }
                // Если выбраны ингредиенты-чипсы, фильтруем по ним
                if (ids.length > 0) {
                    setAllOrSearch(false);
                    // Рецепт должен содержать ВСЕ выбранные ингредиенты
                    baseData = baseData.filter((recipe: RecipeDto) =>
                        ids.every(id => recipe.ingredients.some(ing => ing.id === id))
                    );
                }
                //  Для Избранного оставляем только APPROVED
                if (isFavoritesPage) {
                    baseData = baseData.filter((r: RecipeDto) => r.status === 'APPROVED');
                }
                setRecipes(baseData);

            } else {
                // 2. ФИЛЬТРАЦИЯ ЧЕРЕЗ БЭКЕНД ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
                let dataToSet;
                if (ids.length === 0) {
                    setAllOrSearch(true);
                    const response = searchQuery
                        ? await fetchSearchedRecipes(searchQuery)
                        : await recipeApi.search();
                    // @ts-ignore
                    dataToSet = response.content || response;
                } else {
                   dataToSet = await recipeApi.searchByIngredients(ids);
                }
                //     ФИЛЬТРАЦИЯ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
                dataToSet = dataToSet.filter((r: RecipeDto) => r.status === 'APPROVED');

                setRecipes(dataToSet);
            }
        } catch (e) {
            console.error('Ошибка при поиске рецептов по ингредиентам: ', e);
        } finally {
            setLoading(false);
        }
    }

//     Функиция удаления рецепта
    const handleDeleteRecipe = async (e: React.MouseEvent, recipeId: number, recipeName: string) => {
        e.preventDefault();
        e.stopPropagation();        // Останавливаем распространение клика дальше по элементам

        if (deletingId === recipeId) return;    // Если уже удаляем — игнорируем клик

        // @ts-ignore
        if (!window.confirm("Вы уверены, что хотите удалить этот рецепт?", {recipeName})) {
            return;
        }

        setDeletingId(recipeId); // Блокируем

        // 2. Создаем обещание для удаления
        const deletePromise = recipeApi.deleteRecipe(recipeId);
        // 3. Запускаем красивый Toast
        toast.promise(deletePromise, {
            loading: 'Удаление рецепта...',
            success: 'Рецепт успешно удален 🗑️',
            error: 'Не удалось удалить рецепт ❌',
        });

            try {
                // Ждем реального удаления на сервере
                await deletePromise;
            //     Удаляет карточку мгновенно
                setRecipes(prev => prev.filter(r => Number(r.id) !== Number(recipeId)));
            } catch (err) {
                console.error("Ошибка при удалении рецепта:", err);
                // ХИТРОСТЬ: Если сервер ответил 404, значит рецепта в базе И ТАК НЕТ.
                // Поэтому мы всё равно удаляем его из списка в интерфейсе!
                // if (err.response?.status === 404) {
                //     setRecipes(prev => prev.filter(r => Number(r.id) !== Number(recipeId)));
                // }
            } finally {
                // setLoading(false);
                setDeletingId(null);           // Разблокируем (хотя карточка уже исчезнет)
            }
        };

// //     Функция определения цвета  - модерация
//     const getStatusColor = (status: string) => {
//         switch (status) {
//             case 'DRAFT': return '#848484'; // Серый
//             case 'PENDING': return '#C39243'; // Желтый
//             case 'APPROVED': return '#74AF3C'; // Зеленый
//             case 'REJECTED': return '#BF3030'; // Красный
//             default: return '#848484'
//         }
//     }

//     обработчик отправки на модерацию
    const handleSendToModeration = async (
                                          e: React.MouseEvent,
                                          recipeId: number,
                                          currentStatus: string
                            ) => {
        e.stopPropagation();
        if (currentStatus === 'DRAFT' || currentStatus === 'REJECTED') {
        // if (currentStatus === 'REJECTED') {
            try {
                await recipeApi.sendToModeration(recipeId);
                // Обновляем статус локально для мгновенной реакции UI
                setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, status: 'PENDING' } : r));
            } catch (e) {
                console.error("Ошибка при отправке на модерацию", e);
            }
        };
    };

    // // Голосование - рейтинг рецептв
    // // const handleRatingSubmit = async (score: number) => {
    // const handleRatingSubmit = async ( e: React.MouseEvent, recipeId: number) => {
    //     try {
    //         await recipeApi.rateRecipe(Number(id), score);
    //         toast.success('Ваша оценка учтена!');
    //         //     Можно обновить состояние рецепта, чтобы цифры обновились
    //         const updated = await recipeApi.getById(Number(id));
    //         setRecipe(updated);
    //     } catch (e) {
    //         console.error('Не удалось отправить оценку ', e);
    //         toast.error('Не удалось отправить оценку')
    //     }
    // };

// --- УДАЛЯЕМ ЭТУ СТРОКУ, ОНА СБРАСЫВАЕТ СТЕЙТ ---
//     if (loading) return <div> Загрузка рецептов... </div>;

    return (
        <div className={style.mainContainer}>
            {/* Sidebar остается фиксированным 240px */}

            {/* КНОПКА ПЕРЕКЛЮЧЕНИЯ САЙДБАРА */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{left: isSidebarOpen ? '240px' : '0'}}   //  // Двигается вместе с сайдбаром
                className={style.btnSidebarOpen}
                title={isSidebarOpen ? 'Скрыть фильтры категорий' : 'Показать фильтры категрий'}
            >
                {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} /> }
            </button>

            {/* ОБЕРТКА ДЛЯ САЙДБАРА С АНИМАЦИЕЙ */}
            <div
                className={`${style.sidebarBlock} ${isSidebarOpen ? style.sidebarBlockOpen : ''}`}
            >
                <SidebarCategory
                    onSelectType={setSelectedType}
                    onSelectValue={setSelectedValue}
                    selectedType={selectedType}
                    selectedValue={selectedValue}
                />
            </div>

            {/* Основной контент
            нужно сдвинуть сетку рецептов вправо, чтобы освободить место для Sidebar
            */}
            {/*// 1. ДИНАМИЧЕСКИЙ ОТСТУП: 240px если открыто, 0 если закрыто*/}
            {/*АНИМАЦИЯ: плавный сдвиг вслед за сайдбаром*/}
            <main className={style.pageContainer} style={{
                marginLeft: isSidebarOpen ? '240px' : '0',    // Место под Sidebar
                transition: 'margin-left 0.3s ease, padding-left 0.3s ease',    //  АНИМАЦИЯ: плавный сдвиг вслед за сайдбаром
                flexGrow: 1,        // Занимать все оставшееся место
                minWidth: 0,    // Позволяет контейнеру сжиматься внутри flex
                // width: '100%',
                padding: '20px', // Внутренний отступ от краев
                paddingLeft: isSidebarOpen ? '20px' : '60px',       // когда меню закрыто, даем слева 60px, чтобы карточки не наехали на синюю кнопку

                display: "flex",
                flexDirection: 'column',
                alignItems: 'center'    //  ВЫРАВНИВАНИЕ: центрируем всё содержимое внутри <main>
            }}>

                {/* 6. ДОБАВЛЯЕМ КОНТЕЙНЕР-ОБЕРТКУ для красоты */}
                {/* Это не даст карточкам и поиску растягиваться до бесконечности на огромных мониторах */}
                <div style={{ width: '100%', maxWidth: '1200px'}}>

                    {/*     БЛОК поиска по ИНГРЕДИЕНТАМ */}
                    <div className={style.ingredientSearchContainer}>
                        {/* Кнопка-переключатель */}
                        <button
                            className={style.btnToggleSearch}
                            onClick={() => setIsIngredientSearchOpen(!isIngredientSearchOpen)}
                        >
                            <Search size={20} color='#AC3B61' />
                            <span style={{ flexGrow: 1, textAlign: 'left'}}>
                                Поиск по ингредиентам
                            </span>
                            {isIngredientSearchOpen ? <ChevronUp size={20} color='#AC3B61' /> : <ChevronDown size={20} color='#AC3B61' />}
                        </button>
                        {/* Кнопка-переключатель */}
                        <div className={`${style.ingredientSearchContent} ${isIngredientSearchOpen ? style.open : ''}`}>
                            {/* Скрываем поиск по ингредиентам на странице избранного, если хотим */}
                            {/*{!isFavoritesPage && <IngredientSelectorComponent onSearch={handleIngredientSearch}/>}*/}
                            <IngredientSelectorComponent onSearch={handleIngredientSearch}/>
                        </div>
                    </div>

                    {/* Заголовок и кнопка создания */}
                    <div className={style.blockTitleAndCreate}>
                        <div className={style.titleBlock}>
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
                        </div>

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
                    ) :  isAllOrSearch && recipes.length === 0 ? (
                            <div style={{textAlign: 'center', marginTop: '100px', fontSize: '1.6rem', color: '#701332', height: '30px'}}>
                                <p>Не удалось найти рецепты. </p>
                                <p>Попробуйте изменить параметры поиска.</p>
                            </div>
                    ) : Object.entries(groupedData).length === 0 ? (
                            <div style={{textAlign: 'center', marginTop: '100px', fontSize: '1.6rem', color: '#701332'}}>
                                <p>Не удалось найти рецепты в данной категории. </p>
                                <p>Попробуйте поискать в другой категории.</p>
                            </div>
                    ) :

                        (Object.entries(groupedData).map(([groupName, groupRecipes]) => (
                            // Убираем группу "Прочее", если она не нужна
                            groupName !== "Прочее" && (

                            <div key={groupName} style={{ marginBottom: '40px' }}>
                                <h2 style={{ borderBottom: '2px solid #D2787A', paddingBottom: '5px', color: '#123C69'}}>
                                    {groupName} ({groupRecipes.length})
                                </h2>

                                    <div className={style.grid}>
                                        {groupRecipes.map(recipe => (
                                            <div
                                                key={recipe.id} className={style.card}
                                                onClick={() => navigate(`/recipe/${recipe.id}`)}
                                            >

                                                {/*Верх только для залогиненных*/}
                                                <div className={style.favoriteRow}>

                                                    {/* Кнопки Редактировать и Удалить (Только в Моих рецептах) */}
                                                    {isMyRecipesPage && (
                                                        <div className={style.btnBlock} >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // console.log("Редактирование рецепта")}}
                                                                    navigate(`/recipe/edit/${recipe.id}`);
                                                                }}
                                                                className={style.editBtn}
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                            <button
                                                                disabled={deletingId === recipe.id}
                                                                onClick={(e) => {
                                                                    handleDeleteRecipe(e, recipe.id, recipe.name);
                                                                }}
                                                                className={style.deleteBtn}
                                                            >
                                                                {
                                                                    deletingId === recipe.id ? '...' :
                                                                            <Trash2 size={18} />
                                                                }
                                                            </button>

                                                            {/*   СТАТУС рецепта*/}
                                                            <button
                                                                onClick={(e) => handleSendToModeration(e, recipe.id, recipe.status)}
                                                                className={`${style.statusBadge} ${
                                                                    recipe.status === 'DRAFT' ? style.statusDraft :
                                                                        recipe.status === 'PENDING' ? style.statusPending : style.statusPublished
                                                                }`}
                                                            >
                                                                <FlagIcon size={14} fill="currentColor" />
                                                                <p style={{fontSize: '0.5rem'}}>
                                                                {recipe.status === 'DRAFT' ? 'Отправить на модерацию' :
                                                                    recipe.status === 'PENDING' ? 'На проверке' : 'Опубликован'}
                                                                </p>
                                                            </button>

                                                        </div>
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
                                                            src={getImageUrl(recipe.image)}
                                                            alt={recipe.name}
                                                            className={style.recipePhoto}
                                                        />
                                                    </div>
                                                    <div className={style.righCol}>
                                                        <h3 className={style.recipeName}>
                                                            {highlightText(recipe.name, searchQuery)}
                                                        </h3>
                                                        <p className={style.recipeDescription}>{recipe.description}</p>
                                                    </div>
                                                </div>

                                                {/*Строка ингредиенты*/}
                                                <div className={style.ingredientsRow}>
                                                    {(recipe.ingredients || [])
                                                        .map(ingredient => ingredient.name).join(', ')
                                                    }
                                                </div>

                                                {/*Низ: Дата и Автор*/}
                                                <div className={style.footerRow}>
                                                    <span>⏱ {recipe.createdAt}</span>

                                                    <div className={style.tooltipContainer}>
                                                        {/*({recipe.averageRating.toFixed(1)} / {recipe.ratingCount} оценок(ка))*/}
                                                        <StarRating
                                                            initialRating={recipe.averageRating}
                                                            readonly
                                                            // onRate={handleRatingSubmit(recipe.id)}
                                                            size={16}
                                                        />

                                                        {/* Текст подсказки */}
                                                        <span className={style.tooltipText}>
                                                            Поставьте свою оценку рецепту зайдя в рецепт.
                                                        </span>
                                                    </div>
                                                    <span className={style.infoSpan}></span>

                                                    <span>{recipe.author.username}</span>
                                                </div>

                                                {/*<button*/}
                                                {/*    className={style.viewButton}*/}
                                                {/*    onClick={() => navigate(`/recipe/${recipe.id}`)}*/}
                                                {/*>*/}
                                                {/*    Смотреть детали*/}
                                                {/*</button>*/}

                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))
                    )}

                </div>
            </main>
        </div>
    );
};

export default RecipeList;