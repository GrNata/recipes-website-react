import React, { useState} from "react";
import  { authApi } from "../../api/auth";
import { Link } from "react-router-dom";
import axios from "axios";
// import { toast } from "react-hot-toast";
import style from './Register.module.css';
import {Mail} from "lucide-react";

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    // const navigate = useNavigate();

    const [isRegistered, setIsRegistered] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        try {
            await authApi.register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            // toast.success('Регистрация успешна! Теперь можете войти.');
            // navigate('/login');
            setIsRegistered(true);

        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Ошибка регистрации');

            } else {
                setError('Произошла непредвиденная ошибка');
            }
            // toast.error(error);
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


    if (isRegistered) {
        return (
        //     Используем те же стили центрирования, что и в VerifyEmail
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
                    <Mail size={60} color="#123C69" style={{ margin: '0 auto', display: 'block' }} />
                    <h2 style={{ marginTop: '20px', marginBottom: '10px', fontSize: '24px', fontWeight: 600, color: '#123C69' }}>
                        Проверьте почту
                    </h2>
                    <p style={{ color: '#555555', marginBottom: '30px', lineHeight: '1.5', fontSize: '16px' }}>
                        Мы отправили ссылку для подтверждения на указанный email.
                        Пожалуйста, перейдите по ней, чтобы завершить регистрацию и войти в аккаунт.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={style.mainContainer}>

            <form onSubmit={handleSubmit} className={style.form}>
                <button
                    type="button"
                    className={style.yandexBtn}
                    onClick={handleYandexLogin}
                >
                    <span className={style.yandexLogo}>Я</span> Войти через Яндекс
                </button>

                <br/>


                <h2 className={style.h2}>Создать аккаунт</h2>
                {error && <div style={{ color: 'red', textAlign: 'center'}}>{error}</div>}

                <input
                    type='text'
                    placeholder='Имя пользователя'
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value})}
                    required
                    className={style.inputRegister}
                />
                <input
                    type='email'
                    placeholder='Email'
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value})}
                    required
                    className={style.inputRegister}
                />
                <input
                    type='password'
                    placeholder='Пароль'
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value})}
                    required
                    className={style.inputRegister}
                />
                <input
                    type='password'
                    placeholder='Подтвердите пароль'
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value})}
                    required
                    className={style.inputRegister}
                />

                <button type='submit' className={style.btn_register}>Зарегистрироваться</button>

                <Link to='/login' className={style.linkToLogin}>
                    Уже есть аккаунт? Войти
                </Link>
            </form>
        </div>
    );
};

export default Register;