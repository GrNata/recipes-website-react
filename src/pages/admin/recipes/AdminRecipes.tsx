import  { useState, useEffect} from "react";
import { adminApi } from "../../../api/admin";
import { toast } from "react-hot-toast";
import {Trash2, Edit, Filter, ChevronUp, ChevronDown, Eye, EyeOff, CookingPot} from "lucide-react";
import { useNavigate } from "react-router-dom";
import style from './AdminRecipes.module.css';
import type {CategoryValueDto, RecipeDto} from "../../../types";
import { Pagination } from "../../../components/pagination/Pagination.tsx";

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

    // --- СТЕЙТЫ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ ---
    const [isFiltersOpen, setIsFilterOpen] = useState(window.innerWidth > 1024);

    const [showCols, setShowCols] = useState({
        id: window.innerWidth > 1024,
        createdAt: true,
        name: true,
        author: window.innerWidth > 1024,
        status: true,
        actions: true
    })

    // --- ПАГИНАЦИЯ ---
    const [page, setPage] = useState(0);
    const itemsPerPage = 10;

    // Сбрасываем страницу на 0, если пользователь изменил фильтры
    useEffect(() => {
        setPage(0);
    }, [searchTerm, filterStatus, startDate, endDate]);

    const toggleCol = (colName: keyof typeof showCols) => {
        setShowCols(prev => ({ ...prev, [colName]: !prev[colName]}));
    };

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
        if (filterStatus === 'DRAFT' && recipe.status !== 'DRAFT') return false;
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

    // 🔥 ВЫЧИСЛЯЕМ ПАГИНАЦИЮ ДЛЯ ОТФИЛЬТРОВАННЫХ РЕЦЕПТОВ
    const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
    const paginatedRecipes = filteredRecipes.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    if (loading) return (
        // <div style={{textAlign: 'center', marginTop: '50px', fontSize: '1.2rem', color: '#123C69'}}>
        <div className={style.emptyText}>⏳ Загрузка рецептов...</div>
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
            <h2 className={style.pageTitle}>
                <CookingPot size={28} color="var(--heading-color)" />
                Управление рецептами
            </h2>

            {/* ПАНЕЛЬ ФИЛЬТРОВ (Аккордеон) */}
            <div className={style.filterAccordionHeader} onClick={() => setIsFilterOpen(!isFiltersOpen)}>
                {/*<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>*/}
                <div className={style.accordionTitleWrapper}>
                    {/*<Filter size={20} color='#123C69' />*/}
                    <Filter size={20} color='var(--heading-color)' />
                    <span>Фильтры и поиск</span>
                </div>
                {/*{isFiltersOpen ? <ChevronUp size={24} color='#123C69' /> : <ChevronDown size={24} color='#123C69' /> }*/}
                {isFiltersOpen ? <ChevronUp size={24} color='var(--heading-color)' /> : <ChevronDown size={24} color='var(--heading-color)' /> }
            </div>

            {/* ПАНЕЛЬ ФИЛЬТРОВ */}
            {isFiltersOpen && (
                // <div className={style.filterPanel}>
                <div className={style.filtersRow}>

                    {/* Поиск */}
                    {/*<div className={style.searchWrapper}>*/}
                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Поиск:</label>
                        <div className={style.searchWrapper}>
                            {/*<Search className={style.searchIcon} size={20} />*/}
                            <input
                                type="text"
                                placeholder="Название, ID, автор, категория..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={style.searchInput}
                            />
                        </div>
                    </div>

                    {/* Статус */}
                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Статус:</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            // className={style.statusSelect}
                            className={style.filterSelect}
                        >
                            <option value="ALL">Все рецепты</option>
                            <option value="PENDING">Ожидают модерации</option>
                            <option value="DELETED_USER">От удаленных пользователей</option>
                            <option value="REJECTED">Отклоненные</option>
                            <option value="APPROVED">Опубликованные</option>
                            <option value="DRAFT">Черновики</option>
                        </select>
                    </div>

                    {/* Даты */}
                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Дата с:</label>
                        {/*<Calendar size={18} className={style.searchIcon} />*/}
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                title="Начальная дата"
                                // className={style.dateInput}
                                className={style.filterInput}
                            />
                    </div>
                    {/*<span className={style.searchIcon}>—</span>*/}
                    <div className={style.filterGroup}>
                        <label className={style.filterLabel}>Дата по:</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            title="Конечная дата"
                            // className={style.dateInput}
                            className={style.filterInput}
                        />
                    </div>
                    {/*{(startDate || endDate) && (*/}
                    {(startDate || endDate || searchTerm || filterStatus !== 'ALL') && (
                        <button
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setSearchTerm('');
                                setFilterStatus('ALL');
                            }}
                            className={style.btnReset}
                            title="Сбросить фильтры"
                        >
                                Сбросить
                        </button>
                    )}


                    {/* Кнопка "Показать результаты" видна только на мобилках */}
                    <button
                        className={style.btnApplyMobile}
                        onClick={() => setIsFilterOpen(false)}
                    >
                        Показать результаты
                    </button>
                </div>
            )}

            <div className={style.infoText}>
                Найдено рецептов: <b>{filteredRecipes.length}</b>
            </div>


            {/* 🔥 УПРАВЛЕНИЕ КОЛОНКАМИ */}
            <div className={style.columnTogglesBlock}>
                <span className={style.toggleTitle}>Колонки:</span>
                <div className={style.toggleChips}>
                    <button className={`${style.chip} ${showCols.id ? style.chipActive : ''}`} onClick={() => toggleCol('id')}>
                        {showCols.id ? <Eye size={16}/> : <EyeOff size={16}/>} ID
                    </button>
                    <button className={`${style.chip} ${showCols.createdAt ? style.chipActive : ''}`} onClick={() => toggleCol('createdAt')}>
                        {showCols.createdAt ? <Eye size={16}/> : <EyeOff size={16}/>} Дата
                    </button>
                    <button className={`${style.chip} ${showCols.name ? style.chipActive : ''}`} onClick={() => toggleCol('name')}>
                        {showCols.name ? <Eye size={16}/> : <EyeOff size={16}/>} Название
                    </button>
                    <button className={`${style.chip} ${showCols.author ? style.chipActive : ''}`} onClick={() => toggleCol('author')}>
                        {showCols.author ? <Eye size={16}/> : <EyeOff size={16}/>} Автор
                    </button>
                    <button className={`${style.chip} ${showCols.status ? style.chipActive : ''}`} onClick={() => toggleCol('status')}>
                        {showCols.status ? <Eye size={16}/> : <EyeOff size={16}/>} Статус
                    </button>
                    <button className={`${style.chip} ${showCols.actions ? style.chipActive : ''}`} onClick={() => toggleCol('actions')}>
                        {showCols.actions ? <Eye size={16}/> : <EyeOff size={16}/>} Действия
                    </button>
                </div>
            </div>

            {/* 🔥 ВЕРХНЯЯ ПАГИНАЦИЯ (только для мобильных) */}
            <div className={style.mobileOnlyPagination}>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

            {/* ТАБЛИЦА РЕЦЕПТОВ */}
            <div className={style.tableWrapper}>
                <table className={style.table}>
                    <thead>
                        <tr>
                            {showCols.id && <th style={{ width: '60px' }}>ID</th>}
                            {/*{showCols.createdAt && <th className={style.colDate}>Дата создания</th>}*/}
                            {showCols.createdAt && <th className={style.colName}>Дата создания</th>}
                            {showCols.name && <th className={style.colName}>Название</th>}
                            {showCols.author && <th className={style.colName}>Автор</th>}
                            {showCols.status && <th className={style.colName}>Статус</th>}
                            {/*{showCols.actions && <th style={{ textAlign: 'center', width: '120px' }}>Действия</th>}*/}
                            {showCols.actions && <th className={style.colName} style={{ textAlign: 'center', width: '120px' }}>Действия</th>}
                        </tr>
                    </thead>
                    <tbody>

                    {/* 🔥 ИСПОЛЬЗУЕМ paginatedRecipes ВМЕСТО filteredRecipes */}
                    {paginatedRecipes.map((recipe) => (
                        <tr key={recipe.id}>
                            {/* ... (ваш код ячеек) ... */}
                        </tr>
                    ))}

                    {filteredRecipes.map((recipe) => (
                        <tr key={recipe.id}>
                            {showCols.id && <td className={style.dateCell}>{recipe.id}</td>}
                            {showCols.createdAt && <td className={style.dateCell}>{recipe.createdAt}</td>}
                            {showCols.name && <td className={style.recipeName}>{recipe.name}</td>}

                            {showCols.author && (
                                <td className={recipe.author.id === 0 ? style.authorDeleted : '-'}>
                                    {recipe.author.username}
                                    {recipe.author.id === 0 && <span className={style.authorDeletedLabel}>(Удален)</span>}
                                </td>
                            )}

                            {showCols.status && (
                                <td>
                                    <span className={`${style.statusBadge} ${getStatusClass(recipe.status)}`}>
                                        {recipe.status}
                                    </span>
                                </td>
                            )}

                            {showCols.actions && (
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
                            )}
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
                {!Object.values(showCols).some(Boolean) && (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                        Все колонки скрыты. Включите хотя бы одну. 👀
                    </div>
                )}

                {/* 🔥 НИЖНЯЯ ПАГИНАЦИЯ */}
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

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