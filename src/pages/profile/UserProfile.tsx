import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import  { toast } from "react-hot-toast";
import {Lock, Save, UserPen} from "lucide-react";
import style from './UserProfile.module.css';
import {useNavigate} from "react-router-dom";
import {authApi} from "../../api/auth.ts";

// TODO: Здесь будут импорты ваших API, например authApi.updateProfile()

const UserProfile: React.FC = () => {
    const { user, logout, updateUserContext } = useAuth();

    // Стейты для личных данных
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState('');

    // Стейт для пароля
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Новые стейты для удаления аккаунта
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const navigate = useNavigate();

    // При загрузке страницы заполняем данные текущего пользователя
    useEffect(() => {
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUsername(user.username || '');
            setEmail(user.email || '');
        }
    }, [user, setUsername, setEmail]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        // Небольшая валидация на фронтенде
        if (!username.trim() || !email.trim()) {
            toast.error('Имя и Email не могут быть пустыми');
            return;
        }

        try {
            // запрос на бэкенд
            const updatedUser = await authApi.updateProfile({ username, email });

            // Проверяем, изменился ли Email
            if (email !== user?.email) {
                // Если email другой, токены сгорели. Заставляем войти заново.
                toast.success('Email успешно изменен! Пожалуйста, войдите заново с новым email.');
                logout(); // Функция из вашего useAuth()
                navigate('/login');
            } else {
                // Если поменялось только имя
                toast.success('Имя успешно обновлено!');

                // ВАЖНО: Нам нужно обновить данные в AuthContext,
                // чтобы новое имя сразу появилось в TopBar без перезагрузки страницы!
                // (Как это сделать — см. Шаг 3 ниже)
                if (updateUserContext) {
                    updateUserContext(updatedUser);
                }
            }
            // toast.success('Личные данные успешно обновлены!');
        } catch (error) {
            toast.error('Не удалось обновить данные.');
            console.error('Не удалось обновить данные.', error)
            // Обрабатываем ошибку от Spring Boot (например, если email уже занят)
            // const errorMessage = error.response?.data?.message || 'Не удалось обновить данные';
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) {
            toast.error('Пожалуйста, заполните оба поля пароля.');
            return;
        }
        try {
            // ВРЕМЕННАЯ ЗАГЛУШКА: запрос на бэкенд
            await authApi.changePassoword({ oldPassword, newPassword });
            toast.success('Пароль успешно изменен!');
            setOldPassword('');
            setNewPassword('');
        } catch (e) {
            toast.error('Ошибка при смене пароля. Проверьте старый пароль.');
            console.error('Ошибка при смене пароля. Проверьте старый пароль. ', e);
        }
    };

    // Функция удаления аккаунта
    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'УДАЛИТЬ') {
            toast.error('Введите слово УДАЛИТЬ без ошибок');
            return;
        }
        try {
            // Здесь должен быть ваш API вызов на удаление самого себя
            await authApi.deleteMyAccount();

            toast.success('Ваш аккаунт был навсегда удален');
            logout();   //  Стираем localStorage
            navigate('/');
        } catch (e) {
            toast.error('Ошибка при удалении аккаунта');
            console.error('Ошибка при удалении аккаунта ', e);
        }
    };

    return (
        <div className={style.container}>
            <h1 className={style.pageTitle}>Личный кабинет</h1>

            <div className={style.grid}>
                {/* ЛЕВАЯ КОЛОНКА: Основные данные */}
                <div className={style.card}>
                    <div className={style.cardHeader}>
                        <UserPen size={24} color='#AC3B61' />
                        <h2>Мои данные</h2>
                    </div>
                    <form onSubmit={handleUpdateProfile}>
                        <div className={style.formGroup}>
                            <label>Имя пользователя</label>
                            <input
                                type='text'
                                className={style.input}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className={style.formGroup}>
                            <label>Email</label>
                            <input
                                type='email'
                                className={style.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button type='submit' className={style.btnSave}>
                            <Save size={18} /> Обновить данные
                        </button>
                    </form>
                </div>

                {/* ПРАВАЯ КОЛОНКА: Безопасность */}
                <div className={style.card}>
                    <div className={style.cardHeader}>
                        <Lock size={24} color='#AC3B61' />
                        <h2>Безопасность</h2>
                    </div>
                    <form onSubmit={handleChangePassword}>
                        <div className={style.formGroup}>
                            <label>Текущий пароль</label>
                            <input
                                type='password'
                                className={style.input}
                                placeholder="Введите старый пароль"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                        </div>
                        <div className={style.formGroup}>
                            <label>Новый пароль</label>
                            <input
                                type='password'
                                className={style.input}
                                placeholder="Минимум 6 символов"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <button type='submit' className={style.btnSave}>
                            <Save size={18} /> Изменить
                        </button>
                    </form>
                </div>

            </div>

            {/* Красная кнопка в самом низу профиля */}
            <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    style={{ backgroundColor: '#fff', color: '#AC3B61', border: '1px solid #AC3B61', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ⚠️ Удалить мой аккаунт навсегда
                </button>
            </div>

            {/* Всплывающее МОДАЛЬНОЕ ОКНО ЗАЩИТЫ */}
            {isDeleteModalOpen && (
                <div className={style.modalOverlay}>
                    <div className={style.modalContent}>
                        <h2 style={{ color: '#AC3B61' }}>Удаление аккаунта</h2>
                        <p>Это действие <b>необратимо</b>. Ваши личные данные будут удалены, а рецепты останутся на сайте без указания авторства.</p>
                        <p>Для подтверждения введите слово <b>УДАЛИТЬ</b>:</p>

                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="УДАЛИТЬ"
                            style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '6px' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); }} style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#BAB2B5', color: '#123C69' }}>
                                Отмена
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'УДАЛИТЬ'}
                                style={{ padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: deleteConfirmText === 'УДАЛИТЬ' ? '#AC3B61' : 'red', color: '#fff' }}
                            >
                                Я уверен, удалить аккаунт
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
};

export default UserProfile;