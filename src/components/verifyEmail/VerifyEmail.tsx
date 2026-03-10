import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authApi} from "../../api/auth.ts";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import style from '../verifyEmail/VerifyEmail.module.css';
import { toast } from "react-hot-toast";

export const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Проверяем Вашу ссылку...');

    // Защита от двойного рендера в React 18 (StrictMode)
    const hasAttempted = useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Ссылка недействительна. Токен отсутствует.');
            return;
        }

        if (hasAttempted.current) return;
        hasAttempted.current = true;

        const verifyToken = async () => {
            try {
                const response = await authApi.verifyEmail(token);
                setStatus('success');
                setMessage(response.message || 'Email успешно подтвержден!');

                toast.success('Регистрация успешна! Теперь можете войти.')

            } catch (err: any) {
                setStatus('error');
                // Достаем сообщение об ошибке с бэкенда (если оно есть)
                const errorMsg = err.response?.data?.message || err.response?.data || 'Не удалось подтвердить email. Возможно, ссылка устарела.';
                setMessage(errorMsg);
            }
        };

        verifyToken();
    }, [token]);

    return (
                <div className={style.pageContainer}>
                    <div className={style.card}>

                        {status === 'loading' && (
                            <>
                                <Loader2 size={50} color='#AC3B61' className={style.spinner} />
                                <h2 className={`${style.title} ${style.titleLoading}`}>Подтверждение...</h2>
                                <p className={style.message}>Подождите пару секунд, мы проверяем вашу ссылку.</p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <CheckCircle size={60} color='#28A745' className={style.icon} />
                                <h2 className={`${style.title} ${style.titleSuccess}`}>Успешно!</h2>
                                <p className={style.message}>{message}</p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={style.button}
                                >
                                    Войти в аккаунт
                                </button>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <XCircle size={60} color='#DC3545' className={style.icon} />
                                <h2 className={`${style.title} ${style.titleError}`}>Упс, ошибка</h2>
                                <p className={style.message}>{message}</p>
                                <Link to='/register' className={style.link}>
                                    Вернуться к регистрации
                                </Link>
                            </>
                        )}
                    </div>
                </div>
    )
}