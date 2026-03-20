import  React,  {  useState } from "react";
import { authApi } from '../../api/auth.ts';
import { useNavigate, Link } from 'react-router-dom';
import axios from "axios";
import {useAuth} from "../../context/AuthContext.tsx";
import style from './Login.module.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 2. Инициализируйте функцию login из контекста
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
        //     Отправляем данные на API (9090)
            const response = await authApi.login({ email, password });

            // 3. ВЫЗОВИТЕ login() ФУНКЦИЮ ТУТ:
            // Это запишет данные в AuthContext и в localStorage
            login(response);
            console.log('Успешный вход! token:', response.accessToken);

        //     Если вход успешен, переходим на главную
            navigate('/');
        } catch (err) {
            // Проверяем, является ли ошибка ошибкой axios
            if (axios.isAxiosError(err)) {
            //     Теперь TS знает, что у err есть свойство response
                const message = err.response?.data?.message|| 'Ошибка при входе. Проверьте консоль.';
                setError(message);
            } else {
            //     Если это какая-то другая ошибка (например, ошибка сети или JS)
                setError('Произошла непредвиденная ошибка');
            }
            console.error('Ошибка логина:', err);
        }
    };

    // --- ФУНКЦИЯ ДЛЯ КНОПКИ ЯНДЕКСА ---
    const handleYandexLogin = () => {
        const clientId = '4fea931727cc4a508f143486d22aef33';        // Мой ClientID в яндекс
        // Берем текущий адрес сайта (будет работать и на localhost, и на боевом сервере)
        const redirectUri = window.location.origin;

        // Отправляем пользователя на страницу авторизации Яндекса
        window.location.href = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`;
    }

    return (
        // <div style={{ display: "flex", justifyContent: 'center', marginTop: '100px'}}>
        <div className={style.mainContainer}>
            <form onSubmit={handleSubmit} className={style.form}>
                <h2 className={style.h2}>Вход в систему</h2>
                {error && <div style={{ color: 'red' }}>{error}</div> }
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={style.inputLogin}
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={style.inputLogin}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                    <Link
                        to='/forgot-password'
                        style={{ color: '#AC3B61', textDecoration: 'none', fontSize: '18px', fontWeight: '800' }}
                    >
                        Забыли пароль?
                    </Link>
                </div>
                <button type="submit" className={style.btn_login}>Войти</button>

                <button
                    type='button'
                    className={style.yandexBtn}
                    onClick={handleYandexLogin}
                >
                    <span className={style.yandexLogo}>Я</span> Войти через Яндекс
                </button>

            </form>
        </div>
    );
};

export default  Login;