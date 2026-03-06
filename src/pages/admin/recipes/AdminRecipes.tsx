import React, { useState, useEffect} from "react";
import { adminApi } from "../../../api/admin";
import { toast } from "react-hot-toast";
import {Trash2, Edit, Search, Calendar} from "lucide-react";
import { useNavigate } from "react-router-dom";
import style from './AdminRecipes.module.css';
import type {CategoryValueDto, RecipeDto} from "../../../types";

const AdminRecipes = () => {
    // const [recipes, setRecipes] = useState<any[]>([]);
    const [recipes, setRecipes] = useState<RecipeDto[]>([]);
    const [loading, setLoading] = useState(false);

    // Стейты для фильтров
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');        // ALL, PENDING, DELETED_USER
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Модальное окно удаления
    const [deletingRecipeId, setDeletingRecipeId] = useState<number | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadRecipes();
    }, []);

    const loadRecipes = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getAllRecipes();
            setRecipes(data);
        } catch (e) {
            toast.error('Не удалось загрузить рецепты');
            console.error('Не удалось загрузить рецепты ', e);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deletingRecipeId) return;
        try {
            await adminApi.deleteRecipe(deletingRecipeId);
            toast.success('Рецепт удален');
            setRecipes(recipes.filter(r => r.id !== deletingRecipeId));
            setDeletingRecipeId(null);
        } catch (e) {
            toast.error('Ошибка при удалении рецепта');
            console.error('Ошибка при удалении рецепта ', e);
        }
    };

    // Вспомогательная функция для парсинга даты (на случай, если с бэкенда приходит 'dd.MM.yyyy')
    const parseDate = (dateStr: string) => {
        if (!dateStr) return 0;
        // Если дата в формате "25.10.2023 14:30"
        if (dateStr.includes('.')) {
            const [datePart] = dateStr.split(' ');
            const [d, m, y] = datePart.split('.');
            return new Date(`${y}-${m}-${d}`).getTime();
        }
        // Если стандартная ISO "2023-10-25T14:30..."
        return new Date(dateStr).getTime();
    };

    // УМНАЯ ФИЛЬТРАЦИЯ
    const filteredRecipes = recipes.filter(recipe => {
    //     Фильтр по выпадающему списку
        if (filterStatus === 'PENDING' && recipe.status !== 'PENDING') return false;
        if (filterStatus === 'DELETED_USER' && recipe.author.id !== 0) return false;
        if (filterStatus === 'REJECTED' && recipe.status !== 'REJECTED') return false;
        if (filterStatus === 'APPROVED' && recipe.status !== 'APPROVED') return false;
        // if (filterStatus === 'DELETED_USER' && recipe.author !== null) return false;

    //     Фильтр по строке поиска (Ищем по имени, ID, автору или категориям)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchName = recipe.name.toLowerCase().includes(term);
            const matchId = recipe.id.toString().includes(term);
            const matchAuthor = recipe.author.username.toLowerCase().includes(term);

        //     Проверяем категории (если они есть)
            const matchCategory = Object.values(recipe.categoryValues || {}).some(
                (cat: CategoryValueDto) => cat.categoryValue.toLowerCase().includes(term)
            );

            if (!matchName && !matchId && !matchAuthor && !matchCategory) return false;

        //     Фильтр по дате (С .. ПО)
            if (startDate || endDate) {
                const rDate = parseDate(recipe.createdAt);
                if (startDate && rDate < new Date(startDate).getTime()) return false;
                // Для endDate добавляем часы, чтобы включить весь выбранный день до 23:59:59
                if (endDate && rDate > new Date(endDate).setHours(23, 59, 59, 999)) return false;
            }
        }
        return true;
    });

    if (loading) return (
        <div style={{textAlign: 'center', marginTop: '50px', fontSize: '1.2rem', color: '#123C69'}}>
        ⏳ Загрузка рецептов...
        </div>
    );

    // Вспомогательная функция для выбора цвета статуса
    const getStatusClass = (status: string) => {
        switch(status) {
            case 'APPROVED': return style.statusApproved;
            case 'PENDING': return style.statusPending;
            case 'DRAFT': return style.statusDraft;
            case 'REJECTED': return style.statusRejected;
            default: return style.statusDraft;
        }
    };

    return (
        <div className={style.container}>
            <h2 className={style.pageTitle}>Управление рецептами</h2>

            {/* ПАНЕЛЬ ФИЛЬТРОВ */}
            <div className={style.filterPanel}>

                <div className={style.searchWrapper}>
                    <Search className={style.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Название, ID, автор, категория..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={style.searchInput}
                    />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={style.statusSelect}
                >
                    <option value="ALL">Показать все рецепты</option>
                    <option value="PENDING">Ожидают модерации (PENDING)</option>
                    <option value="DELETED_USER">От удаленных пользователей</option>
                    <option value="REJECTED">Отклоненные</option>
                    <option value="APPROVED">Опубликованные</option>
                </select>

                <div className={style.dateFilter}>
                    <Calendar size={20} color="#888" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        title="Начальная дата"
                        className={style.dateInput}
                    />
                    <span>—</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        title="Конечная дата"
                        className={style.dateInput}
                    />
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className={style.btnReset}>
                            Сбросить
                        </button>
                    )}
                </div>
            </div>

            <div className={style.infoText}>
                Найдено рецептов: <b>{filteredRecipes.length}</b>
            </div>

            {/* ТАБЛИЦА РЕЦЕПТОВ */}
            <div className={style.tableWrapper}>
                <table className={style.table}>
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Дата создания</th>
                        <th>Название</th>
                        <th>Автор</th>
                        <th>Статус</th>
                        <th style={{ textAlign: 'center' }}>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredRecipes.map((recipe) => (
                        <tr key={recipe.id}>
                            <td>{recipe.id}</td>
                            <td className={style.dateCell}>{recipe.createdAt}</td>
                            <td className={style.recipeName}>{recipe.name}</td>

                            <td className={recipe.author.id === 0 ? style.authorDeleted : ''}>
                                {recipe.author.username}
                                {recipe.author.id === 0 && <span className={style.authorDeletedLabel}>(Удален)</span>}
                            </td>

                            <td>
                                    <span className={`${style.statusBadge} ${getStatusClass(recipe.status)}`}>
                                        {recipe.status}
                                    </span>
                            </td>

                            <td style={{ textAlign: 'center' }}>
                                <button
                                    onClick={() => navigate(`/admin/recipes/edit/${recipe.id}`)}
                                    title="Редактировать"
                                    className={style.actionBtn}
                                >
                                    <Edit size={20} />
                                </button>
                                <button
                                    onClick={() => setDeletingRecipeId(recipe.id)}
                                    title="Удалить"
                                    className={style.deleteIconBtn}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredRecipes.length === 0 && (
                        <tr>
                            <td colSpan={6} className={style.emptyState}>
                                По вашим фильтрам рецептов не найдено 🤷‍♀️
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* МОДАЛЬНОЕ ОКНО УДАЛЕНИЯ */}
            {deletingRecipeId && (
                <div className={style.modalOverlay}>
                    <div className={style.modalContent}>
                        <h3 className={style.modalTitle}>Удалить рецепт?</h3>
                        <p>Это действие навсегда удалит рецепт из базы данных.</p>
                        <div className={style.modalButtons}>
                            <button onClick={() => setDeletingRecipeId(null)} className={style.btnCancel}>
                                Отмена
                            </button>
                            <button onClick={confirmDelete} className={style.btnConfirmDelete}>
                                Да, удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )


};

export default AdminRecipes;