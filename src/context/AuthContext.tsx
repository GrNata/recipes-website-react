// данные о пользователе удобно хранить в Context,
// чтобы любая кнопка на любой странице знала: «Я сейчас админ» или «Я гость».

import React, { createContext, useContext, useState, useEffect } from "react";
import type { TokenResponse } from "../api/auth";
// import {data} from "react-router-dom";

interface AuthContextType {
    user: TokenResponse['userInfo'] | null;
    login: (data: TokenResponse) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> =
    ({ children }) => {
    const [user, setUser] = useState<TokenResponse['userInfo'] | null>(null);

    useEffect(() => {
    //     При загрузке проверяем, есть ли данные в localStorage
        const email = localStorage.getItem('userEmail');
        // const savedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const savedRolesRaw = localStorage.getItem('userRoles') ;
        const token = localStorage.getItem('accessToken');

        // if (token && email && savedRoles) {
        if (token && email && savedRolesRaw) {
            try {
                // Парсим только один раз!
                // const parsedRoles = JSON.parse(savedRoles);
                const parsedRoles = JSON.parse(savedRolesRaw);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setUser({
                    email: email,
                    roles: parsedRoles
                });
            } catch (e) {
                console.error("Ошибка парсинга ролей из localStorage:", e);
                localStorage.clear(); // Если данные битые, лучше очистить
            }
        }
    }, []);

    const login = (data: TokenResponse) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userEmail', data.userInfo.email);
        localStorage.setItem('userRoles', JSON.stringify(data.userInfo.roles));

        // 2. Обновляем состояние React (чтобы интерфейс перерисовывался СРАЗУ)
        setUser({
                email: data.userInfo.email,
                roles: data.userInfo.roles
            }
        );
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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



