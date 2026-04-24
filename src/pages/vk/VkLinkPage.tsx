import React, { useEffect } from "react";
import{ useNavigate} from "react-router-dom";
import { toast} from "react-hot-toast";
import * as VKID from '@vkid/sdk';
import { apiClient } from "../../api/axios.ts";
import { useAuth } from "../../context/AuthContext.tsx";

export const VkLinkPage: React.FC = () => {

    const navigate = useNavigate();
    const { updateUserContext } = useAuth(); // Чтобы обновить данные в интерфейсе, если нужно

    useEffect(() => {
        const processVkResponse = async () => {
            // 1. Инициализируем SDK с НОВЫМ адресом возврата!
            VKID.Config.init({
                app: 54531497,  //  ID приложения
                redirectUrl: 'https://cooking-in-home.ru/profile/vk-link',
            });

            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const deviceId = urlParams.get('device_id') || '';
            const payloadStr = urlParams.get('payload');

            try {
                if (code) {
                    const vkResponse = await VKID.Auth.exchangeCode(code, deviceId);

                    const accessToken = vkResponse.access_token;
                    const userId = vkResponse.user_id.toString();
                    const email = (vkResponse as any).email || null;

                    if (accessToken && userId) {
                        sendLinkRequest(accessToken, userId, email);
                    } else {
                        toast.error('ВКонтакте не вернул токен.');
                        navigate('/profile'); // Возвращаем в профиль при ошибке
                    }
                } else if (payloadStr) {
                    const payload = JSON.parse(payloadStr);
                    const accessToken = payload.access_token || payload.token;
                    const userId = (payload.user_id || payload.user?.id)?.toString();
                    const email = payload.email || payload.user?.email || null;

                    if (accessToken && userId) {
                        sendLinkRequest(accessToken, userId, email);
                    } else {
                        toast.error('Неверный формат ответа от ВК.');
                        navigate('/profile');
                    }
                } else {
                    toast.error('Неверный формат ответа от ВК.');
                    navigate('/profile');
                }
            } catch (error) {
                console.error("Ошибка при обмене кода VK:", error);
                toast.error('Ошибка при связи с ВКонтакте.');
                navigate('/profile');
            }
        };

        processVkResponse();
    }, [navigate]);

    const sendLinkRequest = async (accessToken: string, userId: string, email: string | null) => {
        try {
            // 🔥 ВАЖНО: Отправляем на /auth/link-vk через apiClient (с токеном юзера)
            const response = await apiClient.post('/auth/link-vk', {
                accessToken,
                userId,
                email
            });

            console.log('🔥 УСПЕХ! Ответ от Spring Boot:', response.data);
            toast.success('ВКонтакте успешно привязан! 🎉');

            // Если бэкенд вернул обновленные данные пользователя, обновляем контекст
            if (updateUserContext && response.data) {
                updateUserContext(response.data);
            }

            // Успешно привязали — возвращаем пользователя в Личный кабинет
            navigate('/profile');
        } catch (error: any) {
            console.error('Ошибка при привязке ВК:', error);
            const errorMessage = error.response?.data?.error || 'Не удалось привязать ВКонтакте ❌';
            toast.error(errorMessage);
            navigate('/profile');

        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>Привязка ВКонтакте...</h2>
            <p>Пожалуйста, подождите, мы связываем аккаунты ⏳</p>
        </div>
    )

};

// export default VkLinkPage