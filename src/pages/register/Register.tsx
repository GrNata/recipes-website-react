import React, { useState} from "react";
import  { authApi } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import style from './Register.module.css';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

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

            toast.success('Регистрация успешна! Теперь можете войти.');
            navigate('/login');
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Ошибка регистрации');

            } else {
                setError('Произошла непредвиденная ошибка');
            }
            // toast.error(error);
        }
    };

    return (
        <div className={style.mainContainer}>
            <form onSubmit={handleSubmit} className={style.form}>
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