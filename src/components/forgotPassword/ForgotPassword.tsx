import React, { useState} from "react";
import { Link } from "react-router-dom";
import { authApi} from "../../api/auth.ts";
import {Mail, ArrowLeft} from "lucide-react";
import { toast} from "react-hot-toast";
import style from './ForgotPassword.module.css';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error('Введите email');

        setIsLoading(true);
        try {
            await authApi.forgotPassword(email);
            setIsSent(true);
        } catch (er: any) {
            toast.error(er.response?.data?.message || 'Произошла ошибка');
            console.error('Произошла ошибка', er);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={style.pageContainer}>
            <div className={style.card}>

                {isSent ? (
                    <>
                        <Mail size={60} color='#123C69' className={style.icon} />
                        <h2 className={style.title}>Проверте почту</h2>
                        <p className={style.message}>
                            Мы отправили ссылку для восстановления пароля на <b>{email}</b>
                        </p>
                        <Link to='/login' className={style.linkHighlight}>
                            Вернуться ко входу
                        </Link>
                    </>
                ) : (
                    <>
                        <h2 className={style.title}>Восстановление пароля</h2>
                        <p className={style.message}>
                            Введите email, указанный при регистрации, и мы отправим вам ссылку для сброса.
                        </p>

                        <form onSubmit={handleSubmit} className={style.form}>
                            <input
                                type='email'
                                placeholder='ВашEmail'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={style.input}
                                required
                            />
                            <button
                                type='submit'
                                disabled={isLoading}
                                className={style.button}
                            >
                                {isLoading ? 'Отправка...' : 'Отправить ссылку'}
                            </button>
                        </form>

                        <div className={style.linkHighlight}>
                            <Link to='/login' className={style.link} >
                                <ArrowLeft size={16} /> Назад ко входу
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}