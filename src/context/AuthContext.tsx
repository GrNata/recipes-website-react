// данные о пользователе удобно хранить в Context,
// чтобы любая кнопка на любой странице знала: «Я сейчас админ» или «Я гость».

import React, { createContext, useContext, useState, useEffect } from "react";
import type { TokenResponse } from "../api/auth";
import {apiClient} from '../api/axios';
// import {data} from "react-router-dom";

interface UserInfoDto {
    email: string,
    roles: string[],
    username: string
}

interface AuthContextType {
    user: TokenResponse['userInfo'] | null;
    login: (data: TokenResponse) => void;
    logout: () => void;
    isAuthenticated: boolean;
    // ДОБАВЛЯЕМ ЭТУ СТРОКУ:
    updateUserContext: (updatedUser: UserInfoDto) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> =
    ({ children }) => {
    const [user, setUser] = useState<TokenResponse['userInfo'] | null>(null);

        // --- 🔥 НОВЫЙ БЛОК: ИНТЕГРАЦИЯ С ТЕЛЕГРАМ 🔥 ---
    const tg = (window as any).Telegram?.WebApp;

        useEffect(() => {
            // Проверяем, загрузилось ли приложение внутри Telegram
            if (tg && tg.initDataUnsafe?.user) {

                // Расширяем Mini App на всю высоту (опционально, но так красивее)
                tg.expand();
                // Говорим Телеграму: "Мы загрузились, можно убирать лоадер!"
                tg.ready();

                // Выводим данные в консоль для проверки
                console.log("🚀 УРА! Приложение открыто в Telegram Mini App!");
                console.log("Данные пользователя Telegram:", tg.initDataUnsafe.user);
                console.log("Строка безопасности для бэкенда:", tg.initData);

                // TODO: Чуть позже мы добавим сюда вызов функции:
                // apiAuth.telegramLogin(tg.initData).then(data => login(data));

                const tgUser = tg.initDataUnsafe.user;

                // Вызываем наш API
                apiClient.post('/auth/telegram', {
                    telegramId: tgUser.id,
                    username: tgUser.username,
                    // firstName: tgUser.first_name
                    firstName: tgUser.firstName
                }).then(response => {
                    // Если бэкенд ответил успешно, "логиним" пользователя в React!
                    login(response.data);
                    console.log("✅ Успешная авторизация через Telegram!");
                }).catch(error => {
                    console.error("❌ Ошибка авторизации Telegram:", error);
                })

            } else {
                console.log("🌍 Приложение открыто в обычном браузере");
            }
        }, []);

    //  ----------------------------------------------

    useEffect(() => {
    //     При загрузке проверяем, есть ли данные в localStorage
        const email = localStorage.getItem('userEmail');
        const username = localStorage.getItem('username');
        // const savedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const savedRolesRaw = localStorage.getItem('userRoles') ;
        const token = localStorage.getItem('accessToken');

        // if (token && email && savedRoles) {
        if (token && email && savedRolesRaw && username) {
            try {
                // Парсим только один раз!
                // const parsedRoles = JSON.parse(savedRoles);
                const parsedRoles = JSON.parse(savedRolesRaw);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser({
                    email: email,
                    roles: parsedRoles,
                    username: (username ? username : '')
                });

                // ДОБАВЛЯЕМ ПРОВЕРКУ:
                // Пытаемся сделать любой легкий запрос на бэкенд с текущим токеном.
                // Например, запросить "Мои рецепты" или специально созданный эндпоинт.
                // Если AxiosInterceptor (в axios.ts) поймает 401, он сам сделает logout() и очистит localStorage!
                apiClient.get('/auth/me')
                    .catch((error) => {
                        // Если сервер ответил ошибкой (пользователь удален из БД)
                        // if (error.response) {
                        if (error.response?.status === 401
                            || error.response?.status === 403
                            || error.response?.status === 404
                            || error.response?.status === 500) {
                            console.warn("Пользователь не найден в базе. Очищаем данные.");
                            localStorage.clear();
                            setUser(null);
                        }
                    });

            } catch (e) {
                console.error("Ошибка парсинга ролей из localStorage:", e);
                localStorage.clear(); // Если данные битые, лучше очистить
            }
        }

        // --- 2. НОВЫЙ КОД: Слушатель кастомного события из Axios ---
        const handleForceLogout = () => {
            console.warn("AuthContext поймал сигнал разлогинивания от Axios!");
            setUser(null); // Мгновенно затираем стейт (имя пропадает из TopBar)
        };

        // Подписываемся на событие
        window.addEventListener('auth-logout', handleForceLogout);

        // Отписываемся при размонтировании компонента, чтобы избежать утечек памяти
        return () => {
            window.removeEventListener('auth-logout', handleForceLogout);
        };

    }, []);

    const login = (data: TokenResponse) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userEmail', data.userInfo.email);
        // localStorage.setItem('username', data.userInfo.username);
        localStorage.setItem('userRoles', JSON.stringify(data.userInfo.roles));

        // Надежно достаем username (вдруг он был сохранен в auth.ts иначе)
        const actualUsername = data.userInfo?.username || localStorage.getItem('username') || 'Пользователь';
        // Обязательно сохраняем обратно (на случай если брали из data)
        localStorage.setItem('username', actualUsername);

        // 2. Обновляем состояние React (чтобы интерфейс перерисовывался СРАЗУ)
        setUser({
                email: data.userInfo.email,
                roles: data.userInfo.roles,
                username: actualUsername
            }
        );
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

        // Создаем функцию обновления данных пользователя
    const updateUserContext = (updatedUser: UserInfoDto) => {
        // 1. Обновляем localStorage, чтобы новые имя и email остались после F5
        localStorage.setItem('userEmail', updatedUser.email);
        localStorage.setItem('username', updatedUser.username);
        // Роли обычно не меняются при смене профиля, но для надежности сохраним и их
        if (updatedUser.roles) {
            localStorage.setItem('userRoles', JSON.stringify(updatedUser.roles));
        }

        // 2. Обновляем стейт React, чтобы TopBar сразу показал новое имя
        setUser({
            email: updatedUser.email,
            roles: updatedUser.roles,
            username: updatedUser.username
        });
    };


    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, updateUserContext }}>
            {children}
        </AuthContext.Provider>
    );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};



