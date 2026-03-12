import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { homeApi } from "../../api/home.ts";
import { Star, Clock, User } from "lucide-react";
import { toast } from "react-hot-toast";
import style from './HomePage.module.css';
import type {RecipeDto, UserRatingDto} from "../../types";

export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const [randomRecipes, setRandomRecipes] = useState<RecipeDto[]>([]);
    const [topRecipes, setTopRecipes] = useState<RecipeDto[]>([]);
    const [topAuthors, setTopAuthors] = useState<UserRatingDto[]>([]);
    const [loading, setLoading] = useState(true);

    // Для слайдера случайных рецептов
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        setLoading(true);
        const loadHomeData = async () => {
            try {
                const [random, top, authors] = await Promise.all([
                    homeApi.getRandomRecipes(3),
                    homeApi.getTopRecipes(4),
                    homeApi.getTopAuthor(6)
                ]);

                setRandomRecipes(random);
                setTopRecipes(top);
                setTopAuthors(authors);

                console.log('author: ', authors)
            } catch (e) {
                console.error('Ошибка загрузки данных для главной ', e);
                toast.error('Ошибка загрузки данных для главной');
            } finally {
                setLoading(false);
            }
        }
        loadHomeData();
    }, []);

    // Простая автоматическая смена слайдов каждые 5 секунд
    useEffect(() => {
        if (randomRecipes.length > 0) {
            const  timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % randomRecipes.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [randomRecipes]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px'}}>Загружаем вкусности...</div>

    const activeRecipe = randomRecipes[currentSlide];

    return (
        <div className={style.homeContainer}>

            {/* БЛОК 1: Hero-секция со случайным рецептом */}
            {activeRecipe && (
                <section
                    className={style.heroSection}
                    onClick={() => navigate(`/recipe/${activeRecipe.id}`)}
                >
                    <div className={style.heroContent}>
                        <span className={style.heroBadge}>
                            {/*<span className={style.scrollingText}>*/}
                                Рецепт дня
                            {/*</span>*/}
                        </span>
                        <h1 className={style.heroTitle}>{activeRecipe.name}</h1>
                        <p className={style.heroDescription}>
                            {activeRecipe.description || "Попробуйте приготовить это восхитительное блюдо. Идеально подойдет для любого повода!"}
                        </p>
                        <div className={style.heroMeta}>
                            <span><Clock size={18} />{activeRecipe.cookingTimeMinutes || 30} мин</span>
                            <span><Star size={18} fill='#FFD200' color='#FFD200' />{activeRecipe.averageRating?.toFixed(1) || '0.0'}</span>
                        </div>
                        {/*<button className={style.heroButton}>Смотреть рецепт</button>*/}
                    </div>

                    <div className={style.heroImageContent}>
                        <div className={style.heroImageWrapper}>
                            {/* Вот тут наша картинка 300х300 чувствует себя идеально */}
                            <img
                                src={activeRecipe.image || '/placeholder.png'}
                                alt={activeRecipe.name}
                                className={style.heroImage}
                            />
                        </div>
                    </div>

                </section>
            )}

            {/* БЛОК 2: Лучшие рецепты (Сетка) */}
            <section className={style.section}>
                <h2 className={style.sectionTitle}>Топ рецептов</h2>
                <div className={style.recipesGrid}>
                    {topRecipes.map(recipe => (
                        <div
                            key={recipe.id}
                            className={style.recipeCard}
                            onClick={() => navigate(`/recipe/${activeRecipe.id}`)}
                        >
                            <img
                                src={recipe.image || '/placeholder.png'}
                                alt={recipe.name}
                                className={style.cardImage}
                            />
                            <div className={style.cardContent}>
                                <h3>{recipe.name}</h3>
                                <div className={style.cardFooter}>
                                    <span className={style.rating}><Star size={16} fill="#FFD200" color="#FFD200" />
                                        {recipe.averageRating?.toFixed(1)}
                                    </span>
                                    <span className={style.author}><User size={16} />{recipe.author.username || 'Аноним'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* БЛОК 3: Топ авторов (Круги) */}
            <section className={style.section}>
                <h2 className={style.sectionTitle}>Лучшие авторы</h2>
                <div className={style.authorsRow}>
                    {topAuthors.map(author => (
                        <div key={author.userId} className={style.authorCircle}>
                            <div className={style.avatarPlaceholder}>
                                {/* Берем первую букву имени */}
                                {author.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className={style.authorName}>{author.userName}</span>
                            <span className={style.authorScore}>⭐ {author.averageRating?.toFixed(1)}</span>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    )
};

export default HomePage;