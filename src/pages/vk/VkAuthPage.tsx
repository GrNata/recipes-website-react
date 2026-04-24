import React, { useEffect} from "react";
import { useNavigate} from "react-router-dom";
import { toast } from "react-hot-toast";
import * as VKID from '@vkid/sdk';
import { useAuth} from "../../context/AuthContext.tsx";

export const VkAuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // useEffect(() => {
    //     // VK ID SDK возвращает данные в параметре ?payload=...
    //     const urlParams = new URLSearchParams(window.location.search);
    //     const payloadStr = urlParams.get('payload');
    //
    //     if (payloadStr) {
    //         try {
    //             // Превращаем текст от ВКонтакте в удобный объект
    //             const payload = JSON.parse(payloadStr);
    //             // Достаем нужные нам данные
    //             const accessToken = payload.token;
    //             const  userId = payload.user?.id?.toString();
    //             const email = payload.user?.email || null;      //  Почта может быть пустой, если юзер не дал доступ
    //
    //             if (accessToken && userId) {
    //                 // Отправляем на наш Spring Boot!
    //                 sendTokenToBackend(accessToken, userId, email);
    //             } else {
    //                 toast.error('ВКонтакте не вернул необходимые данные.');
    //                 navigate('/');
    //             }
    //         } catch (error) {
    //             console.error("Ошибка при чтении данных от ВКонтакте:", error);
    //             toast.error('Ошибка обработки ответа от ВКонтакте.');
    //             navigate('/');
    //         }
    //     } else {
    //         toast.error('ВКонтакте не вернул токен. Попробуйте еще раз.');
    //         navigate('/');
    //     }
    // }, [navigate]);

    useEffect(() => {
        const processVkResponse = async () => {
            // 1. Инициализируем SDK
            VKID.Config.init({
                app: 54531497,
                redirectUrl: 'https://cooking-in-home.ru/vk-auth',
            });

            // Достаем нужные параметры из адресной строки
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const deviceId = urlParams.get('device_id') || ''; // ВК может прислать пустой device_id, это нормально
            const payloadStr = urlParams.get('payload');

            try {
                // Если ВК прислал нам код безопасности
                if (code) {
                    // 2. Передаем строго то, что просит TypeScript: code и deviceId
                    const vkResponse = await VKID.Auth.exchangeCode(code, deviceId);
                    console.log('🔥 Данные расшифрованы SDK:', vkResponse);

                    // 3. Берем данные строго по типам ВКонтакте
                    const accessToken = vkResponse.access_token;
                    const userId = vkResponse.user_id.toString();

                    // TS не знает про email в базовом интерфейсе, просим его закрыть на это глаза
                    const email = (vkResponse as any).email || null;

                    console.log("email-1: ", email);

                    if (accessToken && userId) {
                        sendTokenToBackend(accessToken, userId, email);
                    } else {
                        toast.error('ВКонтакте не вернул токен доступа.');
                        navigate('/');
                    }
                }
                // Резервный вариант: если ВК решил прислать сразу payload
                else if (payloadStr) {
                    const payload = JSON.parse(payloadStr);
                    const accessToken = payload.access_token || payload.token;
                    const userId = (payload.user_id || payload.user?.id)?.toString();
                    const email = payload.email || payload.user?.email || null;

                    console.log("email-2: ", email)

                    if (accessToken && userId) {
                        sendTokenToBackend(accessToken, userId, email);
                    } else {
                        toast.error('Неверный формат ответа от ВК.');
                        navigate('/');
                    }
                } else {
                    toast.error('ВКонтакте не вернул данные авторизации.');
                    navigate('/');
                }
            } catch (error) {
                console.error("Ошибка при обмене кода VK:", error);
                toast.error('Произошла ошибка при связи с ВКонтакте.');
                navigate('/');
            }
        };

        processVkResponse();
    }, [navigate]);

    const sendTokenToBackend = async (accessToken: string, userId: string, email: string | null) => {
        try {
            const response = await fetch('/api/auth/vk', {
                method: 'POST',
                headers: {'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, userId, email})
            });

            if (response.ok) {
                const data = await response.json();
                console.log('🔥 УСПЕХ! Ответ от Spring Boot:', data);
                toast.success('Успешный вход через ВКонтакте!');

                // ПОЗЖЕ: Здесь мы будем брать data.accessToken (ваш JWT)
                // и сохранять его в localStorage:
                // localStorage.setItem('token', data.accessToken);
                // 🔥 СОХРАНЯЕМ ПОЛЬЗОВАТЕЛЯ И ЕГО ТОКЕН:
                login(data);
                toast.success('Успешный вход через ВКонтакте!');

                navigate('/');
            } else {
                throw new Error('Spring Boot вернул ошибку (VK)');
            }
        } catch (error) {
            console.error('Ошибка при отправке токена на бэкенд:', error);
            toast.error('Не удалось связаться с сервером');
            navigate('/');
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>Авторизация через ВКонтакте...</h2>
            <p>Пожалуйста, подождите, мы связываемся с сервером ⏳</p>
        </div>
    )
}