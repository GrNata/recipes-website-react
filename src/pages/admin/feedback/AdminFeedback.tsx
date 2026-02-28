import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { MessageSquare } from "lucide-react";
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

    const loadTickets = async (currentPage: number) => {
        setLoading(true);
        try {
            const data = await feedbackApi.getAllTickets(currentPage, 10);
            setTickets(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (e) {
            console.error("Ошибка загрузки обращений ", e);
            toast.error("Ошибка загрузки обращений");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets(page);
    }, [page]);

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
    // if (tickets.length === 0) {
    //     return <div style={{ textAlign: 'center', marginTop: '50px'}}>📝  Нет обращений</div>
    // }

    return (
        <div className={style.container}>
            <div className={style.headerRow}>
                <h1 className={style.title}>
                    <MessageSquare size={28 }/> Обращения пользователей
                </h1>
                <span className={style.totalCount}>Всего: {totalElements}</span>
            </div>

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

            {/* ПАГИНАЦИЯ */}
            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
            {/*{totalPages > 1 && (*/}
            {/*    <div className={style.pagination}>*/}
            {/*        <button*/}
            {/*            onClick={() => setPage(p => Math.max(0, p - 1))}*/}
            {/*            disabled={page === 0}*/}
            {/*            className={style.pageBtn}*/}
            {/*        >*/}
            {/*            &laquo; Назад*/}
            {/*        </button>*/}
            {/*        <span className={style.pageInfo}>*/}
            {/*            Страница {page + 1} из {totalPages}*/}
            {/*        </span>*/}
            {/*        <button*/}
            {/*            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}*/}
            {/*            disabled={page === totalPages - 1}*/}
            {/*            className={style.pageBtn}*/}
            {/*        >*/}
            {/*            Вперед &raquo;*/}
            {/*        </button>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    )
};

export default AdminFeedback;