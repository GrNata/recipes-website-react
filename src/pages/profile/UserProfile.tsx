import React, { useState, useEffect } from "react";
import { apiClient } from "../../api/axios.ts";
import { useAuth } from "../../context/AuthContext";
import  { toast } from "react-hot-toast";
import {Lock, Save, UserPen, Link as LinkIcon} from "lucide-react";
import style from './UserProfile.module.css';
import {useNavigate} from "react-router-dom";
import {authApi} from "../../api/auth.ts";
import * as  VKID from '@vkid/sdk';

// TODO: Здесь будут импорты ваших API, например authApi.updateProfile()

const UserProfile: React.FC = () => {
    const { user, login, logout, updateUserContext } = useAuth();

    // Стейты для личных данных
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState('');

    // Стейт для пароля
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Новые стейты для удаления аккаунта
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // --- НОВЫЕ СТЕЙТЫ ДЛЯ ПРИВЯЗКИ TELEGRAM ---
    const [linkEmail, setLinkEmail] = useState('');
    const [linkPassword, setLinkPassword] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    // 🔥 СТЕЙТ ДЛЯ МОДАЛКИ TELEGRAM (Веб-версия)
    const [isTgModalOpen, setIsTgModalOpen] = useState(false);

    // Проверяем, открыто ли приложение в Телеграме
    const tg = (window as any).Telegram?.WebApp;
    const isTelegramApp = Boolean(tg && tg.initData);
    // ------------------------------------------

    const navigate = useNavigate();

    // При загрузке страницы заполняем данные текущего пользователя
    useEffect(() => {
        console.log('PROFILE START')
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUsername(user.username || '');
            setEmail(user.email || '');
        }
    }, [user, setUsername, setEmail]);

    // Загрузка виджета Telegram при открытии модалки
    useEffect(() => {
        if (isTgModalOpen) {
            // Глобальная функция, которую вызовет Telegram после успешного логина
            (window as any).onTelegramAuth = async (telegramUser: any) => {
                try {
                    // Отправляем данные из виджета на наш бэкенд
                    const response = await apiClient.post('/auth/link-tg-web', telegramUser);
                    toast.success('Telegram успешно привязан! 🎉');
                    setIsTgModalOpen(false); // Закрываем модалку

                    // Обновляем данные пользователя на экране
                    if (updateUserContext && response.data) {
                        updateUserContext(response.data);
                    }
                } catch (error: any) {
                    const errorMsg = error.response?.data?.error || 'Ошибка при привязке Telegram';
                    toast.error(errorMsg);
                    console.error(error);
                }
            };

            // Вставляем скрипт официального виджета
            const container = document.getElementById('telegram-widget-container');
            if (container && !container.hasChildNodes()) {
                const script = document.createElement('script');
                script.src = "https://telegram.org/js/telegram-widget.js?22";
                // ВАЖНО: Имя бота мы берем из вашего application.yml
                script.setAttribute("data-telegram-login", "GrNataRecipes_bot");
                script.setAttribute("data-size", "large");
                script.setAttribute("data-onauth", "onTelegramAuth(user)");
                script.setAttribute("data-request-access", "write");
                container.appendChild(script);
            }
        }
    }, [isTgModalOpen, updateUserContext]);

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

    // --- ФУНКЦИЯ ПРИВЯЗКИ АККАУНТА (TELEGRAM) (Для Mini App) ---
    const handleLinkAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isTelegramApp) return;

        setIsLinking(true);
        try {
            const response = await apiClient.post('/auth/link-telegram', {
                email: linkEmail,
                password: linkPassword,
                initData: tg.initData
            });

            // Если успех — бэкенд пришлет новые токены старого аккаунта.
            // "Логиним" пользователя заново, чтобы обновить данные на экране!
            login(response.data);
            toast.success('Аккаунты успешно объединены! 🎉', { icon: '🔗' });

            // Очищаем форму
            setLinkEmail('');
            setLinkPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка при привязке аккаунта ❌');
            console.error(error);
        } finally {
            setIsLinking(false);
        }
    };
    // ---------------------------------

    // // 🔥 ФУНКЦИЯ ПРИВЯЗКИ ВКОНТАКТЕ (Для обычной веб-версии) 🔥
    const handleVkLink = () => {
        VKID.Config.init({
            app: 54531497,
            // ВАЖНО: Указываем НОВЫЙ адрес для перехватчика привязки!
            redirectUrl: 'https://cooking-in-home.ru/profile/vk-link',
            responseMode: VKID.ConfigResponseMode.Redirect,
        });
        VKID.Auth.login();
    };
    // -------------------------------

    // 🔥 ФУНКЦИЯ ПРИВЯЗКИ TELEGRAM (Для обычной веб-версии) 🔥
    const handleTelegramLinkWeb = () => {
        // Мы добавим эту логику следующим шагом (Там нужен специальный скрипт-виджет от Telegram)
        // toast('Функция привязки Telegram для браузера скоро появится!', { icon: '⏳' });
        setIsTgModalOpen(true);
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

            {/* 🔥 НОВАЯ СЕКЦИЯ: ПРИВЯЗКА СОЦИАЛЬНЫХ СЕТЕЙ 🔥 */}
            <div className={style.card} style={{ marginTop: '40px' }}>
                <div className={style.cardHeader}>
                    <LinkIcon size={24} color={'#AC3B61'} />
                    <h2>Связанные аккаунты</h2>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5'}}>
                    Привяжите ваши социальные сети, чтобы входить на сайт в один клик.
                    Мы никогда не публикуем записи от вашего имени.
                </p>

                <div className={style.socialButtonsWrapper}>
                    <button
                        type='button'
                        className={style.vkBtn}
                        onClick={handleVkLink}
                    >
                        <span className={style.vkLogo}>VK</span> Привязать ВКонтакте
                    </button>

                    <button
                        type='button'
                        className={style.tgBtn}
                        onClick={handleTelegramLinkWeb}
                    >
                        <span className={style.tgLogo}>TG</span> Привязать Telegram
                    </button>
                </div>
            </div>

            {/* Красная кнопка в самом низу профиля */}
            <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    style={{ backgroundColor: 'var(--card-bg)', color: 'var(--accent-main)', border: '1px solid var(--accent-main)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ⚠️ Удалить мой аккаунт навсегда
                </button>
            </div>


            {/* БЛОК ПРИВЯЗКИ АККАУНТА (Показываем только внутри Telegram) */}
            {isTelegramApp && (
                <div className={style.telegramLinkCard}>
                    <h3 className={style.telegramLinkTitle}>
                        {/*🔗 У вас уже есть аккаунт?*/}
                        🔗 Объединить этот аккаунт Telegram с аккаунтом на сайте?
                    </h3>

                    {/* 🔥 НОВОЕ: ПРЕДУПРЕЖДЕНИЕ О ДАННЫХ */}
                    <div style={{
                        backgroundColor: 'rgba(172, 59, 97, 0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #AC3B61',
                        marginBottom: '15px'
                    }}>
                        <p style={{ color: '#AC3B61', fontWeight: 'bold', fontSize: '0.9rem', margin: '0 0 5px 0' }}>
                            ⚠️ Важное уведомление
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                            Если вы ранее сохраняли рецепты через этого бота, после объединения они
                            будут помечены как <b>"от удаленного пользователя"</b>.
                            Они не будут удалены с сайта, но не появятся в вашем новом списке рецептов.
                        </p>
                    </div>

                    <p className={style.telegramLinkText}>
                        {/*Если вы регистрировались на сайте ранее, введите свой email и пароль, чтобы объединить этот Telegram с вашим основным профилем.*/}
                        Введите учетные данные вашего основного аккаунта на сайте для привязки:
                    </p>

                    <form onSubmit={handleLinkAccount} className={style.linkForm}>
                        <input
                            type="email"
                            placeholder="Ваш Email от сайта"
                            value={linkEmail}
                            onChange={(e) => setLinkEmail(e.target.value)}
                            required
                            className={style.linkInput}
                        />
                        <input
                            type="password"
                            placeholder="Ваш Пароль"
                            value={linkPassword}
                            onChange={(e) => setLinkPassword(e.target.value)}
                            required
                            className={style.linkInput}
                        />
                        <button
                            type="submit"
                            disabled={isLinking || !linkEmail || !linkPassword}
                            className={style.linkBtn}
                        >
                            {isLinking ? 'Привязываем...' : 'Объединить аккаунты'}
                        </button>
                    </form>
                </div>
            )}


            {/* Всплывающее МОДАЛЬНОЕ ОКНО ЗАЩИТЫ */}
            {isDeleteModalOpen && (
                <div className={style.modalOverlay}>
                    <div className={style.modalContent}>
                        <h2 style={{ color: 'var(--accent-main)' }}>Удаление аккаунта</h2>
                        <p>Это действие <b>необратимо</b>. Ваши личные данные будут удалены, а рецепты останутся на сайте без указания авторства.</p>
                        <p>Для подтверждения введите слово <b>УДАЛИТЬ</b>:</p>

                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="УДАЛИТЬ"
                            style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--input-bg)', color: 'var(--input-text)', boxSizing: 'border-box' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); }} style={{ padding: '8px 15px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text-main)' }}>
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

            {/* Всплывающее МОДАЛЬНОЕ ОКНО ПРИВЯЗКИ TELEGRAM (Веб-версия) */}
            {isTgModalOpen && (
                <div className={style.modalOverlay}>
                    <div className={style.modalContent}>
                        <h2 style={{ color: '#2AABEE', marginTop: 0 }}>Привязка Telegram</h2>

                        <div style={{ backgroundColor: 'rgba(172, 59, 97, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(172, 59, 97, 0.3)' }}>
                            <p style={{ color: '#AC3B61', fontWeight: 'bold', margin: '0 0 10px 0' }}>⚠️ Важное предупреждение</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                                Если вы ранее пользовались нашим ботом и создали временный профиль,
                                <b> он будет удален, а его рецепты станут анонимными</b>. Ваш Telegram будет навсегда привязан к текущему аккаунту на сайте.
                            </p>
                        </div>

                        <p style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-main)' }}>
                            Вы уверены, что хотите продолжить?
                        </p>

                        {/* Сюда скрипт вставит официальную круглую кнопку Telegram */}
                        <div id="telegram-widget-container" style={{ display: 'flex', justifyContent: 'center', minHeight: '40px', marginBottom: '20px' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={() => setIsTgModalOpen(false)}
                                style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--text-main)', width: '100%', fontWeight: 'bold' }}
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    )
};

export default UserProfile;