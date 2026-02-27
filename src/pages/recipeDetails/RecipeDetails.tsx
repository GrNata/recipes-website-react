import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { recipeApi } from "../../api/recipes";
import { favoriteApi } from "../../api/favorites";
import { useAuth } from "../../context/AuthContext";
import type {RecipeDto} from "../../types";
import {
    ArrowLeft,
    Clock,
    User,
    Flame,
    Heart,
    ChevronUp,
    ChevronDown,
    Check,
    X,
    Clock1,
    Clock2,
    ClockAlert, ClockCheck
} from "lucide-react";
import { formatCookingTime } from "../../utils/FormatDateAndTimeForBackend";
import style from './RecipeDetails.module.css';


const RecipeDetails: React.FC = () => {
    // Получаем параметр id из URL
    const { id } = useParams<{ id: string}>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();

    const [recipe, setRecipe] = useState<RecipeDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFavorite, setIsFavorite] = useState(false);
    // const [currentServings, setCurrentServing] = useState<number>(1);

    // Читаем параметр из URL (?isModeratorDetail=true)
    const queryParams = new URLSearchParams(location.search);
    const isModeratorDetail = queryParams.get('isModeratorDetail') === 'true';

    // Проверяем, есть ли у пользователя права модератора/админа
    const isModeratorRole = user?.roles.includes('MODERATOR') || user?.roles.includes('ADMIN');

    // ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ ДЛЯ ПЕРЕСЧЕТА (калорий и порций) - МНОЖИТЕЛЬ
    const [multiplier, setMiltiplier] = useState<number>(1);

    useEffect(() => {
        const fetchRecipeAndFavorites = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const recipeData = await recipeApi.getById(Number(id));
                setRecipe(recipeData);

                // При загрузке множитель = 1
                setMiltiplier(1);   //      ???  = не 1 , а baseServings

                // // Устанавливаем базовые порции
                // setCurrentServing(recipeData.baseServings || 1);

                // Если авторизован, проверяем, есть ли рецепт в избранном
                if (isAuthenticated) {
                    const favs = await favoriteApi.getFavorites();
                    const isFavs = favs.some(r => r.id === Number(id));
                    setIsFavorite(isFavs);
                }
            } catch (error) {
                console.error("Ошибка при загрузке рецепта:", error);
                setError("Не удалось загрузить рецепт. Возможно, он был удален.");
            } finally {
                setLoading(false);
            }
        };
        fetchRecipeAndFavorites();
    }, [id, isAuthenticated]);

    // Обработчик клика по сердечку
    const toggleFavorite = async () => {
        if(!id) return;
        try {
            if (isFavorite) {
                await favoriteApi.removeFavorite(Number(id));
                setIsFavorite(false);
            } else {
                await favoriteApi.addFavorite(Number(id));
                setIsFavorite(true);
            }
        } catch (e) {
            console.error("Ошибка при обновлении избранного:", e);
        }
    }

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '50px', color: '#123C69' }}>⏳ Готовим страницу рецепта...</div>
    }
    if (error || !recipe) {
        return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red'}}>{error}</div>
    }

    // --- ЛОГИКА ПЕРЕСЧЕТАИ ФОРМАТИРОВАНИЯ ---Считаем текущие порции (с округлением до 1 знака)
    const currentServings = Math.round((recipe.baseServings || 1) * multiplier * 10) / 10;

    // Считаем общие калории
    const adjustedCalories = recipe.totalCalories ? Math.round(recipe.totalCalories * multiplier) : null;

    // Статичные калории на 1 порцию
    const caloriesPerServing =  (recipe.totalCalories && recipe.baseServings)
                            ? Math.round(recipe.totalCalories / recipe.baseServings)
                            : null;

    // Функция умного форматирования (г -> кг, мл -> л)
    const formatAmount = (amount: number, unitLabel: string | undefined) => {
        if (!unitLabel) return Number(amount.toFixed(1)).toString();
        const lowerUnit = unitLabel.toLowerCase();

        if (lowerUnit === 'г' || lowerUnit === 'грамм') {
            return amount >= 1000 ? `${(amount / 1000).toFixed(2)} кг` : `${Math.round(amount)} г`;
        }
        if (lowerUnit === 'мл' || lowerUnit === 'миллилитров') {
            return amount >= 1000 ? `${(amount / 1000).toFixed(2)} л` : `${Math.round(amount)} мл`;
        }
        if (lowerUnit === 'шт' || lowerUnit === 'штук' || lowerUnit === 'штуки') {
            return `${Math.round(amount)} шт`;
        }
        return `${Number(amount.toFixed(1))} ${unitLabel}`;
    }

    // Функция для получения строки с новым количеством
    const getAdjustedAmount = (amountStr: string | undefined, unitLabel: string | undefined) => {
        if (!amountStr) return "";
        const parsed = parseFloat(amountStr.replace(',', '.'));
        if(!isNaN(parsed)) {
            const  currentAmount = parsed * multiplier;
            return formatAmount(currentAmount, unitLabel);      // Используем умное форматирование
        }
        return amountStr;       // Если это "по вкусу", оставляем текст
    }

    // Проверка, является ли значение ингредиента числом (чтобы показывать стрелочки)
    const isNumeric = (str?: string) => str ? !isNaN(parseFloat(str.replace(',', '.'))) : false;

    // Обработчики кнопок порций
    const handleAddServing = () => {
        const nextServings = Math.floor(currentServings) + 1;
        setMiltiplier(nextServings / (recipe.baseServings || 1) );
    };

    const handleRemoveServings = () => {
        const prevServings = Math.max(1, Math.ceil(currentServings) - 1 );
        setMiltiplier(prevServings / (recipe.baseServings || 1 ));
    }

    // // Функция для умного умножения количества ингредиента
    // const getAdjustedAmount = (amountStr: string | null) => {
    //     if (!amountStr) return "";
    //     // Пробуем превратить строку (например "1.5" или "1,5") в число
    //     const parsed = parseFloat(amountStr.replace(',', '.'));
    //     if (!isNaN(parsed)) {
    //         // Если это число, умножаем и убираем лишние нули (toFixed(1) -> Number)
    //         return Number((parsed * multiplier).toFixed(1)).toString();
    //     }
    //     return amountStr;       // Если это текст ("по вкусу"), возвращаем как есть
    // }

    // --- ФУНКЦИИ МОДЕРАЦИИ ---
    const handleApprove = async () => {
        if (!id) return;
        try {
            await recipeApi.approveRecipe(Number(id));
            alert("Рецепт успешно опубликован!");
            navigate('/moderator');
        } catch (e) {
            console.error("Ошибка при публикации", e);
            alert("Не удалось опубликовать рецепт");
        }
    };

    const handleReject = async () => {
        if (!id) return;
        try {
            await recipeApi.rejectRecipe(Number(id));
            alert('Рецепт отклонен и возвращен автору');
            navigate('/moderator');
        } catch (e) {
            console.error('Ошибка при отклонении', e);
            alert("Не удалось отклонить рецепт");
        }
    };

    return  (
        <div className={style.mainContainer}>
            <div className={style.headerRow}>
                {/* Кнопка "Назад" */}
                <button
                    onClick={() => navigate(-1)}
                    className={style.btnBack}
                    >
                        <ArrowLeft size={20} /> Вернуться назад
                </button>

                <div className={style.info} >
                    <span className={style.infoSpan}><User size={18} />{recipe.author.username}</span>
                    <span className={style.infoSpan}><Clock size={18} />{recipe.createdAt}</span>
                    {adjustedCalories && (
                        // <span className={style.infoSpan}><Flame size={18} color='#D2787A'/>{recipe.totalCalories}</span>
                        <span className={style.infoSpan}><Flame size={18} color='#D2787A'/>{adjustedCalories} ккал</span>
                    )}
                </div>
            </div>


            {/* ПАНЕЛЬ МОДЕРАТОРА (Показываем только модераторам для рецептов PENDING) */}
            {isModeratorRole && isModeratorDetail && recipe.status === 'PENDING' && (
                <div className={style.moderatorPanel}>
                    <h3 className={style.moderatorTitle}>Ожидает проверки модератором</h3>
                    <div className={style.moderatorActions}>
                        <button onClick={handleReject} className={style.btnReject}>
                            <X size={20} /> Отклонить
                        </button>
                        <button onClick={handleApprove} className={style.btnApprove}>
                            <Check size={20} /> Опубликовать
                        </button>
                    </div>
                </div>
            )}

            <div className={style.blockMainColumns}>

                <div className={style.divLefMainColumn}>
                    {/* Изображение с анимацией */}
                    <img
                        src={recipe.image || 'https://via.placeholder.com/800x400?text=Нет+фото'}
                        alt={recipe.name}
                        // className={style.img}
                        className={style.recipeImage}
                    />

                    {/*    Категория */}
                    {recipe.categoryValues && (
                        <div className={style.categorySection}>
                            <h4 className={style.categoryTitle}>Категории:</h4>
                            {Object.entries(recipe.categoryValues).map(([key, value]) => (
                                <div key={key} className={style.categoryItem}>
                                    <span className={style.categoryKey}>{key}:</span>
                                    <span className={style.categoryValue}> {value.categoryValue}  {/* Предполагаем, что у CategoryValueDto есть поле `value` */}</span>
                                </div>

                            ))}
                        </div>
                    )}

                {/*   Время приготовления    */}
                    {recipe?.cookingTimeMinutes && (
                        <span className={style.cookingTimeSector}>
                            <ClockCheck size={25} color='#123c69' />
                            {formatCookingTime(recipe.cookingTimeMinutes)}
                        </span>
                    )}

                </div>


                <div className={style.divRightMainColumn}>

                    {/* Заголовок + Сердечко (если авторизован) */}
                    <div className={style.titleRow}>
                        <h1 className={style.title}>{recipe.name}</h1>
                        {isAuthenticated && !isModeratorRole && isModeratorDetail && (
                            <button className={style.heartBtn} onClick={toggleFavorite}>
                                <Heart
                                    size={32}
                                    // color={isFavorite ? 'red' : '#ccc'}
                                    color={'red'}
                                    fill={isFavorite ? 'red' : 'none'}
                                />
                            </button>
                        )}
                    </div>

                    {/* Описание */}
                    {recipe.description && (
                        <p className={style.description} >
                            {recipe.description}
                        </p>
                    )}



                    {/* Левая колонка: Ингредиенты */}
                    <div className={style.divLeftColumn}>
                        <h3 className={style.h3Column}>Ингредиенты</h3>

                        {/* Статичные калории на 1 порцию */}
                        {caloriesPerServing && (
                            <div className={style.caloriesPerServingBlock}>
                                ≈ калорийность 1 порции:
                                <span className= {style.caloriesPerServing}>{caloriesPerServing} ккал</span>
                            </div>
                        )}

                        {/* ИНТЕРАКТИВНЫЙ СЧЕТЧИК ПОРЦИЙ */}
                        <div className={style.servingControl}>
                            <span> Порции:</span>
                            <button
                                className={style.servingBtn}
                                onClick={handleRemoveServings}
                            > - </button>
                            <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center'}}>
                            {currentServings}
                        </span>
                            <button
                                className={style.servingBtn}
                                onClick={handleAddServing}
                            > + </button>
                        </div>

                        {/*<p className={style.totalIngredients}>Количество ингредиентов: {recipe.baseServings}</p>*/}
                        <ul className={style.ingredientsList}>
                            {recipe.ingredients.map((ing, idx) => (
                                <li key={idx} className={style.ingredient}>

                                    {/* ЛЕВАЯ ЧАСТЬ: Стрелочки (если число) + Название */}
                                    <div className={style.ingredientRowLeft}>
                                        {isNumeric(ing.amount) ? (
                                            <div className={style.ingredientControls}>
                                                <button
                                                    className={style.ingrBtn}
                                                    onClick={() => setMiltiplier(prev => Math.max(prev * 0.9, 0.5))}    //  -10%
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                                <button
                                                    className={style.ingrBtn}
                                                    onClick={() => setMiltiplier(prev => prev * 1.1)}   //  +10%
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ width: '44px' }}></div>   //  Пустое место для выравнивания
                                        )}
                                        <span>{ing.name}</span>
                                    </div>

                                    {/*<span>{ing.name}</span>*/}
                                    {/* ПРАВАЯ ЧАСТЬ: Пересчитанное количество */}
                                    <span className={style.amoutUnit}>
                                    {getAdjustedAmount(ing.amount?.toString(), ing.unit?.label)}
                                </span>
                                </li>
                            ))}
                        </ul>
                    </div>



                    {/*/!*    Категория *!/*/}
                    {/*{recipe.categoryValues && (*/}
                    {/*    <div className={style.categorySection}>*/}
                    {/*        <h4 className={style.categoryTitle}>Категории:</h4>*/}
                    {/*            {Object.entries(recipe.categoryValues).map(([key, value]) => (*/}
                    {/*                <div key={key} className={style.categoryItem}>*/}
                    {/*                    <span className={style.categoryKey}>{key}:</span>*/}
                    {/*                    <span className={style.categoryValue}> {value.categoryValue}  /!* Предполагаем, что у CategoryValueDto есть поле `value` *!/</span>*/}
                    {/*                </div>*/}

                    {/*            ))}*/}
                    {/*    </div>*/}
                    {/*)}*/}

                </div>
            </div>

            <div className={style.blockColumns}>

                {/*/!* Левая колонка: Ингредиенты *!/*/}
                {/*<div className={style.divLeftColumn}>*/}
                {/*    <h3 className={style.h3Column}>Ингредиенты</h3>*/}

                {/*    /!* Статичные калории на 1 порцию *!/*/}
                {/*    {caloriesPerServing && (*/}
                {/*        <div className={style.caloriesPerServingBlock}>*/}
                {/*            ≈ калорийность 1 порции:*/}
                {/*            <span className= {style.caloriesPerServing}>{caloriesPerServing} ккал</span>*/}
                {/*        </div>*/}
                {/*    )}*/}

                {/*    /!* ИНТЕРАКТИВНЫЙ СЧЕТЧИК ПОРЦИЙ *!/*/}
                {/*    <div className={style.servingControl}>*/}
                {/*        <span> Порции:</span>*/}
                {/*        <button*/}
                {/*            className={style.servingBtn}*/}
                {/*            onClick={handleRemoveServings}*/}
                {/*        > - </button>*/}
                {/*        <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center'}}>*/}
                {/*            {currentServings}*/}
                {/*        </span>*/}
                {/*        <button*/}
                {/*            className={style.servingBtn}*/}
                {/*            onClick={handleAddServing}*/}
                {/*        > + </button>*/}
                {/*    </div>*/}

                {/*    /!*<p className={style.totalIngredients}>Количество ингредиентов: {recipe.baseServings}</p>*!/*/}
                {/*    <ul className={style.ingredientsList}>*/}
                {/*        {recipe.ingredients.map((ing, idx) => (*/}
                {/*            <li key={idx} className={style.ingredient}>*/}

                {/*                /!* ЛЕВАЯ ЧАСТЬ: Стрелочки (если число) + Название *!/*/}
                {/*                <div className={style.ingredientRowLeft}>*/}
                {/*                    {isNumeric(ing.amount) ? (*/}
                {/*                        <div className={style.ingredientControls}>*/}
                {/*                            <button*/}
                {/*                                className={style.ingrBtn}*/}
                {/*                                onClick={() => setMiltiplier(prev => Math.max(prev * 0.9, 0.5))}    //  -10%*/}
                {/*                            >*/}
                {/*                                <ChevronDown size={14} />*/}
                {/*                            </button>*/}
                {/*                            <button*/}
                {/*                                className={style.ingrBtn}*/}
                {/*                                onClick={() => setMiltiplier(prev => prev * 1.1)}   //  +10%*/}
                {/*                            >*/}
                {/*                                <ChevronUp size={14} />*/}
                {/*                            </button>*/}
                {/*                        </div>*/}
                {/*                    ) : (*/}
                {/*                        <div style={{ width: '44px' }}></div>   //  Пустое место для выравнивания*/}
                {/*                    )}*/}
                {/*                    <span>{ing.name}</span>*/}
                {/*                </div>*/}

                {/*                /!*<span>{ing.name}</span>*!/*/}
                {/*                /!* ПРАВАЯ ЧАСТЬ: Пересчитанное количество *!/*/}
                {/*                <span className={style.amoutUnit}>*/}
                {/*                    {getAdjustedAmount(ing.amount?.toString(), ing.unit?.label)}*/}
                {/*                </span>*/}
                {/*            </li>*/}
                {/*        ))}*/}
                {/*    </ul>*/}
                {/*</div>*/}

                {/* Правая колонка: Шаги приготовления */}
                <div className={style.divRightColumn}>
                    <h3 className={style.h3Column}>Как готовить</h3>
                    {recipe.steps.map((step, idx) => (
                        <div key={idx} className={style.stepsList}>
                            <span className={style.stepNumber}>
                                {idx + 1}
                            </span>
                            <span
                                className={style.step}>
                                {step}
                            </span>
                        </div>
                    ))}
                </div>

            </div>

        </div>
    )
};

export default RecipeDetails;