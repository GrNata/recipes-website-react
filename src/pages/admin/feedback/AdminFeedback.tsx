import React, {useState, useEffect, useCallback} from "react";
import { toast } from "react-hot-toast";
import {MessageSquare, Search, FilterX, ChevronUp, ChevronDown, Eye, EyeOff, Filter} from "lucide-react";
import { feedbackApi } from "../../../api/feedback";
import type { FeedbackResponse, FeedbackStatus, FeedbackTopic } from "../../../types";
import style from './AdminFeeback.module.css';
import {Pagination} from "../../../components/pagination/Pagination.tsx";


// Словари для красивого перевода на русский
const topicTranslations: Record<FeedbackTopic, string> = {
    INGREDIENT: 'Ингредиент',
    CATEGORY: 'Категория',
    BUG: 'Ошибка',
    IDEA: 'Идея',
    COMPLAINT: 'Жалоба',
    OTHER: 'Другое'
};

const statusTranslations: Record<FeedbackStatus, string> = {
    NEW: 'Новое',
    IN_PROGRESS: 'В работе',
    RESOLVED: 'Решено',
    REJECTED: 'Отклонено'
};

const AdminFeedback: React.FC = () => {
    const [tickets, setTickets] = useState<FeedbackResponse[]>([]);
    const [loading, setLoading] = useState(true);

//     Пагинация
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Стейт для фильтров
    const [filters, setFilters] = useState({
        search: '',
        topic: '',
        status: '',
        dateFrom: '',
        dateTo: ''
    });

    // --- СТЕЙТЫ ДЛЯ МОБИЛЬНОЙ ВЕРСИИ ---
    const [isFiltersOpen, setIsFiltersOpen] = useState(window.innerWidth > 1024);

    const [showCols, setShowCols] = useState({
        id: window.innerWidth > 1024,
        createdAt: true,
        email: window.innerWidth > 1024,
        topic: true,
        message: window.innerWidth > 1024,
        status: window.innerWidth > 1024
    });

    const toggleCols = (colName: keyof typeof showCols) => {
        setShowCols(prev => ({ ...prev, [colName]: !prev[colName]}));
    };

    // Оборачиваем в useCallback, чтобы не было бесконечных рендеров в useEffect
    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            // const data = await feedbackApi.getAllTickets(currentPage, 10);
            const data = await feedbackApi.getPagedFeedback(page, 10, filters);
            setTickets(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (e) {
            console.error("Ошибка загрузки обращений ", e);
            toast.error("Ошибка загрузки обращений");
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    // Загрузка данных с задержкой (debounce) для плавного поиска
    useEffect(() => {
        const timer = setTimeout(() => {
            // @ts-ignore
            loadTickets(page);
        }, 400);        // Ждем 400мс после последнего ввода перед отправкой запроса
        return () => clearTimeout(timer);
    }, [loadTickets]);

    // Обработчик изменения фильтров
    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value}));
        setPage(0);     // Обязательно сбрасываем на первую страницу при любом поиске!
    };

    // Сброс всех фильтров
    const handleResetFilters = () => {
        setFilters({ search: '', topic: '', status: '', dateFrom: '', dateTo: ''});
        setPage(0);
    };

//     Смена статуса
    const handleStatusChange = async (id: number, newStatus: FeedbackStatus) => {
        try {
            await feedbackApi.updateStatus(id, newStatus);
            toast.success('Статус успешно обновлен!');
        //     Обновляем локальный стейтб чтоб не делать лишний запрос к БД
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus} : t));
        } catch (e) {
            console.error('Не удалось обновить статус ', e);
            toast.error('Не удалось обновить статус');
        }
    };

//     Цвета для бейджиков статуса
    const getStatusColor = (status: FeedbackStatus) => {
        switch (status) {
            case 'NEW': return '#BF3030'; // Красный (требует внимания)
            case 'IN_PROGRESS': return '#C39243'; // Желтый
            case 'RESOLVED': return '#74AF3C'; // Зеленый
            case 'REJECTED': return '#848484'; // Серый
            default: return '#123C69';
        }
    };

    if (loading && tickets.length === 0) {
        return <div style={{ textAlign: 'center', marginTop: '50px'}}>⏳  Загрузка обращений...</div>
    }

    return (
        <div className={style.container}>
            <div className={style.headerRow}>
                <h1 className={style.title}>
                    <MessageSquare size={28 }/> Обращения пользователей
                </h1>
                <span className={style.totalCount}>Всего: {totalElements}</span>
            </div>

            {/* ПАНЕЛЬ ФИЛЬТРОВ (Аккордеон) */}
            <div className={style.filterAccordionHeader} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Filter size={20} color="#123C69" />
                    <span>Фильтры и поиск</span>
                </div>
                {isFiltersOpen ? <ChevronUp size={24} color="#123C69" /> : <ChevronDown size={24} color="#123C69" />}
            </div>

            {/* ПАНЕЛЬ ФИЛЬТРОВ */}
            {isFiltersOpen && (
                <div className={style.filtersBlock}>
                    <div className={style.filterSearchInput}>
                        <Search size={18} color='#666'/>
                        <input
                            placeholder='Поиск по Email или ID...'
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                    <select
                        value={filters.topic}
                        onChange={(e) => handleFilterChange('topic', e.target.value)}
                        className={style.filterSelect}
                    >
                        <option value="">Все темы</option>
                        {Object.entries(topicTranslations).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className={style.filterSelect}
                    >
                        <option value="">Все статусы</option>
                        {Object.entries(statusTranslations).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>

                    <div className={style.filterDateGroup}>
                        <label >С:</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        />
                        <label>По:</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleResetFilters}
                        title="Сбросить фильтры"
                        className={style.btnReset}
                    >
                        <FilterX size={18} /> Сбросить
                    </button>

                    {/* Кнопка "Показать результаты" видна только на мобилках */}
                    <button
                        className={style.btnApplyMobile}
                        onClick={() => setIsFiltersOpen(false)}
                    >
                        Показать результаты
                    </button>

                </div>

            )}

            {/* 🔥 УПРАВЛЕНИЕ КОЛОНКАМИ */}
            <div className={style.columnTogglesBlock}>
                <span className={style.toggleTitle}>Колонки:</span>
                <div className={style.toggleChips}>
                    <button className={`${style.chip} ${showCols.id ? style.chipActive : ''}`} onClick={() => toggleCols('id')}>
                        {showCols.id ? <Eye size={16}/> : <EyeOff size={16}/>} ID
                    </button>
                    <button className={`${style.chip} ${showCols.createdAt ? style.chipActive : ''}`} onClick={() => toggleCols('createdAt')}>
                        {showCols.createdAt ? <Eye size={16}/> : <EyeOff size={16}/>} Дата
                    </button>
                    <button className={`${style.chip} ${showCols.email ? style.chipActive : ''}`} onClick={() => toggleCols('email')}>
                        {showCols.email ? <Eye size={16}/> : <EyeOff size={16}/>} Email
                    </button>
                    <button className={`${style.chip} ${showCols.topic ? style.chipActive : ''}`} onClick={() => toggleCols('topic')}>
                        {showCols.topic ? <Eye size={16}/> : <EyeOff size={16}/>} Тема
                    </button>
                    <button className={`${style.chip} ${showCols.message ? style.chipActive : ''}`} onClick={() => toggleCols('message')}>
                        {showCols.message ? <Eye size={16}/> : <EyeOff size={16}/>} Сообщение
                    </button>
                    <button className={`${style.chip} ${showCols.status ? style.chipActive : ''}`} onClick={() => toggleCols('status')}>
                        {showCols.status ? <Eye size={16}/> : <EyeOff size={16}/>} Статус
                    </button>
                </div>
            </div>

            {loading && tickets.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>⏳ Загрузка обращений...</div>
            ) : (

            <div className={style.tableWrapper}>
                <table className={style.table}>
                    <thead>
                        <tr>
                            {showCols.id && <th>ID</th>}
                            {showCols.createdAt && <th>Дата</th>}
                            {showCols.email && <th>Email</th>}
                            {showCols.topic && <th>Тема</th>}
                            {showCols.message && <th>Сообщение</th>}
                            {showCols.status && <th>Статус</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center'}}>
                                    📝  Нет обращений
                                </td>
                            </tr>
                        ) : (
                            tickets.map(ticket => (
                                <tr
                                    key={ticket.id}
                                    className={ticket.status === 'NEW' ? style.newTicketRow : '' }
                                >
                                    {showCols.id && <td>#{ticket.id}</td>}
                                    {showCols.createdAt && <td>{ticket.createdAt}</td>}
                                    {showCols.email && (
                                        <td>
                                        <a href={`{mailto:${ticket.email}`} className={style.emailLink} ></a>
                                        {ticket.email}
                                    </td>
                                    )}
                                    {showCols.topic && (
                                        <td>
                                        <span className={style.topicBadge}>{topicTranslations[ticket.topic]}</span>
                                    </td>
                                    )}
                                    {showCols.message && <td className={style.messageCell}>{ticket.message}</td>}
                                    {showCols.status && (
                                        <td>
                                            <select
                                                className={style.statusSelect}
                                                style={{ backgroundColor: getStatusColor(ticket.status), color: 'white'}}
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket.id, e.target.value as FeedbackStatus)}
                                            >
                                                {Object.entries(statusTranslations).map(([key, value]) => (
                                                    <option
                                                        key={key}
                                                        value={key}
                                                        style={{backgroundColor: 'white', color: 'black'}}
                                                    >
                                                        {value}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>


                {/* Подсказка если отключены все колонки */}
                {!Object.values(showCols).some(Boolean) && (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                        Все колонки скрыты. Включите хотя бы одну. 👀
                    </div>
                )}

            </div>
            )}

            {/* ПАГИНАЦИЯ */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

        </div>
    )
};

export default AdminFeedback;