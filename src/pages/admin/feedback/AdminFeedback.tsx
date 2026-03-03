import React, {useState, useEffect, useCallback} from "react";
import { toast } from "react-hot-toast";
import {MessageSquare, Search, FilterX} from "lucide-react";
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

            {/* ПАНЕЛЬ ФИЛЬТРОВ */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: ' 15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid @e5e7eb'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 250px', background: 'white', padding: '0 10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <Search size={18} color='#666'/>
                    <input
                        placeholder='Поиск по Email или ID...'
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        style={{ width: '100%', padding: '8px 0', border: 'none', outline: 'none'}}
                    />
                </div>
                <select
                    value={filters.topic}
                    onChange={(e) => handleFilterChange('topic', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: '1 1 150px' }}
                >
                    <option value="">Все темы</option>
                    {Object.entries(topicTranslations).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                    ))}
                </select>
                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: '1 1 150px' }}
                >
                    <option value="">Все статусы</option>
                    {Object.entries(statusTranslations).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                    ))}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px', color: '#555' }}>С:</label>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <label style={{ fontSize: '14px', color: '#555' }}>По:</label>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <button
                    onClick={handleResetFilters}
                    title="Сбросить фильтры"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    <FilterX size={18} /> Сбросить
                </button>

            </div>


            {loading && tickets.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>⏳ Загрузка обращений...</div>
            ) : (

            <div className={style.tableWrapper}>
                <table className={style.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Дата</th>
                            <th>Email</th>
                            <th>Тема</th>
                            <th>Сообщение</th>
                            <th>Статус</th>
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
                                    <td>#{ticket.id}</td>
                                    <td>{ticket.createdAt}</td>
                                    <td>
                                        <a href={`{mailto:${ticket.email}`} className={style.emailLink} ></a>
                                        {ticket.email}
                                    </td>
                                    <td>
                                        <span className={style.topicBadge}>{topicTranslations[ticket.topic]}</span>
                                    </td>
                                    <td className={style.messageCell}>{ticket.message}</td>
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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