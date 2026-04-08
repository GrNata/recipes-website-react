import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
    Users,
    BookOpen,
    BarChart2,
    Activity,
    ShieldAlert,
    CookingPot,
    Bell,
    ChevronUp,
    ChevronDown, Weight
} from "lucide-react";
import style from './Adminlayout.module.css';

//Обертка с боковым меню

const AdminLayout: React.FC = () => {

    // На компьютерах меню открыто, на мобилках - закрыто
    // const isMobile = window.innerWidth <= 768;
    const isMobile = window.innerWidth <= 1024;
    const [isMenuOpen, setIsMenuOpen] = useState(!isMobile);

    // Функция: закрываем меню после клика по ссылке (только на телефонах)
    const closeMenuOnMobile = () => {
        // if (window.innerWidth <= 768) {
        if (window.innerWidth <= 1024) {
            setIsMenuOpen(false);
        }
    };

    return (
        <div className={style.adminContainer}>
            {/* Левое боковое меню Админа */}
            <aside className={style.sidebar}>

                {/* Заголовок-кнопка (кликабелен только на мобилках) */}
                <div
                    className={style.sidebarHeader}
                    onClick={() => isMobile && setIsMenuOpen(!isMenuOpen)}
                >
                    <h2 className={style.sidebarTitle}>
                        <ShieldAlert size={24} /> Админ-панель
                    </h2>
                    {/* Кнопка-стрелочка (видна только на мобилках) */}
                    <button className={style.mobileToggleBtn}>
                        {/*{isMenuOpen ? <ChevronUp size={24} color='#AC3B61' /> : <ChevronDown size={24} color='#AC3B61' /> }*/}
                        {isMenuOpen ? <ChevronUp size={24} color='var(--accent-main)' /> : <ChevronDown size={24} color='#AC3B61' /> }
                    </button>
                </div>

                {/* Навигация (скрывается на мобилках, если isMenuOpen === false) */}
                <nav className={`${style.navMenu} ${isMenuOpen ? style.open : ''}`}>
                    <NavLink
                        to='/admin/users'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <Users size={20} /> Пользователи
                    </NavLink>
                    <NavLink
                        to='/admin/ingredients'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <CookingPot size={20} /> Ингредиенты
                    </NavLink>
                    <NavLink
                        to='/admin/categories'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <BookOpen size={20} /> Категории
                    </NavLink>
                    <NavLink
                        to='/admin/statistics'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <BarChart2 size={20} /> Статистика
                    </NavLink>
                    <NavLink
                        to='/admin/audit'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <Activity size={20} /> Аудит-логи
                    </NavLink>
                    <NavLink
                        to='/admin/feedback'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <Bell size={20} /> Обращения
                    </NavLink>
                    <NavLink
                        to='/admin/recipes'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <CookingPot size={20} /> Рецепты
                    </NavLink>
                    <NavLink
                        to='/admin/conversions'
                        className={({isActive}) => isActive ? style.activeLink : style.link}
                        onClick={() => closeMenuOnMobile()}
                    >
                        <Weight size={20} /> Конвертор (меры и веса)
                    </NavLink>
                </nav>
            </aside>

            {/* Правая часть: Динамический контент (Вкладки) */}
            <main className={style.mainContent}>
                <Outlet /> {/* Сюда будут подставляться таблицы и графики */ }
            </main>
        </div>
    );
};

export default AdminLayout;