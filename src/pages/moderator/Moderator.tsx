import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { recipeApi } from "../../api/recipes";
import { RecipeDto } from "../../types";
import style from './Moderator.module.css';

const Moderator: React.FC = () => {
    const [pendingRecipes, setPendingRecipes] = useState<RecipeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadPending = async () => {
        setLoading(true);
        try {
            const response = await recipeApi.getPendingPecipes();
            setPendingRecipes(response.content || response);
        } catch (e) {
            console.error("Ошибка при загрузке рецептов на проверку", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPending();
    }, []);

    const handleApprove  = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await recipeApi.approveRecipe(id);
            setPendingRecipes(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error(e)
        }
    };

    const handleReject = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await recipeApi.rejectRecipe(id);
            setPendingRecipes(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px'}}>⏳ Загрузка рецептов на проверку...</div>

    return (
        <div className={style.pageContent}>
            <h1 className={style.title}>Рецепты на проверке</h1>

            {pendingRecipes.length === 0 ? (
                <div className={style.noRecipeSector}>Нет рецептов на проверке 🎉</div>
            ) : (
                <div className={style.recipesSector}>
                    {pendingRecipes.map(recipe => (
                        <div
                        key={recipe.id}
                        onClick={() => navigate(`/recipe/${recipe.id}?isModeratorDetail=true`)}
                        className={style.rowRecipeBlock}
                        >
                            <div className={style.recipeName}>{recipe.name}</div>
                            <div className={style.recipeCreateAt}>{recipe.createdAt}</div>
                            <div className={style.recipeName}>{recipe.author.username}</div>

                            <div className={style.btnSector}>
                                <button onClick={(e) => handleApprove(e, recipe.id)} className={style.btnApprove}>
                                    <Check size={20} />
                                </button>
                                <button onClick={(e) => handleReject(e, recipe.id)} className={style.btnReject}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Moderator;