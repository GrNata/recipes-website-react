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
    X,ClockCheck
} from "lucide-react";
import { formatCookingTime } from "../../utils/FormatDateAndTimeForBackend";
import style from './RecipeDetails.module.css';
import {getImageUrl} from "../../utils/imageUtils.ts";
import {toast} from "react-hot-toast";
import { StarRating} from "../../components/rating/StartRatingProps";


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

    // --- НОВЫЕ СТЕЙТЫ ДЛЯ СВОРАЧИВАНИЯ БЛОКОВ ---
    // На компьютерах (> 768px) всё открыто. На телефонах Описание свернуто.
    const isModile = window.innerWidth <= 768;
    const [isDescOpen, setIsDescOpen] = useState(!isModile);
    const [isIngrOpen, setIsIngrOpen] = useState(true);
    const [isStepsOpen, setIsStepsOpen] = useState(true);

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
    const isNumeric = (str?: string | null) => str ? !isNaN(parseFloat(str.replace(',', '.'))) : false;

    // Обработчики кнопок порций
    const handleAddServing = () => {
        const nextServings = Math.floor(currentServings) + 1;
        setMiltiplier(nextServings / (recipe.baseServings || 1) );
    };

    const handleRemoveServings = () => {
        const prevServings = Math.max(1, Math.ceil(currentServings) - 1 );
        setMiltiplier(prevServings / (recipe.baseServings || 1 ));
    };


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

    const handleRatingSubmit = async (score: number) => {
        try {
            await recipeApi.rateRecipe(Number(id), score);
            toast.success('Ваша оценка учтена!');
        //     Можно обновить состояние рецепта, чтобы цифры обновились
            const updated = await recipeApi.getById(Number(id));
            setRecipe(updated);
        } catch (e) {
            console.error('Не удалось отправить оценку ', e);
            toast.error('Не удалось отправить оценку')
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
                    <div className={style.infoRate}>
                        <StarRating
                            initialRating={recipe.averageRating}
                            onRate={handleRatingSubmit}
                        />
                        <span className={style.infoSpan}>
                            <div className={style.tooltipContainer}>
                                ({recipe.averageRating.toFixed(1)} / {recipe.ratingCount} оценок(ка))
                                {/* Текст подсказки */}
                                <span className={style.tooltipText}>
                                    Поставьте свою оценку рецепту.
                                </span>
                            </div>
                        </span>
                    </div>

                    {/* 🔥 НОВЫЙ БЛОК: Группируем автора, время и калории, чтобы они красиво переносились */}
                    <div className={style.infoDetailsWrapper}>
                        <span className={style.infoSpan}><User size={18} />{recipe.author.username}</span>
                        <span className={style.infoSpan}><Clock size={18} />{recipe.createdAt}</span>
                        {adjustedCalories && (
                            // <>
                            <div className={style.infoSpan}>
                                <div className={style.tooltipContainer}>
                                    <span className={style.infoSpan}><Flame size={18} color='#D2787A'/>{adjustedCalories} ккал</span>
                                    {/* Текст подсказки */}
                                    <span className={style.tooltipText}>
                                        Расчет является приблизительным и базируется на суммарной калорийности всех ингредиентов рецепта.
                                    </span>
                                </div>
                            </div>
                            // </>
                        )}
                    </div>
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
                        src={getImageUrl(recipe.image)}
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
                        {/*{isAuthenticated && !isModeratorRole && isModeratorDetail && (*/}
                        {isAuthenticated && !isModeratorDetail && (
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

                    {/*/!* Описание *!/*/}
                    {/*{recipe.description && (*/}
                    {/*    <p className={style.description} >*/}
                    {/*        {recipe.description}*/}
                    {/*    </p>*/}
                    {/*)}*/}



                    {/* Левая колонка: Ингредиенты */}
                    {/* 🔥 БЛОК: ИНГРЕДИЕНТЫ С АККОРДЕОНОМ */}
                    <div className={style.divLeftColumn}>
                        <div className={style.accordionHeader} onClick={() => setIsIngrOpen(!isIngrOpen)}>
                            <h3 className={style.h3Column} style={{marginBottom: 0, borderBottom: 'none'}}>Ингредиенты</h3>
                            {isIngrOpen ? <ChevronUp size={24} color='#D2787A' /> : <ChevronDown size={24} color="#D2787A" />  }
                        </div>

                        {isIngrOpen && (
                            <>
                                {/* Статичные калории на 1 порцию */}
                                {caloriesPerServing && (
                                    <div className={style.caloriesPerServingBlock}>
                                        <div className={style.tooltipContainer}>
                                            ≈ калорийность 1 порции:
                                            <span className= {style.caloriesPerServing}>{caloriesPerServing} ккал</span>
                                            {/* Текст подсказки */}
                                            <span className={style.tooltipText}>
                                                Расчет является приблизительным и базируется на суммарной калорийности всех ингредиентов рецепта.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* ИНТЕРАКТИВНЫЙ СЧЕТЧИК ПОРЦИЙ */}
                                <div className={style.servingControl}>
                                    <div className={style.tooltipContainer}>
                                        <span style={{paddingRight: '20px'}}> Порции:  </span>
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

                                        {/* Текст подсказки */}
                                        <span className={style.tooltipText}>
                                                Можно увеличить или уменьшить количество порций.
                                        </span>
                                    </div>
                                </div>

                                {/*<p className={style.totalIngredients}>Количество ингредиентов: {recipe.baseServings}</p>*/}
                                <ul className={style.ingredientsList}>
                                    {recipe.ingredients?.map((ing, idx) => (
                                        <li key={idx} className={style.ingredient}>

                                            {/* ЛЕВАЯ ЧАСТЬ: Стрелочки (если число) + Название */}
                                            <div className={style.ingredientRowLeft}>
                                                {isNumeric(ing.amount) ? (
                                                    <div className={style.ingredientControls}>
                                                        <div className={style.tooltipContainer}>
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
                                                            {/* Текст подсказки */}
                                                            <span className={style.tooltipText}>
                                                                Можно увеличить или уменьшить количество ингредиента.
                                                            </span>
                                                        </div>
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
                            </>
                        )}
                    </div>
                </div>
            </div>


            {/* ----  ОПИСАНИЕ ---------*/}
            {/* 🔥 БЛОК: ОПИСАНИЕ С АККОРДЕОНОМ */}
            {recipe.description && (
                <div className={style.descriptionBlock}>
                    <div className={style.accordionHeader} onClick={() => setIsDescOpen(!isDescOpen)}>
                        <h3 className={style.h3Column} style={{marginBottom: 0, borderBottom: 'none'}}>Описание</h3>
                        {isDescOpen ? <ChevronUp size={24} color='#D2787A' /> : <ChevronDown size={24} color='#D2787A' /> }
                    </div>
                    {isDescOpen && recipe.description && (
                        <p className={style.description} >
                            {recipe.description}
                        </p>
                    )}
                </div>
            )}


            <div className={style.blockColumns}>

                {/* Правая колонка: Шаги приготовления */}
                {/* 🔥 БЛОК: ШАГИ С АККОРДЕОНОМ */}
                <div className={style.divRightColumn}>
                    <div className={style.accordionHeader} onClick={() => setIsStepsOpen(!isStepsOpen)}>
                        <h3 className={style.h3Column} style={{marginBottom: 0, borderBottom: 'none'}}>Как готовить</h3>
                        {isStepsOpen ? <ChevronUp size={24} color="#D2787A" /> : <ChevronDown size={24} color="#D2787A" />}
                    </div>
                    {/*<h3 className={style.h3Column}>Как готовить</h3>*/}
                    {isStepsOpen && recipe.steps?.map((step, idx) => (
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