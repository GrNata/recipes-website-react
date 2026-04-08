import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { recipeApi } from "../../api/recipes";
import type { RecipeDto } from "../../types";
import style from './Moderator.module.css';

const Moderator: React.FC = () => {
    const [pendingRecipes, setPendingRecipes] = useState<RecipeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();


    // Управление колонками
    const [showCols, setShowCols] = useState({
        name: true,       // Название всегда открыто
        createdAt: true,  // Дата всегда открыта
        author: window.innerWidth > 1024, // Автор прячется на мобилках
        actions: true     // Кнопки всегда открыты
    });

    const toggleCol = (colName: keyof typeof showCols) => {
        setShowCols(prev => ({ ...prev, [colName]: !prev[colName] }));
    };


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
                <>
                    {/* 🔥 УПРАВЛЕНИЕ КОЛОНКАМИ */}
                    <div className={style.columnTogglesBlock}>
                        <span className={style.toggleTitle}>Колонки:</span>
                        <div className={style.toggleChips}>
                            <button className={`${style.chip} ${showCols.name ? style.chipActive : ''}`} onClick={() => toggleCol('name')}>
                                {showCols.name ? <Eye size={16}/> : <EyeOff size={16}/>} Название
                            </button>
                            <button className={`${style.chip} ${showCols.createdAt ? style.chipActive : ''}`} onClick={() => toggleCol('createdAt')}>
                                {showCols.createdAt ? <Eye size={16}/> : <EyeOff size={16}/>} Дата
                            </button>
                            <button className={`${style.chip} ${showCols.author ? style.chipActive : ''}`} onClick={() => toggleCol('author')}>
                                {showCols.author ? <Eye size={16}/> : <EyeOff size={16}/>} Автор
                            </button>
                            <button className={`${style.chip} ${showCols.actions ? style.chipActive : ''}`} onClick={() => toggleCol('actions')}>
                                {showCols.actions ? <Eye size={16}/> : <EyeOff size={16}/>} Действия
                            </button>
                        </div>
                    </div>


                    <div className={style.tableWrapper}>
                        <table className={style.table}>
                            <thead>
                            <tr>
                                {showCols.name && <th style={{ width: '40%' }}>Название</th>}
                                {showCols.createdAt && <th>Дата подачи</th>}
                                {showCols.author && <th>Автор</th>}
                                {showCols.actions && <th style={{ textAlign: 'center' }}>Действия</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {pendingRecipes.map(recipe => (
                                <tr
                                    key={recipe.id}
                                    onClick={() => navigate(`/recipe/${recipe.id}?isModeratorDetail=true`)}
                                    className={style.clickableRow}
                                >
                                    {showCols.name && <td style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{recipe.name}</td>}
                                    {showCols.createdAt && <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{recipe.createdAt}</td>}
                                    {showCols.author && <td>{recipe.author.username}</td>}

                                    {showCols.actions && (
                                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            <div className={style.btnSector}>
                                                <button onClick={(e) => handleApprove(e, recipe.id)} className={style.btnApprove} title="Одобрить">
                                                    <Check size={20} />
                                                </button>
                                                <button onClick={(e) => handleReject(e, recipe.id)} className={style.btnReject} title="Отклонить">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {!Object.values(showCols).some(Boolean) && (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Все колонки скрыты. Включите хотя бы одну. 👀
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Moderator;