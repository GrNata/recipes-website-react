import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { toast } from 'react-toastify';
import style from './ResetPassword.module.css';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!token) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2 style={{ color: '#dc3545' }}>Ошибка: Ссылка недействительна</h2>
                <p>Отсутствует токен безопасности.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) return toast.error('Пароль должен быть не менее 6 символов');
        if (password !== confirmPassword) return toast.error('Пароли не совпадают');

        setIsLoading(true);
        try {
            await authApi.resetPassword(token, password);
            toast.success('Пароль успешно изменен! Теперь вы можете войти.');
            navigate('/login'); // Перекидываем на логин после успеха
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Не удалось сбросить пароль. Ссылка устарела.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={style.pageContainer}>
            <div className={style.card}>
                <h2 className={style.title}>Придумайте новый пароль</h2>

                <form onSubmit={handleSubmit} className={style.form}>
                    <input
                        type="password"
                        placeholder="Новый пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={style.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={style.input}
                        required
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={style.button}
                    >
                        {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
                    </button>
                </form>
            </div>
        </div>
    );
};