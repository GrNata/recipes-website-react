import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Send, MessagesSquare, ArrowLeft } from "lucide-react";
import { feedbackApi} from "../../api/feedback.ts";
import type { FeedbackRequest, FeedbackTopic} from "../../types";
import { useAuth } from "../../context/AuthContext.tsx";
import style from './FeedbackPage.module.css';

const topicOptions: { value: FeedbackTopic; label: string}[] = [
    {value: 'IDEA', label: '💡 Предложить идею или улучшение'},
    {value: 'INGREDIENT', label: '🥦 Добавить отсутствующий ингредиент'},
    {value: 'CATEGORY', label: '📁 Предложить новую категорию'},
    {value: 'BUG', label: '🐞 Сообщить об ошибке на сайте'},
    {value: 'COMPLAINT', label: '🤬 Пожаловаться'},
    {value: 'OTHER', label: '💬 Другое'}
];

const FeedbackPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    // Если пользователь авторизован, сразу подставляем его почту (если она есть в объекте user)
    const [email, setEmail] = useState(isAuthenticated && user?.email ? user.email : '');
    const [topic, setTopic] = useState<FeedbackTopic | ''>('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handkeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!topic) {
            toast.error('Пожалуйста, выберите тему сообщения');
            return;
        }
        if (!message.trim()) {
            toast.error("Сообщеие не может быть пустым");
            return;
        }

        try {
            setIsSubmitting(true);
            const requestData: FeedbackRequest = {
                email,
                topic: topic as FeedbackTopic,
                message
            };
            await feedbackApi.createFeedback(requestData);

            toast.success('Спасибо! Ваше сообщение успешно отправлено.');
            navigate('/');      //  Уводим пользователя на главную после успеха
        } catch (e) {
            console.error('Ошибка при отправке: ', e);
            toast.error('Не удалось отправить сообщение. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={style.container}>
            <button onClick={() => navigate(-1)} className={style.btnBack}>
                <ArrowLeft size={20}/>  Вернуться назад
            </button>

            <div className={style.formCard}>
                <div className={style.header}>
                    <MessagesSquare size={32} color='#AC3B61' />
                    <h1 className={style.title}>Связь с администратором</h1>
                    <p className={style.subtitle}>
                        Не нашли нужный ингредиент? Есть идея, как сделать сайт лучше? Напишите нам!
                    </p>
                </div>

                <form onSubmit={handkeSubmit} className={style.form}>
                    <div className={style.formGroup}>
                        <label className={style.label}>Ваш Email (для ответа)</label>
                        <input
                            type='email'
                            className={style.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder='example@mail.com'
                            required
                        />
                    </div>

                    <div className={style.formGroup}>
                        <label className={style.label}>Тема обращения</label>
                        <select
                            className={style.select}
                            value={topic}
                            onChange={(e) => setTopic(e.target.value as FeedbackTopic)}
                            required
                        >
                            <option value='' disabled>-- Выберите тему --</option>
                            {topicOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={style.formGroup}>
                        <label className={style.label}>Сообщение</label>
                        <textarea
                            className={style.textarea}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Опишите вашу идею или проблему максимально подробно..."
                            rows={6}
                            required
                        />
                    </div>

                    <button
                        type='submit'
                        className={style.submitBtn}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Отправка...' : (
                            <>
                                <Send size={20} />  Отправить сообщение
                            </>
                        )}
                    </button>
                </form>
            </div>

        </div>
    );
};

export default FeedbackPage;

