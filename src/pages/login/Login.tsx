import  React,  {  useState } from "react";
import { authApi } from '../../api/auth.ts';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import {useAuth} from "../../context/AuthContext.tsx";

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

    return (
        <div style={{ display: "flex", justifyContent: 'center', marginTop: '100px'}}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '10px' }}>
                <h2>Вход в систему</h2>
                {error && <div style={{ color: 'red' }}>{error}</div> }
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Войти</button>
            </form>
        </div>
    );
};

export default  Login;